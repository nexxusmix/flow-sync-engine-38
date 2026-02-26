import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const N8N_WHATSAPP_WEBHOOK_URL = Deno.env.get("N8N_WHATSAPP_WEBHOOK_URL") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find pending reminders that are due
    const { data: reminders, error } = await supabase
      .from("event_reminders")
      .select("*, calendar_events(*)")
      .eq("status", "pending")
      .lte("remind_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const reminder of reminders) {
      const event = (reminder as any).calendar_events;
      if (!event) {
        await supabase.from("event_reminders").update({
          status: "failed", error_message: "Event not found"
        }).eq("id", reminder.id);
        failed++;
        continue;
      }

      try {
        if (reminder.channel === "in_app") {
          // Insert into alerts table as in-app notification
          await supabase.from("alerts").insert({
            title: `🔔 Lembrete: ${event.title}`,
            message: `Evento "${event.title}" começa em breve. ${event.description || ""}`,
            type: "reminder",
            severity: "medium",
            scope: "user",
            entity_type: "calendar_event",
            entity_id: event.id,
            workspace_id: event.workspace_id,
          });
        } else if (reminder.channel === "whatsapp" && N8N_WHATSAPP_WEBHOOK_URL) {
          // Send via n8n WhatsApp webhook
          const phone = reminder.recipient;
          if (phone) {
            await fetch(N8N_WHATSAPP_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone,
                message: `🔔 *Lembrete*: ${event.title}\n📅 ${new Date(event.start_at).toLocaleString("pt-BR")}\n${event.description || ""}`,
                type: "event_reminder",
                event_id: event.id,
              }),
            });
          }
        } else if (reminder.channel === "email") {
          // Generate and send email via Lovable AI
          const email = reminder.recipient;
          if (email && LOVABLE_API_KEY) {
            // Insert into ai_outbox for email delivery
            await supabase.from("ai_outbox").insert({
              channel: "email",
              recipient: email,
              subject: `🔔 Lembrete: ${event.title}`,
              content: `Olá!\n\nLembrete para o evento "${event.title}" agendado para ${new Date(event.start_at).toLocaleString("pt-BR")}.\n\n${event.description || ""}\n\n${event.location ? `📍 Local: ${event.location}` : ""}${event.meet_url ? `\n🔗 Link: ${event.meet_url}` : ""}`,
              status: "pending",
              workspace_id: event.workspace_id,
            });
          }
        }

        await supabase.from("event_reminders").update({
          status: "sent", sent_at: new Date().toISOString(),
        }).eq("id", reminder.id);
        sent++;
      } catch (err) {
        console.error(`Reminder ${reminder.id} failed:`, err);
        await supabase.from("event_reminders").update({
          status: "failed", error_message: (err as Error).message,
        }).eq("id", reminder.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed: reminders.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send reminders error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
