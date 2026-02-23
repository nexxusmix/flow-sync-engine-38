import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function detectProvider(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("behance.net")) return "behance";
    if (host.includes("pinterest.com")) return "pinterest";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("linkedin.com")) return "linkedin";
    return "generic";
  } catch {
    return "generic";
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

async function fetchPageMeta(url: string): Promise<{
  title: string;
  ogTitle: string;
  ogImage: string | null;
  description: string;
  favicon: string;
}> {
  const favicon = getFaviconUrl(url);

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SquadBot/1.0; +https://squadfilm.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return { title: extractDomain(url), ogTitle: "", ogImage: null, description: "", favicon };
    }

    const html = await resp.text();

    const getMetaContent = (name: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return "";
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch?.[1]?.trim() || extractDomain(url);

    const ogTitle = getMetaContent("og:title") || pageTitle;
    const ogImage = getMetaContent("og:image") || getMetaContent("twitter:image") || null;
    const description = getMetaContent("og:description") || getMetaContent("description") || "";

    // Resolve relative OG image URL
    let resolvedOgImage = ogImage;
    if (ogImage && !ogImage.startsWith("http")) {
      try {
        const base = new URL(url);
        resolvedOgImage = new URL(ogImage, base.origin).toString();
      } catch {
        resolvedOgImage = ogImage;
      }
    }

    return {
      title: pageTitle,
      ogTitle,
      ogImage: resolvedOgImage,
      description,
      favicon,
    };
  } catch (e) {
    console.error("fetchPageMeta error:", e);
    return { title: extractDomain(url), ogTitle: "", ogImage: null, description: "", favicon };
  }
}

async function analyzeWithGemini(
  // lovableApiKey parameter is now unused but kept for signature compatibility
  _lovableApiKey: string,
  ogImageUrl: string,
  siteTitle: string,
  siteUrl: string
): Promise<{ color_palette: string[]; brand_name: string; summary: string; tags: string[] }> {
  const prompt = `Analyze this website image/screenshot from "${siteTitle}" (${siteUrl}).

Extract the visual brand identity:
1. Color palette: List the main brand colors as hex codes (e.g., #FF5733). Focus on primary, secondary, accent colors. Return 3-8 colors maximum.
2. Brand name: The actual brand/company name visible or inferred from the site title.
3. Short summary: 1-2 sentences describing the brand's visual style and identity.
4. Tags: 3-6 keywords describing the brand style (e.g., "minimalist", "tech", "colorful", "corporate").

Return ONLY valid JSON in this exact format, no markdown:
{"color_palette":["#hex1","#hex2"],"brand_name":"Name","summary":"Description.","tags":["tag1","tag2"]}`;

  const data = await chatCompletion({
    model: "google/gemini-2.5-flash",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: { url: ogImageUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
  });
  const content = data.choices?.[0]?.message?.content || "{}";

  // Strip markdown code blocks if present
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse Gemini response:", content);
    return {
      color_palette: [],
      brand_name: siteTitle,
      summary: "",
      tags: [],
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, project_id, workspace_id, user_id } = await req.json();

    if (!url || !project_id) {
      return new Response(
        JSON.stringify({ error: "url and project_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const provider = detectProvider(normalizedUrl);
    const domain = extractDomain(normalizedUrl);

    console.log(`Scraping URL: ${normalizedUrl} (provider: ${provider})`);

    // Step 1: Fetch page metadata
    const meta = await fetchPageMeta(normalizedUrl);

    console.log(`Page meta: title="${meta.title}", ogImage="${meta.ogImage}"`);

    // Step 2: AI analysis if OG image available
    let aiEntities: any = {
      brand_name: meta.ogTitle || meta.title || domain,
      color_palette: [],
      summary: meta.description || "",
      tags: [provider, domain.split(".")[0]],
      source_url: normalizedUrl,
      provider,
      scraped_at: new Date().toISOString(),
    };

    if (meta.ogImage && LOVABLE_API_KEY) {
      try {
        console.log(`Analyzing OG image with Gemini: ${meta.ogImage}`);
        const geminiResult = await analyzeWithGemini(
          LOVABLE_API_KEY,
          meta.ogImage,
          meta.ogTitle || meta.title,
          normalizedUrl
        );

        aiEntities = {
          ...aiEntities,
          color_palette: geminiResult.color_palette || [],
          brand_name: geminiResult.brand_name || aiEntities.brand_name,
          summary: geminiResult.summary || meta.description || "",
          tags: [...new Set([...(geminiResult.tags || []), provider])],
        };

        console.log(`Gemini extracted ${geminiResult.color_palette?.length || 0} colors`);
      } catch (e) {
        console.error("Gemini analysis failed:", e);
        // Continue without AI analysis
      }
    }

    // Step 3: Determine workspace_id if not provided
    let finalWorkspaceId = workspace_id;
    if (!finalWorkspaceId) {
      const { data: project } = await supabase
        .from("projects")
        .select("workspace_id")
        .eq("id", project_id)
        .single();
      finalWorkspaceId = project?.workspace_id;
    }

    // Step 4: Save as project_asset
    const { data: asset, error: insertError } = await supabase
      .from("project_assets")
      .insert({
        project_id,
        workspace_id: finalWorkspaceId,
        uploaded_by_user_id: user_id || null,
        source_type: "link",
        asset_type: "image",
        title: meta.ogTitle || meta.title || domain,
        category: "reference",
        visibility: "internal",
        url: normalizedUrl,
        provider: provider === "instagram" || provider === "youtube" ? provider : "generic",
        og_image_url: meta.ogImage || null,
        thumb_url: meta.ogImage || null,
        ai_title: meta.ogTitle || meta.title || domain,
        ai_summary: aiEntities.summary || null,
        ai_tags: aiEntities.tags || [],
        ai_entities: aiEntities,
        ai_processed: !!(meta.ogImage && LOVABLE_API_KEY),
        status: "ready",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`Asset created: ${asset.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        asset_id: asset.id,
        title: asset.title,
        og_image: meta.ogImage,
        colors_found: aiEntities.color_palette?.length || 0,
        brand_name: aiEntities.brand_name,
        provider,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scrape-client-url error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
