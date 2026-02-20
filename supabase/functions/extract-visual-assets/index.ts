import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { project_id, files, uploaded_by_user_id } = body as {
      project_id: string;
      files: Array<{ name: string; base64: string; mime_type: string; size_bytes: number }>;
      uploaded_by_user_id?: string;
    };

    if (!project_id || !files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'project_id and files are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get workspace_id for the project
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', project_id)
      .single();

    const workspace_id = project?.workspace_id;

    const savedAssets: any[] = [];

    for (const fileData of files) {
      // Skip files over 10MB to prevent OOM
      const MAX_SIZE = 10 * 1024 * 1024;
      if (fileData.size_bytes > MAX_SIZE || fileData.base64.length > MAX_SIZE) {
        console.log(`Skipping ${fileData.name} - exceeds 10MB limit (${fileData.size_bytes} bytes)`);
        continue;
      }

      const isImage = fileData.mime_type.startsWith('image/');
      const isPdf = fileData.mime_type === 'application/pdf';
      const isDoc = fileData.mime_type.includes('word') || fileData.mime_type.includes('document');

      // AI analysis prompt
      const analysisPrompt = `Você é um especialista em análise visual de documentos. Analise este arquivo e extraia TODAS as informações visuais e de identidade.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "document_type": "contrato | proposta | briefing | referencia | identidade_visual | outro",
  "brand_name": "nome da empresa/marca detectada ou null",
  "has_logo": true,
  "has_signature": false,
  "has_legal_seal": false,
  "color_palette": ["#HEX1", "#HEX2"],
  "assets_found": [
    {
      "type": "logo | assinatura | carimbo | foto | ilustracao | paleta | diagrama | tabela | outro",
      "description": "descrição detalhada do elemento",
      "location": "localização no documento",
      "confidence": 0.95,
      "suggested_category": "reference | deliverable | contract | other",
      "tags": ["tag1", "tag2"],
      "ai_summary": "resumo de contexto do elemento"
    }
  ],
  "document_summary": "resumo do que o documento contém",
  "scope_items": ["item1", "item2"],
  "key_data": {
    "client_name": "nome ou null",
    "company": "empresa ou null",
    "contract_value": 0,
    "dates": []
  }
}

Identifique logos, assinaturas, carimbos, fotos, ilustrações, paletas de cores, diagramas, tabelas.`;

      // Build AI content parts - only send images/PDFs under 5MB base64 to AI
      const MAX_AI_BASE64 = 5 * 1024 * 1024;
      const contentParts: any[] = [{ type: 'text', text: analysisPrompt }];
      const canSendToAI = fileData.base64.length <= MAX_AI_BASE64;

      if (canSendToAI && isImage) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:${fileData.mime_type};base64,${fileData.base64}` }
        });
      } else if (canSendToAI && isPdf) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: `data:application/pdf;base64,${fileData.base64}` }
        });
      } else {
        console.log(`${fileData.name} too large for AI analysis (${fileData.base64.length} chars), storing without AI`);
      }

      let analysisResult: any = null;
      if (canSendToAI) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: contentParts }],
              max_tokens: 2000,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const rawText = aiData.choices?.[0]?.message?.content || '';
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try { analysisResult = JSON.parse(jsonMatch[0]); }
              catch { console.error('Failed to parse AI JSON response'); }
            }
          } else {
            console.error('AI request failed:', await aiResponse.text());
          }
        } catch (e) {
          console.error('AI analysis error:', e);
        }
      }

      // Save the original file to storage
      const ts = Date.now();
      const sanitizedName = fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const ext = fileData.name.split('.').pop() || '';
      const storagePath = `${project_id}/assets/${ts}_${sanitizedName}`;

      // Convert base64 to bytes efficiently
      const binaryStr = atob(fileData.base64);
      const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));

      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(storagePath, bytes, { contentType: fileData.mime_type });

      if (uploadErr) {
        console.error('Storage upload error:', uploadErr);
        continue;
      }

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(storagePath);

      // Generate thumbnail for PDFs via Gemini image generation
      let thumbUrl: string | null = isImage ? urlData.publicUrl : null;

      if (isPdf && canSendToAI) {
        try {
          const thumbResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image',
              messages: [{
                role: 'user',
                content: [
                  { type: 'text', text: 'Generate a clean thumbnail preview image for this PDF document. Show the first page layout as a visual preview.' },
                  { type: 'image_url', image_url: { url: `data:application/pdf;base64,${fileData.base64}` } }
                ]
              }],
              modalities: ['image', 'text'],
            }),
          });

          if (thumbResponse.ok) {
            const thumbData = await thumbResponse.json();
            const generatedImage = thumbData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (generatedImage && generatedImage.startsWith('data:image/')) {
              // Extract base64 from data URL and save to storage
              const [meta, imgBase64] = generatedImage.split(',');
              const mimeMatch = meta.match(/data:([^;]+)/);
              const imgMime = mimeMatch?.[1] || 'image/png';
              const imgExt = imgMime.split('/')[1] || 'png';
              const thumbPath = `${project_id}/thumbs/thumb_${ts}.${imgExt}`;

              const imgBinary = atob(imgBase64);
              const imgBytes = Uint8Array.from(imgBinary, (c) => c.charCodeAt(0));

              const { error: thumbUploadErr } = await supabase.storage
                .from('project-files')
                .upload(thumbPath, imgBytes, { contentType: imgMime });

              if (!thumbUploadErr) {
                const { data: thumbUrlData } = supabase.storage.from('project-files').getPublicUrl(thumbPath);
                thumbUrl = thumbUrlData.publicUrl;
                console.log(`Generated PDF thumbnail for ${fileData.name}: ${thumbPath}`);
              } else {
                console.error('Thumb upload error:', thumbUploadErr);
              }
            }
          } else {
            console.log('PDF thumbnail generation failed, using fallback');
          }
        } catch (thumbErr) {
          console.error('PDF thumbnail error:', thumbErr);
        }
      }

      // Determine asset type and category from AI analysis
      const docType = analysisResult?.document_type || 'outro';
      const category = docType === 'contrato' ? 'contract' :
                       docType === 'identidade_visual' ? 'reference' :
                       docType === 'referencia' ? 'reference' : 'other';

      const assetType = isImage ? 'image' : isPdf ? 'pdf' : 'other';
      const aiTags = analysisResult?.assets_found?.flatMap((a: any) => a.tags || []) || [];
      const uniqueTags = [...new Set(aiTags)] as string[];

      // Build AI summary
      const aiTitle = analysisResult?.brand_name
        ? `${analysisResult.brand_name} — ${fileData.name.replace(/\.[^.]+$/, '')}`
        : fileData.name.replace(/\.[^.]+$/, '');

      const aiSummary = analysisResult?.document_summary || null;

      // Insert main asset record
      const { data: assetRecord, error: insertErr } = await supabase
        .from('project_assets')
        .insert({
          project_id,
          workspace_id,
          uploaded_by_user_id: uploaded_by_user_id || null,
          source_type: 'file',
          asset_type: assetType,
          title: fileData.name.replace(/\.[^.]+$/, ''),
          category: category as any,
          visibility: 'internal',
          storage_bucket: 'project-files',
          storage_path: storagePath,
          file_name: fileData.name,
          file_ext: ext,
          mime_type: fileData.mime_type,
          file_size_bytes: fileData.size_bytes,
          thumb_url: thumbUrl,
          status: 'ready',
          ai_title: aiTitle,
          ai_summary: aiSummary,
          ai_tags: uniqueTags.length > 0 ? uniqueTags : null,
          ai_entities: analysisResult ? {
            document_type: analysisResult.document_type,
            brand_name: analysisResult.brand_name,
            has_logo: analysisResult.has_logo,
            has_signature: analysisResult.has_signature,
            has_legal_seal: analysisResult.has_legal_seal,
            color_palette: analysisResult.color_palette,
            assets_found: analysisResult.assets_found,
            key_data: analysisResult.key_data,
            scope_items: analysisResult.scope_items,
          } : null,
          ai_processed: analysisResult !== null,
          ai_confidence: analysisResult ? 0.85 : null,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('DB insert error:', insertErr);
        continue;
      }

      savedAssets.push({
        ...assetRecord,
        analysis: analysisResult,
        public_url: urlData.publicUrl,
      });

      // If the document has specific visual elements detected, save them as sub-assets
      if (analysisResult?.assets_found && analysisResult.assets_found.length > 0) {
        for (const visualElement of analysisResult.assets_found.slice(0, 5)) {
          if (visualElement.confidence > 0.7) {
            const elementCategory = visualElement.suggested_category || 'reference';
            
            await supabase.from('project_assets').insert({
              project_id,
              workspace_id,
              uploaded_by_user_id: uploaded_by_user_id || null,
              source_type: 'file',
              asset_type: 'other',
              title: visualElement.description?.substring(0, 80) || 'Elemento Visual',
              category: elementCategory as any,
              visibility: 'internal',
              storage_bucket: 'project-files',
              storage_path: storagePath, // reference same file
              file_name: fileData.name,
              file_ext: ext,
              mime_type: fileData.mime_type,
              file_size_bytes: fileData.size_bytes,
              thumb_url: thumbUrl,
              status: 'ready',
              ai_title: `[${visualElement.type?.toUpperCase()}] ${visualElement.description?.substring(0, 60) || 'Elemento'}`,
              ai_summary: `${visualElement.description} — Localização: ${visualElement.location || 'não especificado'}`,
              ai_tags: visualElement.tags || null,
              ai_entities: { element: visualElement, parent_file: fileData.name },
              ai_processed: true,
              ai_confidence: visualElement.confidence,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      assets: savedAssets,
      total: savedAssets.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('extract-visual-assets error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
