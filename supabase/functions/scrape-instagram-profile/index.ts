const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Conector Firecrawl não configurado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileUrl = `https://www.instagram.com/${cleanUsername}/`;
    let followers = 0;
    let following = 0;
    let posts_count = 0;
    let profilePic: string | null = null;
    let source = 'unknown';

    // Strategy 1: Try Firecrawl
    if (apiKey) {
      console.log('Trying Firecrawl for:', cleanUsername);
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: profileUrl,
            formats: ['markdown'],
            onlyMainContent: false,
            waitFor: 3000,
          }),
        });

        const result = await response.json();
        console.log('Firecrawl status:', response.status);

        if (response.ok && result?.success) {
          const markdown = result.data?.markdown || result.markdown || '';
          const metadata = result.data?.metadata || result.metadata || {};
          const desc = metadata.description || metadata.ogDescription || '';
          profilePic = metadata.ogImage || null;

          const parsed = parseMetricsFromText(desc + ' ' + markdown);
          followers = parsed.followers;
          following = parsed.following;
          posts_count = parsed.posts_count;
          if (followers > 0) source = 'firecrawl';
        }
      } catch (e) {
        console.log('Firecrawl failed:', e);
      }
    }

    // Strategy 2: Direct fetch with meta tag parsing (fallback)
    if (followers === 0) {
      console.log('Trying direct fetch for:', cleanUsername);
      try {
        const directRes = await fetch(profileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (directRes.ok) {
          const html = await directRes.text();
          // Parse meta description: "X Followers, Y Following, Z Posts"
          const metaMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i)
            || html.match(/content="([^"]+)"\s+(?:name|property)="(?:description|og:description)"/i);
          if (metaMatch) {
            const parsed = parseMetricsFromText(metaMatch[1]);
            followers = parsed.followers;
            following = parsed.following;
            posts_count = parsed.posts_count;
            if (followers > 0) source = 'direct_meta';
          }
          // Try og:image for profile pic
          if (!profilePic) {
            const ogImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
              || html.match(/content="([^"]+)"\s+property="og:image"/i);
            if (ogImg) profilePic = ogImg[1];
          }
        }
      } catch (e) {
        console.log('Direct fetch failed:', e);
      }
    }

    // Strategy 3: Try i.instagram.com API (mobile endpoint)
    if (followers === 0) {
      console.log('Trying mobile API for:', cleanUsername);
      try {
        const mobileRes = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${cleanUsername}`, {
          headers: {
            'User-Agent': 'Instagram 275.0.0.27.98 Android',
            'X-IG-App-ID': '936619743392459',
          },
        });
        if (mobileRes.ok) {
          const mobileData = await mobileRes.json();
          const user = mobileData?.data?.user;
          if (user) {
            followers = user.edge_followed_by?.count || 0;
            following = user.edge_follow?.count || 0;
            posts_count = user.edge_owner_to_timeline_media?.count || 0;
            profilePic = user.profile_pic_url_hd || user.profile_pic_url || profilePic;
            if (followers > 0) source = 'mobile_api';
          }
        }
      } catch (e) {
        console.log('Mobile API failed:', e);
      }
    }

    if (followers === 0 && following === 0 && posts_count === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível extrair métricas do perfil. Use a entrada manual.',
          source: 'all_failed',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Success via ${source}: followers=${followers}, following=${following}, posts=${posts_count}`);

    return new Response(
      JSON.stringify({
        success: true,
        source,
        data: {
          username: cleanUsername,
          followers,
          following,
          posts_count,
          full_name: null,
          bio: null,
          profile_pic: profilePic,
          is_verified: false,
          is_private: false,
          external_url: null,
          scraped_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseMetricNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, '').trim();
  const multiplierMatch = clean.match(/([\d.]+)\s*([KMkmBb])/);
  if (multiplierMatch) {
    const num = parseFloat(multiplierMatch[1]);
    const mult = multiplierMatch[2].toUpperCase();
    if (mult === 'K') return Math.round(num * 1000);
    if (mult === 'M') return Math.round(num * 1000000);
    if (mult === 'B') return Math.round(num * 1000000000);
  }
  return parseInt(clean, 10) || 0;
}

function parseMetricsFromText(text: string): { followers: number; following: number; posts_count: number } {
  let followers = 0, following = 0, posts_count = 0;

  // Pattern: "X Followers, Y Following, Z Posts"
  const enMatch = text.match(/([\d,.KMkmBb]+)\s*Followers?,\s*([\d,.KMkmBb]+)\s*Following,\s*([\d,.KMkmBb]+)\s*Posts?/i);
  if (enMatch) {
    followers = parseMetricNumber(enMatch[1]);
    following = parseMetricNumber(enMatch[2]);
    posts_count = parseMetricNumber(enMatch[3]);
    if (followers > 0) return { followers, following, posts_count };
  }

  // Individual matches (English)
  const fMatch = text.match(/([\d,.KMkmBb]+)\s*followers?\b/i);
  const fgMatch = text.match(/([\d,.KMkmBb]+)\s*following\b/i);
  const pMatch = text.match(/([\d,.KMkmBb]+)\s*posts?\b/i);
  if (fMatch) followers = parseMetricNumber(fMatch[1]);
  if (fgMatch) following = parseMetricNumber(fgMatch[1]);
  if (pMatch) posts_count = parseMetricNumber(pMatch[1]);
  if (followers > 0) return { followers, following, posts_count };

  // Portuguese
  const segMatch = text.match(/([\d,.KMkmBb]+)\s*(?:seguidores|seguidor)/i);
  const segdoMatch = text.match(/([\d,.KMkmBb]+)\s*seguindo/i);
  const pubMatch = text.match(/([\d,.KMkmBb]+)\s*(?:publicações|publicacao|publica)/i);
  if (segMatch) followers = parseMetricNumber(segMatch[1]);
  if (segdoMatch) following = parseMetricNumber(segdoMatch[1]);
  if (pubMatch) posts_count = parseMetricNumber(pubMatch[1]);

  return { followers, following, posts_count };
}
