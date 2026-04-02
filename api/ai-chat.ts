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

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  try {
    const body: RequestBody = await req.json();
    const { system, msgs } = convertMessages(body.messages || []);
    const model = "claude-sonnet-4-20250514";

    const anthropicBody: Record<string, unknown> = {
      model,
      messages: msgs,
      max_tokens: body.max_tokens || 4096,
      stream: !!body.stream,
    };
    if (system) anthropicBody.system = system;
    if (body.temperature !== undefined) anthropicBody.temperature = body.temperature;
    if (body.tools?.length) {
      anthropicBody.tools = convertTools(body.tools);
      if (body.tool_choice === "auto") anthropicBody.tool_choice = { type: "auto" };
      else if (body.tool_choice === "required") anthropicBody.tool_choice = { type: "any" };
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
    if (body.stream && anthropicRes.body) {
      const reader = anthropicRes.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";

      const stream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  choices: [{ delta: { content: event.delta.text }, index: 0, finish_reason: null }],
                })}\n\n`));
              } else if (event.type === "message_stop") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  choices: [{ delta: {}, index: 0, finish_reason: "stop" }],
                })}\n\n`));
              }
            } catch { /* skip */ }
          }
        },
      });

      return new Response(stream, {
        headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
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

export const config = {
  runtime: "edge",
};
