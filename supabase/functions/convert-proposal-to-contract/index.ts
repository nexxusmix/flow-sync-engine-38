import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { proposal_id } = await req.json();
    if (!proposal_id) {
      return new Response(
        JSON.stringify({ error: "proposal_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: "Proposal not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate status
    if (proposal.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Only approved proposals can be converted" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prevent double conversion
    if (proposal.converted_to_contract) {
      return new Response(
        JSON.stringify({
          error: "Proposal already converted",
          contract_id: proposal.contract_id,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate project_id
    if (!proposal.project_id) {
      return new Response(
        JSON.stringify({ error: "Proposal must have a project_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch proposal sections for scope/notes
    const { data: sections } = await supabase
      .from("proposal_sections")
      .select("type, title, content")
      .eq("proposal_id", proposal_id)
      .order("order_index");

    // Build notes from scope section
    let contractNotes = "";
    if (sections) {
      const scopeSection = sections.find((s: any) => s.type === "scope");
      if (scopeSection?.content) {
        const content = scopeSection.content as Record<string, unknown>;
        if (content.included && Array.isArray(content.included)) {
          contractNotes += "Escopo incluído:\n" + (content.included as string[]).join("\n") + "\n\n";
        }
        if (content.excluded && Array.isArray(content.excluded)) {
          contractNotes += "Fora do escopo:\n" + (content.excluded as string[]).join("\n") + "\n\n";
        }
        if (content.text) {
          contractNotes += String(content.text) + "\n\n";
        }
      }
    }

    // Fetch deliverables for payment_terms summary
    const { data: deliverables } = await supabase
      .from("proposal_deliverables")
      .select("title, quantity, unit_price")
      .eq("proposal_id", proposal_id);

    let paymentTerms = "";
    if (deliverables && deliverables.length > 0) {
      paymentTerms = deliverables
        .map((d: any) => `${d.quantity}x ${d.title}${d.unit_price ? ` (R$ ${d.unit_price})` : ""}`)
        .join("; ");
    }

    // Create the contract using service role for cross-table insert
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: contract, error: contractError } = await serviceClient
      .from("contracts")
      .insert({
        workspace_id: proposal.workspace_id,
        proposal_id: proposal.id,
        project_id: proposal.project_id,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        total_value: proposal.total_value,
        payment_terms: paymentTerms || null,
        notes: contractNotes.trim() || null,
        status: "draft",
        current_version: 0,
        renewal_notice_days: 30,
        payment_block_on_breach: false,
        public_summary: {},
        created_by: user.id,
      })
      .select("id")
      .single();

    if (contractError || !contract) {
      console.error("Contract creation error:", contractError);
      return new Response(
        JSON.stringify({ error: "Failed to create contract", details: contractError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark proposal as converted
    const { error: updateError } = await serviceClient
      .from("proposals")
      .update({
        converted_to_contract: true,
        contract_id: contract.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal_id);

    if (updateError) {
      console.error("Proposal update error:", updateError);
    }

    return new Response(
      JSON.stringify({ contract_id: contract.id, success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
