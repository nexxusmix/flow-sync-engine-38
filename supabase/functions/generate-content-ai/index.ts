import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contentItemId, title, hook, channel, format, pillar, notes, brandContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build context prompt
    const contextParts: string[] = [];
    if (title) contextParts.push(`Título: ${title}`);
    if (hook) contextParts.push(`Hook/Gancho: ${hook}`);
    if (channel) contextParts.push(`Canal: ${channel}`);
    if (format) contextParts.push(`Formato: ${format}`);
    if (pillar) contextParts.push(`Pilar editorial: ${pillar}`);
    if (notes) contextParts.push(`Notas/Briefing: ${notes}`);
    if (brandContext) contextParts.push(`Contexto da marca: ${brandContext}`);

    const systemPrompt = `Você é um especialista em criação de conteúdo para redes sociais. Gere conteúdo profissional em português do Brasil.

Dado o briefing abaixo, gere:
1. Um roteiro completo (script) para o conteúdo
2. Uma legenda curta (até 150 caracteres)
3. Uma legenda longa (até 2200 caracteres, formatada com emojis e quebras de linha)
4. Hashtags relevantes (10-15 hashtags)
5. Um CTA (call-to-action) claro e direto

Retorne em formato estruturado usando a ferramenta fornecida.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextParts.join("\n") },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_content",
              description: "Generate structured content for a social media post",
              parameters: {
                type: "object",
                properties: {
                  script: { type: "string", description: "Full script/roteiro for the content, with clear sections" },
                  caption_short: { type: "string", description: "Short caption up to 150 chars" },
                  caption_long: { type: "string", description: "Long caption up to 2200 chars with emojis" },
                  hashtags: { type: "string", description: "Hashtags separated by spaces, each starting with #" },
                  cta: { type: "string", description: "Clear call-to-action" },
                },
                required: ["script", "caption_short", "caption_long", "hashtags", "cta"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_content" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Configurações." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured output");
    }

    const generated = JSON.parse(toolCall.function.arguments);

    // Save to content_scripts table
    if (contentItemId) {
      await supabase.from("content_scripts").insert({
        content_item_id: contentItemId,
        script: generated.script,
        cta: generated.cta,
        hashtags: generated.hashtags.split(/\s+/).filter((h: string) => h.startsWith("#")),
        caption_variations: [
          { type: "short", text: generated.caption_short },
          { type: "long", text: generated.caption_long },
        ],
        ai_generated: true,
      });

      // Also update the content_item with generated fields
      await supabase.from("content_items").update({
        script: generated.script,
        caption_short: generated.caption_short,
        caption_long: generated.caption_long,
        hashtags: generated.hashtags,
        cta: generated.cta,
        hook: generated.caption_short?.slice(0, 80) || hook,
      }).eq("id", contentItemId);
    }

    return new Response(JSON.stringify({ success: true, generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
