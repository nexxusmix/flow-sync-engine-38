import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64: rawBase64, mimeType, fileName, storageBucket, storagePath } =
      await req.json();

    let audioBase64 = rawBase64;

    // Server-side fetch from Supabase Storage (avoids 6MB body limit on client → function)
    if (!audioBase64 && storagePath) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data, error } = await admin.storage
        .from(storageBucket || "project-files")
        .download(storagePath);
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: `Falha ao baixar do storage: ${error?.message || "vazio"}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const buf = new Uint8Array(await data.arrayBuffer());
      audioBase64 = bytesToBase64(buf);
    }

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "Arquivo é obrigatório (audioBase64 ou storagePath)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const aiResult = await chatCompletion({
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
    });

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
