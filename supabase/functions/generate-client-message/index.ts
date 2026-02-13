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

    const { goal, projectContext, materialContext, voiceExample, useEmoji, length } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um copywriter brasileiro especialista em mensagens de WhatsApp profissionais.

REGRAS ABSOLUTAS:
- Gere texto com cara de WhatsApp: frases curtas, quebras de linha naturais, tom humano
- Português BR informal-profissional
- NÃO invente informações — use SOMENTE os dados fornecidos
- Se faltar um dado, use placeholder como "[confirmar data]"
- ${useEmoji ? 'Use emojis moderadamente (1-3 por mensagem)' : 'NÃO use emojis'}
- Gere EXATAMENTE 3 variações: curta, normal e completa
- Retorne um JSON válido com: { "short": "...", "normal": "...", "long": "..." }

${voiceExample ? `ESTILO DE VOZ DO USUÁRIO (imite este padrão):\n"${voiceExample}"` : ''}

OBJETIVO DA MENSAGEM: ${goal}

CONTEXTO DO PROJETO:
${JSON.stringify(projectContext, null, 2)}

${materialContext ? `MATERIAL SENDO ENVIADO:\n${JSON.stringify(materialContext, null, 2)}` : ''}

Comprimento desejado: ${length || 'normal'}`;

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
          { role: "user", content: `Gere 3 variações da mensagem para o objetivo "${goal}". Retorne APENAS o JSON, sem markdown.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), {
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
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from the response
    let variants;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      variants = JSON.parse(cleaned);
    } catch {
      variants = { short: content, normal: content, long: content };
    }

    return new Response(JSON.stringify({ variants }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-client-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
