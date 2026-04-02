/**
 * Unified AI Client with multi-provider fallback
 * Priority: Anthropic Claude → Gemini → OpenAI → Lovable (last resort)
 *
 * All responses are normalized to OpenAI-compatible format so the rest
 * of the system doesn't need to change.
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
  tool_choice?: any;
  response_format?: any;
  stream?: boolean;
  modalities?: string[];
  /** Set true to add Lovable gateway as last-resort fallback (e.g. image generation) */
  includeLovableFallback?: boolean;
}

interface ChatCompletionResult {
  choices: Array<{
    message: {
      content?: string;
      tool_calls?: any[];
      images?: any[];
    };
    delta?: any;
  }>;
  provider: string;
}

// --- Model mappings ---

const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "claude-sonnet-4-20250514",
  "google/gemini-2.5-flash": "claude-sonnet-4-20250514",
  "google/gemini-2.5-pro": "claude-sonnet-4-20250514",
  "openai/gpt-5": "claude-sonnet-4-20250514",
  "gpt-4o": "claude-sonnet-4-20250514",
  "gpt-4o-mini": "claude-sonnet-4-20250514",
  "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
  "claude-opus-4-20250514": "claude-opus-4-20250514",
};

const GEMINI_MODEL_MAP: Record<string, string> = {
  "google/gemini-2.5-flash": "gemini-2.5-flash",
  "google/gemini-2.5-pro": "gemini-2.5-pro",
  "google/gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "google/gemini-3-flash-preview": "gemini-2.5-flash",
  "google/gemini-3-pro-preview": "gemini-2.5-pro",
  "google/gemini-3-pro-image-preview": "gemini-2.0-flash-exp",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-pro",
};

const OPENAI_MODEL_MAP: Record<string, string> = {
  "openai/gpt-5": "gpt-4o",
  "openai/gpt-5-mini": "gpt-4o-mini",
  "openai/gpt-5-nano": "gpt-4o-mini",
  "openai/gpt-5.2": "gpt-4o",
  "gpt-4o": "gpt-4o",
  "gpt-4o-mini": "gpt-4o-mini",
};

function getAnthropicModel(model: string): string {
  return ANTHROPIC_MODEL_MAP[model] || "claude-sonnet-4-20250514";
}

function getGeminiModel(model: string): string {
  return GEMINI_MODEL_MAP[model] || "gemini-2.5-flash";
}

function getOpenAIModel(model: string): string {
  return OPENAI_MODEL_MAP[model] || "gpt-4o-mini";
}

// --- Anthropic Claude ---

function convertMessagesToAnthropic(messages: ChatMessage[]): {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string | any[] }>;
} {
  let system = "";
  const converted: Array<{ role: "user" | "assistant"; content: string | any[] }> = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string"
        ? msg.content
        : msg.content.map((c) => c.text || "").join("\n");
      system += (system ? "\n\n" : "") + text;
    } else if (msg.role === "user" || msg.role === "assistant") {
      if (typeof msg.content === "string") {
        converted.push({ role: msg.role, content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const parts: any[] = [];
        for (const part of msg.content) {
          if (part.type === "text" && part.text) {
            parts.push({ type: "text", text: part.text });
          } else if (part.type === "image_url" && part.image_url?.url) {
            const url = part.image_url.url;
            if (url.startsWith("data:")) {
              const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
              if (match) {
                parts.push({
                  type: "image",
                  source: { type: "base64", media_type: match[1], data: match[2] },
                });
              }
            } else {
              parts.push({ type: "image", source: { type: "url", url } });
            }
          }
        }
        converted.push({ role: msg.role, content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts });
      }
    }
  }

  // Anthropic requires messages to start with a user message
  if (converted.length > 0 && converted[0].role === "assistant") {
    converted.unshift({ role: "user", content: "Continue." });
  }

  return { system, messages: converted };
}

function convertToolsToAnthropic(tools: any[]): any[] {
  return tools.map((tool) => {
    if (tool.type === "function" && tool.function) {
      return {
        name: tool.function.name,
        description: tool.function.description || "",
        input_schema: tool.function.parameters || { type: "object", properties: {} },
      };
    }
    return tool;
  });
}

function convertAnthropicResponseToOpenAI(data: any, provider: string): ChatCompletionResult {
  const content = data.content || [];
  let textContent = "";
  const toolCalls: any[] = [];

  for (const block of content) {
    if (block.type === "text") {
      textContent += block.text;
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: {
          name: block.name,
          arguments: typeof block.input === "string" ? block.input : JSON.stringify(block.input),
        },
      });
    }
  }

  return {
    choices: [
      {
        message: {
          content: textContent || null,
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
      },
    ],
    provider,
  } as ChatCompletionResult;
}

async function tryAnthropic(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const model = getAnthropicModel(opts.model || "claude-sonnet-4-20250514");
  const { system, messages } = convertMessagesToAnthropic(opts.messages);

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.max_tokens || 4096,
  };

  if (system) body.system = system;
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.stream) body.stream = true;

  if (opts.tools && opts.tools.length > 0) {
    body.tools = convertToolsToAnthropic(opts.tools);
    if (opts.tool_choice === "auto") {
      body.tool_choice = { type: "auto" };
    } else if (opts.tool_choice === "required") {
      body.tool_choice = { type: "any" };
    } else if (typeof opts.tool_choice === "object" && opts.tool_choice?.function?.name) {
      body.tool_choice = { type: "tool", name: opts.tool_choice.function.name };
    }
  }

  return await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
}

