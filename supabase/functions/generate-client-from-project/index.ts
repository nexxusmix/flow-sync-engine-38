import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id é obrigatório");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, name, client_name, brand_name, description, contract_value, template, start_date, due_date, owner_name, product_type, created_by")
      .eq("id", project_id)
      .single();

    if (projErr || !project) throw new Error("Projeto não encontrado");

    const clientName = project.client_name || project.name;
    const companyName = project.brand_name || clientName;
    const userId = project.created_by;

    // 2. Check existing contact (anti-duplicate)
    const { data: existingContacts } = await supabase
      .from("crm_contacts")
      .select("id, name")
      .ilike("name", clientName)
      .limit(1);

    let contactId: string;
    let contactCreated = false;

    // 3. AI enrichment
    const aiResult = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `Você é um assistente comercial de uma produtora audiovisual. Analise os dados de um projeto e gere informações comerciais estruturadas para cadastro no CRM.`
        },
        {
          role: "user",
          content: `Projeto: "${project.name}"
Cliente: "${clientName}"
Marca: "${companyName}"
Descrição: ${project.description || "N/A"}
Valor do contrato: R$ ${project.contract_value || 0}
Template: ${project.template || "N/A"}
Tipo: ${project.product_type || "N/A"}
Início: ${project.start_date || "N/A"}
Entrega: ${project.due_date || "N/A"}

Gere dados comerciais para este cliente.`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_client_data",
            description: "Gera dados comerciais a partir do projeto",
            parameters: {
              type: "object",
              properties: {
                temperature: { type: "string", enum: ["hot", "warm", "cold"], description: "Temperatura do lead baseada no valor e contexto" },
                score: { type: "integer", description: "Score de 0-100 do lead" },
                tags: { type: "array", items: { type: "string" }, description: "Tags relevantes para o contato (max 5)" },
                notes: { type: "string", description: "Notas contextuais sobre o cliente baseado no projeto (max 200 chars)" },
                next_action: { type: "string", description: "Sugestão de próxima ação comercial (max 100 chars)" },
                next_action_days: { type: "integer", description: "Em quantos dias a próxima ação deve ocorrer" },
                niche: { type: "string", description: "Nicho/setor do cliente" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                city: { type: "string", description: "Cidade estimada (ou 'N/A')" },
                decision_maker_name: { type: "string", description: "Nome do decisor inferido (ou o client_name)" },
                deal_title: { type: "string", description: "Título para o deal no pipeline (max 60 chars)" },
              },
              required: ["temperature", "score", "tags", "notes", "next_action", "next_action_days", "niche", "priority", "deal_title", "decision_maker_name"],
              additionalProperties: false,
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_client_data" } },
    });

    // Parse AI result
    let aiData: any = {};
    try {
      const toolCall = aiResult.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        aiData = JSON.parse(toolCall.function.arguments);
      }
    } catch {
      console.error("Failed to parse AI response, using defaults");
    }

    const temperature = aiData.temperature || "warm";
    const score = aiData.score || 50;
    const tags = aiData.tags || [project.template || "projeto"];
    const notes = aiData.notes || `Cliente do projeto "${project.name}"`;
    const nextAction = aiData.next_action || "Acompanhar andamento do projeto";
    const nextActionDays = aiData.next_action_days || 7;
    const niche = aiData.niche || "Audiovisual";
    const priority = aiData.priority || "medium";
    const city = aiData.city || null;
    const decisionMakerName = aiData.decision_maker_name || clientName;
    const dealTitle = aiData.deal_title || `Deal - ${project.name}`;

    const nextActionAt = new Date();
    nextActionAt.setDate(nextActionAt.getDate() + nextActionDays);

    // 4. Create or reuse contact
    if (existingContacts && existingContacts.length > 0) {
      contactId = existingContacts[0].id;
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from("crm_contacts")
        .insert({
          name: clientName,
          company: companyName,
          tags,
          notes,
          created_by: userId,
        })
        .select("id")
        .single();

      if (contactErr) throw new Error(`Erro ao criar contato: ${contactErr.message}`);
      contactId = newContact.id;
      contactCreated = true;
    }

    // 5. Create CRM Deal
    const { data: newDeal, error: dealErr } = await supabase
      .from("crm_deals")
      .insert({
        contact_id: contactId,
        project_id: project.id,
        title: dealTitle,
        stage_key: "lead",
        value: project.contract_value || 0,
        source: "projeto_existente",
        score,
        temperature,
        next_action: nextAction,
        next_action_at: nextActionAt.toISOString(),
        created_by: userId,
      })
      .select("id")
      .single();

    if (dealErr) throw new Error(`Erro ao criar deal: ${dealErr.message}`);

    // 6. Create Prospect (anti-duplicate)
    const { data: existingProspects } = await supabase
      .from("prospects")
      .select("id")
      .ilike("company_name", clientName)
      .limit(1);

    let prospectId: string;
    let prospectCreated = false;

    if (existingProspects && existingProspects.length > 0) {
      prospectId = existingProspects[0].id;
    } else {
      const { data: newProspect, error: prospErr } = await supabase
        .from("prospects")
        .insert({
          company_name: clientName,
          niche,
          city: city || null,
          decision_maker_name: decisionMakerName,
          priority,
          status: "active",
          tags,
          notes,
        })
        .select("id")
        .single();

      if (prospErr) throw new Error(`Erro ao criar prospect: ${prospErr.message}`);
      prospectId = newProspect.id;
      prospectCreated = true;
    }

    // 7. Create Opportunity
    const { error: oppErr } = await supabase
      .from("prospect_opportunities")
      .insert({
        prospect_id: prospectId,
        title: dealTitle,
        stage: "qualification",
        estimated_value: project.contract_value || 0,
        linked_project_id: project.id,
        next_action_at: nextActionAt.toISOString(),
        next_action_type: "follow_up",
        next_action_notes: nextAction,
      });

    if (oppErr) throw new Error(`Erro ao criar oportunidade: ${oppErr.message}`);

    const summary = [
      contactCreated ? `✅ Contato "${clientName}" criado` : `🔄 Contato "${clientName}" já existia`,
      `✅ Deal "${dealTitle}" criado no pipeline`,
      prospectCreated ? `✅ Prospect criado` : `🔄 Prospect já existia`,
      `✅ Oportunidade vinculada ao projeto`,
      `🤖 Score: ${score} | Temperatura: ${temperature}`,
    ].join("\n");

    return new Response(JSON.stringify({ success: true, summary, contactId, dealId: newDeal.id, prospectId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-client-from-project error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
