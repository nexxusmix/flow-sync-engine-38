

## Fix: Graceful Error Handling for AI Credit Exhaustion

### Problem
The `extract-project-from-document` edge function calls the Lovable AI gateway, which returns HTTP 402 (payment required / not enough credits). The function does not surface this error clearly to the user, and the frontend shows a blank screen.

The same issue also affects `polo-ai-chat` (used by the new AI Daily Summary) and `extract-contract-from-file`.

### Root Cause
All AI-calling edge functions catch 402 errors silently, logging them but returning generic error messages. The frontend has no special handling for "out of credits."

### Solution

#### 1. Update `extract-project-from-document/index.ts`
- In `extractPdfWithGemini` and `extractPdfWithPro` functions, detect 402 status and throw a specific error (e.g., `throw new Error("CREDITS_EXHAUSTED")`)
- In the main handler, catch this specific error and return a clear JSON response: `{ error: "Creditos de IA esgotados. Aguarde a renovacao ou atualize seu plano.", code: "CREDITS_EXHAUSTED" }` with HTTP 402

#### 2. Update `extract-contract-from-file/index.ts`
- Same pattern: detect 402 from AI gateway and return a user-friendly 402 response

#### 3. Update `polo-ai-chat/index.ts`
- Fix the existing bug: `TypeError: messages is not iterable` (visible in the logs)
- Also add 402 credit exhaustion handling

#### 4. Update `AIDailySummary.tsx` (frontend)
- Handle error state gracefully: show a card with "Resumo indisponivel - creditos esgotados" instead of breaking the page
- Add `onError` or error state from React Query to display a fallback message

#### 5. Update the document upload pages (frontend)
- In components that call `extract-project-from-document` and `extract-contract-from-file`, check for 402 responses and show a toast with a clear message about credits

### Technical Details

**Edge function pattern (all 3 functions):**
```typescript
if (response.status === 402) {
  return new Response(JSON.stringify({
    error: "Creditos de IA esgotados. Aguarde a renovacao ou atualize seu plano.",
    code: "CREDITS_EXHAUSTED"
  }), {
    status: 402,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
```

**Frontend pattern:**
```typescript
if (response.status === 402) {
  toast.error("Creditos de IA esgotados. Tente novamente mais tarde.");
  return;
}
```

**polo-ai-chat bug fix:**
The `messages is not iterable` error suggests the function receives the body in an unexpected format from the `AIDailySummary` component. The fix involves ensuring the function correctly parses the `message` field and constructs the messages array.

### Files to Edit

| File | Change |
|---|---|
| `supabase/functions/extract-project-from-document/index.ts` | Add 402 handling in AI calls |
| `supabase/functions/extract-contract-from-file/index.ts` | Add 402 handling in AI calls |
| `supabase/functions/polo-ai-chat/index.ts` | Fix messages parsing bug + add 402 handling |
| `src/components/dashboard/AIDailySummary.tsx` | Show error state instead of blank |
| `src/components/finance/ContractAiUpdateDialog.tsx` | Handle 402 in processFile |

### Immediate User Action
You also need to **replenish your Lovable AI credits** -- without credits, all AI features (document extraction, daily summary, contract analysis) will remain non-functional regardless of code fixes.

