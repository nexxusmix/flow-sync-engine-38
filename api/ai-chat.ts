/**
 * Vercel Serverless Function — Polo AI Chat Proxy
 * Receives OpenAI-format messages, calls Claude API, returns OpenAI-compatible response.
 * Supports both streaming (SSE) and non-streaming modes.
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | any[];
}

interface RequestBody {
  messages: ChatMessage[];
  stream?: boolean;
  context?: any;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: any;
}

function convertMessages(messages: ChatMessage[]): { system: string; msgs: any[] } {
  let system = "";
  const msgs: any[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string"
        ? msg.content
        : (msg.content as any[]).map((c: any) => c.text || "").join("\n");
      system += (system ? "\n\n" : "") + text;
    } else {
      if (typeof msg.content === "string") {
        msgs.push({ role: msg.role, content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const parts: any[] = [];
        for (const part of msg.content) {
          if (part.type === "text") parts.push({ type: "text", text: part.text });
          else if (part.type === "image_url" && part.image_url?.url) {
            const url = part.image_url.url;
            if (url.startsWith("data:")) {
              const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
              if (match) parts.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } });
            }
          }
        }
        msgs.push({ role: msg.role, content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts });
      }
    }
  }

  if (msgs.length > 0 && msgs[0].role === "assistant") {
    msgs.unshift({ role: "user", content: "Continue." });
  }

  return { system, msgs };
}

function convertTools(tools: any[]): any[] {
  return tools.map((t) => {
    if (t.type === "function" && t.function) {
      return {
        name: t.function.name,
        description: t.function.description || "",
        input_schema: t.function.parameters || { type: "object", properties: {} },
      };
    }
    return t;
  });
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handleInstagramConnect(body: any): Promise<Response> {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gfyeuhfapscxfvjnrssn.supabase.co";
  const SUPABASE_ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const username = (body.username || "").replace(/^@/, "").trim();
  if (!username) return new Response(JSON.stringify({ error: "username required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

  // Scrape profile
  let profile: any = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/scrape-instagram-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ username }),
    });
    if (r.ok) { const d = await r.json(); if (d.success) profile = d.data; }
  } catch {}

  // Upsert connection via Supabase (uses anon key - needs RLS to allow)
  const headers = { "Content-Type": "application/json", apikey: SUPABASE_ANON!, Authorization: `Bearer ${SUPABASE_ANON}`, Prefer: "return=representation,resolution=merge-duplicates" };
  await fetch(`${SUPABASE_URL}/rest/v1/instagram_profile_config`, {
    method: "POST", headers,
    body: JSON.stringify({
      workspace_id: body.workspace_id || "00000000-0000-0000-0000-000000000001",
      profile_handle: username,
      profile_name: profile?.full_name || username,
      profile_bio: profile?.bio || "",
      profile_picture_url: profile?.profile_pic || null,
      followers_count: profile?.followers || 0,
      following_count: profile?.following || 0,
      posts_count: profile?.posts_count || 0,
    }),
  });

  return new Response(JSON.stringify({
    success: true,
    profile,
    message: `@${username} conectado! ${profile ? `${profile.followers} seguidores, ${profile.posts_count} posts` : "Dados de perfil salvos."}`,
  }), { headers: { ...CORS, "Content-Type": "application/json" } });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const body = await req.json();

    // Route: Instagram Connect
    if (body._action === "instagram_connect") {
      return handleInstagramConnect(body);
    }

    // Route: AI Chat (default)
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const body2: RequestBody = body as RequestBody;
    const { system, msgs } = convertMessages(body2.messages || []);
    const model = "claude-sonnet-4-20250514";

    const anthropicBody: Record<string, unknown> = {
      model,
      messages: msgs,
      max_tokens: body2.max_tokens || 4096,
      stream: !!body2.stream,
    };
    if (system) anthropicBody.system = system;
    if (body2.temperature !== undefined) anthropicBody.temperature = body2.temperature;
    if (body2.tools?.length) {
      anthropicBody.tools = convertTools(body2.tools);
      if (body2.tool_choice === "auto") anthropicBody.tool_choice = { type: "auto" };
      else if (body2.tool_choice === "required") anthropicBody.tool_choice = { type: "any" };
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      return new Response(JSON.stringify({ error: `Claude API error: ${anthropicRes.status}`, details: err }), {
        status: anthropicRes.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // --- Streaming ---
    if (body2.stream && anthropicRes.body) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Process Anthropic SSE in background
      (async () => {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Anthropic SSE format: "event: type\ndata: json\n\n"
            // Split on double newline to get complete events
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";

            for (const event of events) {
              const dataLine = event.split("\n").find((l: string) => l.startsWith("data: "));
              if (!dataLine) continue;
              const jsonStr = dataLine.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({
                    choices: [{ delta: { content: parsed.delta.text }, index: 0, finish_reason: null }],
                  })}\n\n`));
                } else if (parsed.type === "message_stop") {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({
                    choices: [{ delta: {}, index: 0, finish_reason: "stop" }],
                  })}\n\n`));
                }
              } catch { /* skip malformed */ }
            }
          }
          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // --- Non-streaming ---
    const data = await anthropicRes.json();
    const content = data.content || [];
    let text = "";
    const toolCalls: any[] = [];

    for (const block of content) {
      if (block.type === "text") text += block.text;
      else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: { name: block.name, arguments: typeof block.input === "string" ? block.input : JSON.stringify(block.input) },
        });
      }
    }

    return new Response(JSON.stringify({
      choices: [{ message: { content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) } }],
      provider: "anthropic",
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}

export const config = { runtime: "edge" };
