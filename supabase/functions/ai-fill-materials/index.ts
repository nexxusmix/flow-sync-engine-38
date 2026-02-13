import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { error: authErr } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { files, projectContext } = await req.json();
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error("files array required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const fileDescriptions = files.map((f: any, i: number) => 
      `${i + 1}. "${f.fileName}" (${f.mimeType}, ${f.fileSize})`
    ).join("\n");

    const hasImages = files.some((f: any) => f.imageBase64);

    const prompt = `Analise estes arquivos de um projeto audiovisual/criativo e gere títulos e descrições curtas para cada um.

${projectContext ? `Contexto do projeto fornecido pelo usuário: ${projectContext}` : ""}

Arquivos:
${fileDescriptions}

Para cada arquivo, gere:
- title: título limpo e profissional (sem extensão, máx 60 chars)
- description: descrição curta em 1 linha sobre o que provavelmente é o arquivo

${hasImages ? "IMPORTANTE: Algumas imagens foram enviadas junto. Analise visualmente o conteúdo de cada imagem para gerar títulos e descrições mais precisos e contextualizados." : ""}

Retorne um JSON array na mesma ordem dos arquivos:
[{"title": "...", "description": "..."}, ...]

IMPORTANTE: Retorne APENAS o JSON array, sem markdown, sem explicação.`;

    // Build multimodal content array
    const contentParts: any[] = [{ type: "text", text: prompt }];

    // Add images as vision content
    for (const f of files) {
      if (f.imageBase64) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${f.mimeType || 'image/jpeg'};base64,${f.imageBase64}`,
          },
        });
      }
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: hasImages ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um assistente que analisa nomes de arquivos e imagens de projetos criativos/audiovisuais e gera títulos profissionais. Quando imagens são fornecidas, analise visualmente o conteúdo. Responda sempre em JSON puro." },
          { role: "user", content: hasImages ? contentParts : prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let results;
    try {
      results = JSON.parse(jsonStr);
    } catch {
      console.warn("Failed to parse AI response:", content);
      results = files.map((f: any) => ({
        title: f.fileName.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        description: `Arquivo ${f.mimeType?.split("/")[0] || ""}`,
      }));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-fill-materials error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
