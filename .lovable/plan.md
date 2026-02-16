

# Fix: Modo Foco "Edge Function returned a non-2xx status code"

## Root Cause

The edge function `generate-execution-blocks` crashes at line 115 with:
```
SyntaxError: Expected double-quoted property name in JSON at position 10488
```

The AI model sometimes returns JSON with single quotes, trailing commas, or comments -- causing `JSON.parse` to fail and the function to return a 500 error.

## Fix

Modify `supabase/functions/generate-execution-blocks/index.ts`:

1. **Sanitize the AI response** before parsing: strip single quotes to double quotes, remove trailing commas before `}` or `]`, remove JS comments
2. **Add a retry with stricter prompt** if first parse fails -- re-ask the AI to fix the JSON
3. **Wrap in try/catch** with a descriptive error message instead of crashing

Same fix applied to `supabase/functions/analyze-tasks/index.ts` (same vulnerability).

## Technical Details

### File: `supabase/functions/generate-execution-blocks/index.ts`
- Add a `sanitizeJson(str)` helper that:
  - Removes markdown fences (already done)
  - Replaces single-quoted keys/values with double quotes
  - Strips trailing commas before `}` and `]`
- Wrap `JSON.parse` in try/catch; on failure, attempt sanitization + re-parse
- If still fails, return a user-friendly error `{ error: "A IA retornou formato invalido. Tente novamente." }` with status 422 instead of crashing with 500

### File: `supabase/functions/analyze-tasks/index.ts`
- Apply identical sanitization fix

### No frontend changes needed
- The component already handles errors via `toast.error`
