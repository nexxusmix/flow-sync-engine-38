import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { opportunity_id, message_id, voice_id } = await req.json();
    if (!opportunity_id || !message_id) {
      return new Response(JSON.stringify({ error: "opportunity_id e message_id obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch message
    const { data: msg, error: msgErr } = await supabase
      .from("scout_messages")
      .select("*, scout_opportunities!inner(workspace_id, user_id)")
      .eq("id", message_id)
      .single();

    if (msgErr || !msg) {
      return new Response(JSON.stringify({ error: "Mensagem não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const script = msg.audio_script || msg.text_message;
    if (!script) {
      return new Response(JSON.stringify({ error: "Nenhum texto para gerar áudio" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate TTS with ElevenLabs
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedVoice = voice_id || "onwK4e9ZLuTAKqWW03F9"; // Daniel (Portuguese)

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error("ElevenLabs error:", ttsResponse.status, errText);
      return new Response(JSON.stringify({ error: `Erro no TTS: ${ttsResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Estimate duration (rough: 128kbps = 16KB/s)
    const durationSeconds = Math.round(audioBytes.length / 16000);

    // Upload to storage
    const workspaceId = msg.scout_opportunities?.workspace_id || "default";
    const storagePath = `${workspaceId}/${opportunity_id}/${message_id}.mp3`;

    // Use service role for storage upload
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { error: uploadErr } = await adminClient.storage
      .from("scout-audio")
      .upload(storagePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Erro ao salvar áudio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate content hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", audioBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Save audio asset record
    const { data: audioAsset, error: assetErr } = await supabase
      .from("scout_audio_assets")
      .insert({
        opportunity_id,
        message_id,
        workspace_id: workspaceId,
        storage_path: storagePath,
        duration_seconds: durationSeconds,
        voice_id: selectedVoice,
        content_hash: contentHash,
      })
      .select()
      .single();

    if (assetErr) {
      console.error("Asset insert error:", assetErr);
      return new Response(JSON.stringify({ error: "Erro ao registrar áudio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update opportunity status
    await supabase
      .from("scout_opportunities")
      .update({ status: "PENDING_APPROVAL" })
      .eq("id", opportunity_id);

    return new Response(JSON.stringify({ success: true, audio_asset: audioAsset }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scout-generate-audio error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
