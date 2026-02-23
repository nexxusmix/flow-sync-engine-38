/**
 * export-panorama-pdf — Project panorama PDF via Gemini HTML
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatCurrency, formatDate, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SQUAD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print { @page { size: A4; margin: 20mm 15mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
body { font-family: 'Space Grotesk', sans-serif; background: #000; color: #D9DEE3; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 60px 40px 40px; }
.hero-subtitle { font-size: 11px; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
.hero-title { font-size: 42px; font-weight: 700; color: #FFF; line-height: 1.1; margin-bottom: 24px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 16px; }
.hero-desc { font-size: 14px; color: #8C8C8C; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 0 40px 40px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; padding: 20px; text-align: center; }
.kpi-value { font-size: 28px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
.kpi-value.success { color: #22C55E; }
.kpi-value.accent { color: #009CCA; }
.kpi-value.warning { color: #EAB308; }
.kpi-value.error { color: #EF4444; }
.kpi-label { font-size: 11px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; }
.section { padding: 0 40px 32px; }
.section-title { font-size: 13px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1A1A1A; }
table { width: 100%; border-collapse: collapse; }
thead th { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; background: #0A0A0A; border-bottom: 1px solid #1A1A1A; }
tbody td { font-size: 12px; padding: 12px 16px; border-bottom: 1px solid #0A0A0A; color: #D9DEE3; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
.badge-success { background: rgba(34,197,94,0.15); color: #22C55E; }
.badge-accent { background: rgba(0,156,202,0.15); color: #009CCA; }
.badge-muted { background: rgba(140,140,140,0.15); color: #8C8C8C; }
.badge-warning { background: rgba(234,179,8,0.15); color: #EAB308; }
.badge-error { background: rgba(239,68,68,0.15); color: #EF4444; }
.pricing-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-left: 3px solid #009CCA; border-radius: 8px; padding: 24px; margin: 0 40px 24px; }
.pricing-subtitle { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.pricing-title { font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 12px; }
.pricing-value { font-size: 28px; font-weight: 700; color: #009CCA; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, userId } = await req.json();
    if (!projectId) throw new Error("projectId required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: project }, { data: revenues }, { data: portalLinks }, { data: deliverables }, { data: contracts }] = await Promise.all([
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
    const visibleDels = dels.filter(d => d.visible_in_portal !== false).slice(0, 10);

    const dataPayload = JSON.stringify({
      project_name: project.name || "Projeto", client_name: project.client_name || "--",
      date: formatDateShort(), stage: project.stage_current || "--",
      kpis: {
        contract_value: formatCurrency(contractValue), total_paid: formatCurrency(totalPaid),
        pending: formatCurrency(totalPending), health: `${healthScore}%`,
        pending_deliverables: pendingDels,
      },
      health_score: healthScore,
      next_payment: nextRevenue ? {
        description: nextRevenue.description || "Parcela",
        amount: formatCurrency(Number(nextRevenue.amount)),
        due_date: formatDate(nextRevenue.due_date),
        is_overdue: nextRevenue.status === "overdue",
      } : null,
      deliverables: visibleDels.map(d => ({
        title: (d.title || "").substring(0, 42),
        type: (d.type || "").substring(0, 12),
        status: d.status || "pending",
      })),
      portal_token: portalLink?.share_token || null,
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY complete HTML. No markdown.

Use this CSS:
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. Header: logo "SQ" + "SQUAD FILM | 2026"
2. Hero: subtitle "Panorama do Projeto", title with project_name + "<br><span class='accent'>Panorama.</span>", desc "CLIENT | Gerado em DATE"
3. KPI row 1: Valor Contrato (accent), Total Pago (success), Pendente (warning if >0 else muted), Saude (success>=80, warning 50-79, error<50)
4. KPI row 2 (2 cols): Etapa Atual, Entregas Pendentes (warning if >3)
5. If next_payment: pricing-card "Proximo Vencimento" subtitle VENCIDO/PENDENTE, title=description, pricing-value=amount, date below
6. Section "Entregas": table (Titulo, Tipo, Status). badge-success=approved, badge-warning=review, badge-muted=pending. If empty "Nenhuma entrega"
7. If portal_token: section "Portal do Cliente" with token in muted
8. Footer "SQUAD FILM | 2026"`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate:\n${dataPayload}` }],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    // Save snapshot metadata
    const snapshotVersion = await supabase.from("panorama_snapshots").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1);
    const nextVersion = (snapshotVersion.data?.[0]?.version || 0) + 1;

    const { data: snapshot } = await supabase.from("panorama_snapshots").insert({
      project_id: projectId, generated_by: userId || null,
      pdf_url: null, pdf_file_path: null, version: nextVersion,
      metadata: { contract_value: contractValue, total_paid: totalPaid, pending: totalPending, health_score: healthScore, pending_deliverables: pendingDels, stage: project.stage_current },
    }).select("id, share_token").single();

    return new Response(JSON.stringify({
      success: true, html, slug: `panorama-${projectId}`,
      share_token: snapshot?.share_token, snapshot_id: snapshot?.id, version: nextVersion,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("export-panorama-pdf error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