/**
 * Convert Anthropic SSE stream to OpenAI-compatible SSE stream.
 * This allows the frontend to parse the stream without changes.
 */
function convertAnthropicStreamToOpenAI(anthropicResponse: Response): Response {
  const reader = anthropicResponse.body!.getReader();
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
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              const openAIChunk = {
                choices: [{
                  delta: { content: event.delta.text },
                  index: 0,
                  finish_reason: null,
                }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
            } else if (event.type === "message_stop") {
              const stopChunk = {
                choices: [{
                  delta: {},
                  index: 0,
                  finish_reason: "stop",
                }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(stopChunk)}\n\n`));
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// --- Gemini ---

async function tryGemini(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = getGeminiModel(opts.model || "gemini-2.5-flash");

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.max_tokens !== undefined) body.max_tokens = opts.max_tokens;
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.response_format) body.response_format = opts.response_format;
  if (opts.stream) body.stream = opts.stream;
  if (opts.modalities) body.modalities = opts.modalities;

  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  );
}

// --- OpenAI ---

async function tryOpenAI(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = getOpenAIModel(opts.model || "gpt-4o-mini");

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.max_tokens !== undefined) body.max_tokens = opts.max_tokens;
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.response_format) body.response_format = opts.response_format;
  if (opts.stream) body.stream = opts.stream;

  return await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

// --- Lovable Gateway (last resort) ---

async function tryLovable(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const body: Record<string, unknown> = {
    model: opts.model || "google/gemini-2.5-flash",
    messages: opts.messages,
  };
  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.max_tokens !== undefined) body.max_tokens = opts.max_tokens;
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;
  if (opts.response_format) body.response_format = opts.response_format;
  if (opts.stream) body.stream = opts.stream;
  if (opts.modalities) body.modalities = opts.modalities;

  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

// --- Main entry points ---

/**
 * Main entry point: tries Claude → Gemini → OpenAI → Lovable with automatic fallback.
 * Returns the parsed JSON response in OpenAI-compatible format.
 */
export async function chatCompletion(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const providers: { name: string; fn: (o: ChatCompletionOptions) => Promise<Response>; isAnthropic?: boolean }[] = [
    { name: "anthropic", fn: tryAnthropic, isAnthropic: true },
    { name: "gemini", fn: tryGemini },
    { name: "openai", fn: tryOpenAI },
  ];
  if (opts.includeLovableFallback) {
    providers.push({ name: "lovable", fn: tryLovable });
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[ai-client] Trying ${provider.name}...`);
      const response = await provider.fn(opts);

      if (response.ok) {
        if (opts.stream) {
          if (provider.isAnthropic) {
            return {
              choices: [],
              provider: provider.name,
              _rawResponse: convertAnthropicStreamToOpenAI(response),
            } as any;
          }
          return {
            choices: [],
            provider: provider.name,
            _rawResponse: response,
          } as any;
        }

        const data = await response.json();
        console.log(`[ai-client] Success via ${provider.name}`);

        if (provider.isAnthropic) {
          return convertAnthropicResponseToOpenAI(data, provider.name);
        }
        return { ...data, provider: provider.name };
      }

      const errText = await response.text();
      console.warn(`[ai-client] ${provider.name} failed (${response.status}): ${errText.substring(0, 200)}`);
      lastError = new Error(`${provider.name}: ${response.status}`);
    } catch (err) {
      console.warn(`[ai-client] ${provider.name} exception:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All AI providers failed");
}

/**
 * Streaming version: returns the raw Response for SSE streaming.
 * Falls back through providers if one fails.
 * Anthropic streams are automatically converted to OpenAI-compatible format.
 */
export async function chatCompletionStream(opts: ChatCompletionOptions): Promise<{ response: Response; provider: string }> {
  const streamOpts = { ...opts, stream: true };
  const providers: { name: string; fn: (o: ChatCompletionOptions) => Promise<Response>; isAnthropic?: boolean }[] = [
    { name: "anthropic", fn: tryAnthropic, isAnthropic: true },
    { name: "gemini", fn: tryGemini },
    { name: "openai", fn: tryOpenAI },
  ];
  if (streamOpts.includeLovableFallback) {
    providers.push({ name: "lovable", fn: tryLovable });
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[ai-client-stream] Trying ${provider.name}...`);
      const response = await provider.fn(streamOpts);

      if (response.ok) {
        console.log(`[ai-client-stream] Streaming via ${provider.name}`);
        if (provider.isAnthropic) {
          return { response: convertAnthropicStreamToOpenAI(response), provider: provider.name };
        }
        return { response, provider: provider.name };
      }

      const errText = await response.text();
      console.warn(`[ai-client-stream] ${provider.name} failed (${response.status}): ${errText.substring(0, 200)}`);
      lastError = new Error(`${provider.name}: ${response.status}`);
    } catch (err) {
      console.warn(`[ai-client-stream] ${provider.name} exception:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error("All AI providers failed (stream)");
}
