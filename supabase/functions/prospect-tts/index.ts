import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-trace-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const traceId = req.headers.get("x-trace-id") || crypto.randomUUID();
  console.log(`[prospect-tts] trace=${traceId} start`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado", trace_id: traceId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Auth client to validate user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for storage + DB writes
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Token inválido", trace_id: traceId }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, voice_id, prospect_id, opportunity_id, idempotency_key } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "text obrigatório", trace_id: traceId }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check idempotency
    if (idempotency_key) {
      const { data: existing } = await supabaseAdmin
        .from("prospect_audio")
        .select("id, audio_url, status, duration_seconds")
        .eq("idempotency_key", idempotency_key)
        .maybeSingle();

      if (existing && existing.status === "ready" && existing.audio_url) {
        console.log(`[prospect-tts] trace=${traceId} idempotency hit, returning existing`);
        return new Response(JSON.stringify({
          audio_url: existing.audio_url,
          duration: existing.duration_seconds,
          trace_id: traceId,
          audio_id: existing.id,
          cached: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert processing record
    const audioRecord: Record<string, unknown> = {
      script_text: text,
      voice_id: voice_id || "onwK4e9ZLuTAKqWW03F9",
      status: "processing",
      trace_id: traceId,
    };
    if (prospect_id) audioRecord.prospect_id = prospect_id;
    if (opportunity_id) audioRecord.opportunity_id = opportunity_id;
    if (idempotency_key) audioRecord.idempotency_key = idempotency_key;

    const { data: audioRow, error: insertError } = await supabaseAdmin
      .from("prospect_audio")
      .insert(audioRecord)
      .select("id")
      .single();

    if (insertError) {
      console.error(`[prospect-tts] trace=${traceId} insert error:`, insertError);
    }

    const audioDbId = audioRow?.id;

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      if (audioDbId) {
        await supabaseAdmin.from("prospect_audio").update({
          status: "error",
          error_message: "ELEVENLABS_API_KEY não configurada",
        }).eq("id", audioDbId);
      }
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY não configurada", trace_id: traceId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedVoice = voice_id || "onwK4e9ZLuTAKqWW03F9"; // Daniel

    console.log(`[prospect-tts] trace=${traceId} calling ElevenLabs voice=${selectedVoice}`);

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
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
      console.error(`[prospect-tts] trace=${traceId} ElevenLabs error: ${ttsResponse.status}`, errText);
      const errMsg = `Erro TTS: ${ttsResponse.status} — ${errText.substring(0, 200)}`;
      if (audioDbId) {
        await supabaseAdmin.from("prospect_audio").update({
          status: "error",
          error_message: errMsg,
        }).eq("id", audioDbId);
      }
      return new Response(JSON.stringify({ error: errMsg, trace_id: traceId }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Save to storage
    const fileName = `${traceId}.mp3`;
    const filePath = `audios/${fileName}`;

    console.log(`[prospect-tts] trace=${traceId} uploading to scout-audio/${filePath} (${audioBytes.length} bytes)`);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("scout-audio")
      .upload(filePath, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[prospect-tts] trace=${traceId} upload error:`, uploadError);
      if (audioDbId) {
        await supabaseAdmin.from("prospect_audio").update({
          status: "error",
          error_message: `Upload falhou: ${uploadError.message}`,
        }).eq("id", audioDbId);
      }
      return new Response(JSON.stringify({ error: "Falha ao salvar áudio", trace_id: traceId }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("scout-audio")
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData?.publicUrl;

    // Estimate duration (~150 words/min for pt-BR TTS)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.round((wordCount / 150) * 60);

    // Update DB record
    if (audioDbId) {
      await supabaseAdmin.from("prospect_audio").update({
        status: "ready",
        audio_url: audioUrl,
        duration_seconds: estimatedDuration,
      }).eq("id", audioDbId);
    }

    console.log(`[prospect-tts] trace=${traceId} done, url=${audioUrl}`);

    return new Response(JSON.stringify({
      audio_url: audioUrl,
      duration: estimatedDuration,
      trace_id: traceId,
      audio_id: audioDbId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[prospect-tts] trace=${traceId} error:`, err);
    return new Response(
      JSON.stringify({ error: "Erro interno", trace_id: traceId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
