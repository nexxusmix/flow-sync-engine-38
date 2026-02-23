

## Fix: polo-ai-chat streaming vs non-streaming mismatch

### Problem
`polo-ai-chat` always uses `chatCompletionStream()` and returns `text/event-stream`. But `AIDailySummary.tsx` calls it via `supabase.functions.invoke()`, which expects a JSON response. The SSE stream can't be parsed as JSON, causing the component to fail and the dashboard to show a blank screen.

The edge function logs also show residual `TypeError: messages is not iterable` errors from an older deployment that has since been fixed.

### Solution
Make `polo-ai-chat` support both streaming and non-streaming modes based on the request body.

### Changes

**1. `supabase/functions/polo-ai-chat/index.ts`**
- Import `chatCompletion` (non-streaming) alongside `chatCompletionStream`
- Check `body.stream` flag (default to `false` when not provided)
- When `stream === false` (or absent): use `chatCompletion()` and return a JSON response `{ response: "..." }`
- When `stream === true`: use `chatCompletionStream()` and return SSE as before
- This way, `AIDailySummary` (which sends `{ message: "..." }` without `stream: true`) gets a proper JSON response

```typescript
// Determine streaming mode
const wantStream = body.stream === true;

if (wantStream) {
  // existing streaming logic
  const { response } = await chatCompletionStream({ ... });
  return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
} else {
  // non-streaming: return JSON
  const result = await chatCompletion({ model: "google/gemini-3-flash-preview", messages: [...], stream: false });
  const text = result.choices?.[0]?.message?.content || "";
  return new Response(JSON.stringify({ response: text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

**2. `src/components/dashboard/AIDailySummary.tsx`** (minor)
- No changes needed -- it already reads `data?.response` which will now work correctly with the JSON response

**3. Deploy `polo-ai-chat`**

### Files to edit
| File | Change |
|---|---|
| `supabase/functions/polo-ai-chat/index.ts` | Add non-streaming branch using `chatCompletion` |

### Result
- Dashboard AI summary works again (non-streaming JSON response)
- Polo AI chat panel still works (streaming SSE when `stream: true`)
- No blank screen
