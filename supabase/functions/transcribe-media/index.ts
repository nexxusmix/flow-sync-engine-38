import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType, fileName } = await req.json();

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "Arquivo é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Detect document vs audio/video
    const isDocument = (mimeType || '').includes('pdf') ||
                       (mimeType || '').includes('word') ||
                       (mimeType || '').includes('officedocument') ||
                       (fileName || '').match(/\.(pdf|docx?|rtf)$/i);

    const systemContent = isDocument
      ? "Você é um extrator de conteúdo profissional. Extraia todo o texto do documento fornecido preservando a estrutura (títulos, parágrafos, listas). Retorne APENAS o conteúdo textual extraído, sem comentários ou formatação markdown adicional."
      : "Você é um transcritor profissional. Transcreva o áudio/vídeo fornecido com precisão total. Retorne APENAS a transcrição do conteúdo falado, sem comentários, formatação markdown ou explicações. Se houver múltiplos falantes, identifique-os como Falante 1, Falante 2, etc.";

    const userText = isDocument
      ? `Extraia todo o conteúdo textual do seguinte documento (${fileName || 'document'}). Retorne apenas o texto.`
      : `Transcreva o seguinte arquivo de mídia (${fileName || 'audio'}). Retorne apenas o texto transcrito.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || 'application/octet-stream'};base64,${audioBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Erro na API de IA");
    }

    const aiResult = await response.json();
    const transcription = aiResult.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ transcription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("transcribe-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
