/**
 * Unified AI Client with multi-provider fallback
 * Priority: Gemini (direct) → OpenAI → Lovable AI Gateway (last resort)
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

// Model mapping: Lovable gateway names → native API names
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

function getGeminiModel(model: string): string {
  return GEMINI_MODEL_MAP[model] || "gemini-2.5-flash";
}

function getOpenAIModel(model: string): string {
  return OPENAI_MODEL_MAP[model] || "gpt-4o-mini";
}

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

async function tryOpenAI(opts: ChatCompletionOptions): Promise<Response> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const model = getOpenAIModel(opts.model || "gpt-4o-mini");

  // Filter out modalities (OpenAI doesn't support image generation this way)
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

/**
 * Main entry point: tries Gemini → OpenAI → Lovable with automatic fallback.
 * Returns the parsed JSON response in OpenAI-compatible format.
 */
export async function chatCompletion(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const providers = [
    { name: "gemini", fn: tryGemini },
    { name: "openai", fn: tryOpenAI },
    { name: "lovable", fn: tryLovable },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[ai-client] Trying ${provider.name}...`);
      const response = await provider.fn(opts);

      if (response.ok) {
        if (opts.stream) {
          // For streaming, return a synthetic result with the raw response body
          // The caller should handle the stream directly
          return {
            choices: [],
            provider: provider.name,
            _rawResponse: response,
          } as any;
        }

        const data = await response.json();
        console.log(`[ai-client] ✓ Success via ${provider.name}`);
        return { ...data, provider: provider.name };
      }

      // Don't fallback on 4xx client errors (except 429 rate limit and 402 payment)
      if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 402) {
        const errText = await response.text();
        console.error(`[ai-client] ${provider.name} client error ${response.status}: ${errText}`);
        // Still try next provider - the request format might differ
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
 */
export async function chatCompletionStream(opts: ChatCompletionOptions): Promise<{ response: Response; provider: string }> {
  const streamOpts = { ...opts, stream: true };
  const providers = [
    { name: "gemini", fn: tryGemini },
    { name: "openai", fn: tryOpenAI },
    { name: "lovable", fn: tryLovable },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[ai-client-stream] Trying ${provider.name}...`);
      const response = await provider.fn(streamOpts);

      if (response.ok) {
        console.log(`[ai-client-stream] ✓ Streaming via ${provider.name}`);
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
