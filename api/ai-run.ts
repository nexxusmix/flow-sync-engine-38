/**
 * Vercel Serverless Function — AI Run Proxy
 * Handles structured AI actions (generate copy, ideas, briefs, etc.)
 * Converts to Claude API format and returns OpenAI-compatible response.
 */

interface RequestBody {
  actionKey: string;
  input: any;
  entityType?: string;
  entityId?: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  "marketing.generateCopy": "Voce e um copywriter premium para agencias criativas brasileiras. Gere copy persuasivo, criativo e alinhado com o tom de voz da marca. Responda em portugues brasileiro.",
  "marketing.generateIdeas": "Voce e um estrategista de conteudo digital para agencias criativas brasileiras. Gere ideias originais, relevantes e com potencial de engajamento. Responda em portugues brasileiro.",
  "projects.generateBrief": "Voce e um diretor criativo experiente em agencias premium. Gere briefings completos, estruturados e acionaveis. Responda em portugues brasileiro.",
};

const DEFAULT_SYSTEM = "Voce e o Polo AI, assistente inteligente do SQUAD Hub - plataforma de gestao para agencias criativas. Responda em portugues brasileiro de forma profissional e direta.";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const body: RequestBody = await req.json();
    const systemPrompt = SYSTEM_PROMPTS[body.actionKey] || DEFAULT_SYSTEM;
    const userMessage = typeof body.input === "string" ? body.input : JSON.stringify(body.input, null, 2);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return new Response(JSON.stringify({ error: `Claude API: ${anthropicRes.status}`, details: err }), {
        status: anthropicRes.status, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");

    // Try to parse as JSON (for structured responses)
    let result: any = text;
    try { result = JSON.parse(text); } catch { /* keep as string */ }

    return new Response(JSON.stringify({
      choices: [{ message: { content: text } }],
      result,
      provider: "anthropic",
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}

export const config = { runtime: "edge" };
