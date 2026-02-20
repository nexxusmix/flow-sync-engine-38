import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignatureElement {
  type: "assinatura" | "carimbo" | "rubrica" | "reconhecimento_firma" | "outro";
  description: string;
  location: string;
  confidence: number;
  signer_name?: string | null;
  signer_role?: string | null;
  has_date?: boolean;
  date_found?: string | null;
}

interface ScanResult {
  has_signature: boolean;
  has_legal_seal: boolean;
  has_witness_signature: boolean;
  signatures_found: SignatureElement[];
  seals_found: SignatureElement[];
  document_appears_signed: boolean;
  confidence_overall: number;
  notes: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      contract_id,
      fileBase64,
      mimeType,
      fileName,
      mark_as_signed = false,
      signer_name,
      signer_email,
    } = await req.json();

    if (!contract_id) {
      return new Response(
        JSON.stringify({ error: "contract_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fileBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "fileBase64 e mimeType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    const estimatedBytes = (fileBase64.length * 3) / 4;
    if (estimatedBytes > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Arquivo muito grande. Máximo 20MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the contract to validate ownership / existence
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("id, status, client_name, client_email, project_id")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Scanning contract ${contract_id} for signatures in file: ${fileName}`);

    // Build vision prompt
    const userContent = [
      {
        type: "text",
        text: `Você é um especialista em validação de documentos jurídicos brasileiros.

Analise DETALHADAMENTE o documento enviado em busca de:

1. **Assinaturas manuscritas** (rabiscos, rúbricas, assinaturas cursivas)
2. **Carimbos** (CNPJ, nome da empresa, número de OAB, etc.)
3. **Reconhecimentos de firma** ou selos notariais
4. **Assinaturas digitais** visíveis (marcas d'água, QR codes de validação, campos de assinatura eletrônica preenchidos)
5. **Rubricas** em cantos de página
6. **Datas manuscritas** próximas às assinaturas
7. **Testemunhas** (campo de testemunhas preenchido)

Use a função analyze_contract_signatures para retornar os resultados estruturados.

IMPORTANTE:
- Seja conservador: só marque has_signature=true se houver evidência CLARA de assinatura
- Diferencie campos VAZIOS de campos preenchidos
- Identifique se o documento parece estar completo para assinatura ou se ainda está em branco
- Para confidence_overall: 0.0 a 1.0, onde 1.0 é certeza absoluta`,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
        },
      },
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_contract_signatures",
          description: "Analisa e retorna assinaturas, carimbos e selos detectados no documento",
          parameters: {
            type: "object",
            properties: {
              has_signature: {
                type: "boolean",
                description: "true se houver pelo menos uma assinatura manuscrita ou digital claramente visível",
              },
              has_legal_seal: {
                type: "boolean",
                description: "true se houver carimbo, selo notarial ou reconhecimento de firma",
              },
              has_witness_signature: {
                type: "boolean",
                description: "true se houver campo de testemunhas preenchido",
              },
              document_appears_signed: {
                type: "boolean",
                description: "true se o documento como um todo parece estar devidamente assinado e finalizado",
              },
              confidence_overall: {
                type: "number",
                description: "Confiança geral da análise entre 0.0 e 1.0",
              },
              signatures_found: {
                type: "array",
                description: "Lista de assinaturas/rúbricas encontradas",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["assinatura", "rubrica", "assinatura_digital", "outro"],
                    },
                    description: { type: "string" },
                    location: { type: "string", description: "Onde no documento (ex: rodapé direito, página 3)" },
                    confidence: { type: "number" },
                    signer_name: { type: "string", description: "Nome legível próximo à assinatura, se houver" },
                    signer_role: { type: "string", description: "Cargo/papel do signatário, se identificável" },
                    has_date: { type: "boolean" },
                    date_found: { type: "string", description: "Data encontrada próxima à assinatura (YYYY-MM-DD ou texto)" },
                  },
                  required: ["type", "description", "location", "confidence"],
                },
              },
              seals_found: {
                type: "array",
                description: "Lista de carimbos e selos encontrados",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["carimbo", "reconhecimento_firma", "selo_notarial", "qr_validacao", "outro"],
                    },
                    description: { type: "string" },
                    location: { type: "string" },
                    confidence: { type: "number" },
                    signer_name: { type: "string" },
                    has_date: { type: "boolean" },
                    date_found: { type: "string" },
                  },
                  required: ["type", "description", "location", "confidence"],
                },
              },
              notes: {
                type: "string",
                description: "Observações adicionais sobre a análise do documento",
              },
            },
            required: [
              "has_signature",
              "has_legal_seal",
              "has_witness_signature",
              "document_appears_signed",
              "confidence_overall",
              "signatures_found",
              "seals_found",
              "notes",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        tools,
        tool_choice: { type: "function", function: { name: "analyze_contract_signatures" } },
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao analisar documento com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Não foi possível analisar o documento. Verifique se o arquivo está legível." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let scanResult: ScanResult;
    try {
      scanResult = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scan result:", JSON.stringify(scanResult).substring(0, 500));

    // ── Mark as signed if requested and signatures found ────────────────────
    let contractUpdated = false;
    let signatureRecordCreated = false;

    const shouldMarkSigned = mark_as_signed &&
      scanResult.document_appears_signed &&
      scanResult.confidence_overall >= 0.6;

    if (shouldMarkSigned && contract.status !== "signed") {
      // Update contract status
      await supabaseAdmin
        .from("contracts")
        .update({ status: "signed" })
        .eq("id", contract_id);
      contractUpdated = true;

      // Determine signer info from scan or provided params
      const resolvedSignerName =
        signer_name ||
        scanResult.signatures_found[0]?.signer_name ||
        contract.client_name ||
        "Assinante";

      const resolvedSignerEmail =
        signer_email ||
        contract.client_email ||
        "";

      // Create signature record
      const { error: sigError } = await supabaseAdmin
        .from("contract_signatures")
        .insert([{
          contract_id,
          signer_name: resolvedSignerName,
          signer_email: resolvedSignerEmail,
          signature_type: "upload_signed_pdf",
          signed_at: new Date().toISOString(),
        }]);

      if (sigError) {
        console.error("Signature insert error:", sigError);
      } else {
        signatureRecordCreated = true;
      }
    }

    // Build summary message
    const totalFound = scanResult.signatures_found.length + scanResult.seals_found.length;
    const parts: string[] = [];
    if (scanResult.signatures_found.length > 0) {
      parts.push(`${scanResult.signatures_found.length} assinatura(s) detectada(s)`);
    }
    if (scanResult.seals_found.length > 0) {
      parts.push(`${scanResult.seals_found.length} carimbo(s)/selo(s)`);
    }
    if (scanResult.has_witness_signature) parts.push("testemunhas presentes");
    if (contractUpdated) parts.push("contrato marcado como Assinado");

    const message = totalFound === 0
      ? "Nenhuma assinatura detectada no documento"
      : parts.join(" • ");

    return new Response(
      JSON.stringify({
        scan: scanResult,
        contract_updated: contractUpdated,
        signature_record_created: signatureRecordCreated,
        message,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
