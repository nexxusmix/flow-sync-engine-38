/**
 * export-panorama-pdf — Project panorama PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, sanitize, formatCurrency, formatDate, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, userId } = await req.json();
    if (!projectId) throw new Error("projectId required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [
      { data: project },
      { data: revenues },
      { data: portalLinks },
      { data: deliverables },
      { data: contracts },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("revenues").select("*").eq("project_id", projectId).order("due_date"),
      supabase.from("portal_links").select("id, share_token").eq("project_id", projectId).limit(1),
      supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("contracts").select("*").eq("project_id", projectId).limit(1),
    ]);

    if (!project) throw new Error("Project not found");

    const revs = revenues || [];
    const dels = deliverables || [];
    const contract = contracts?.[0];
    const portalLink = portalLinks?.[0];

    const totalPaid = revs.filter(r => r.status === "received").reduce((s, r) => s + Number(r.amount), 0);
    const totalPending = revs.filter(r => r.status !== "received").reduce((s, r) => s + Number(r.amount), 0);
    const contractValue = contract?.total_value || project.contract_value || 0;
    const healthScore = project.health_score || 0;
    const pendingDels = dels.filter(d => d.status !== "approved" && d.visible_in_portal !== false).length;
    const nextRevenue = revs.find(r => r.status === "pending" || r.status === "overdue");

    const b = new SquadPdfBuilder();
    await b.init();

    // Cover
    b.coverPage({
      subtitle: "Panorama do Projeto",
      titleLine1: project.name || "Projeto",
      titleLine2: "Panorama",
      description: `${project.client_name || "--"} | Gerado em ${formatDateShort()}`,
      date: formatDateShort(),
    });

    // Content page
    b.newPage();
    b.heroSection("Panorama", "do Projeto.", "Visao Completa");

    // KPI row 1
    b.kpiRow([
      { label: "Valor Contrato", value: formatCurrency(contractValue), color: SQUAD.accent },
      { label: "Total Pago", value: formatCurrency(totalPaid), color: SQUAD.success },
      { label: "Pendente", value: formatCurrency(totalPending), color: totalPending > 0 ? SQUAD.warning : SQUAD.muted },
      { label: "Saude", value: `${healthScore}%`, color: healthScore >= 80 ? SQUAD.success : healthScore >= 50 ? SQUAD.warning : SQUAD.error },
    ]);

    // KPI row 2
    b.kpiRow([
      { label: "Etapa Atual", value: sanitize(project.stage_current || "--") },
      { label: "Entregas Pendentes", value: `${pendingDels}`, color: pendingDels > 3 ? SQUAD.warning : SQUAD.accent },
    ]);

    // Next payment
    if (nextRevenue) {
      b.sectionTitle("Proximo Vencimento");
      b.pricingCard({
        subtitle: nextRevenue.status === "overdue" ? "VENCIDO" : "PENDENTE",
        title: sanitize(nextRevenue.description || "Parcela"),
        value: formatCurrency(Number(nextRevenue.amount)),
        features: [formatDate(nextRevenue.due_date)],
      });
    }

    // Deliverables
    b.sectionTitle("Entregas");
    const visibleDels = dels.filter(d => d.visible_in_portal !== false).slice(0, 10);
    if (visibleDels.length > 0) {
      const colW = [240, 100, 159];
      b.tableHeader([
        { text: "Titulo", width: colW[0] },
        { text: "Tipo", width: colW[1] },
        { text: "Status", width: colW[2] },
      ]);
      for (const d of visibleDels) {
        const sColor = d.status === "approved" ? SQUAD.success : d.status === "review" ? SQUAD.warning : SQUAD.muted;
        b.tableRow([
          { text: (d.title || "").substring(0, 42), width: colW[0] },
          { text: (d.type || "").substring(0, 12), width: colW[1], color: SQUAD.muted },
          { text: d.status || "pending", width: colW[2], color: sColor, bold: true },
        ]);
      }
    } else {
      b.text("Nenhuma entrega registrada", { color: SQUAD.muted });
    }

    // Portal link
    if (portalLink) {
      b.sectionTitle("Portal do Cliente");
      b.text(`Token: ${portalLink.share_token}`, { size: 8, color: SQUAD.muted });
    }

    const pdfBytes = await b.save();
    const fileName = `panorama_${projectId}_v${Date.now()}.pdf`;
    const filePath = `exports/panorama/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(filePath, 1800);
    const url = signedUrlError ? supabase.storage.from("exports").getPublicUrl(filePath).data.publicUrl : signedUrlData.signedUrl;

    // Save snapshot
    const snapshotVersion = await supabase.from("panorama_snapshots").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1);
    const nextVersion = (snapshotVersion.data?.[0]?.version || 0) + 1;

    const { data: snapshot } = await supabase.from("panorama_snapshots").insert({
      project_id: projectId, generated_by: userId || null,
      pdf_url: url, pdf_file_path: filePath, version: nextVersion,
      metadata: { contract_value: contractValue, total_paid: totalPaid, pending: totalPending, health_score: healthScore, pending_deliverables: pendingDels, stage: project.stage_current },
    }).select("id, share_token").single();

    return new Response(JSON.stringify({
      success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: fileName,
      share_token: snapshot?.share_token, snapshot_id: snapshot?.id, version: nextVersion,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("export-panorama-pdf error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
