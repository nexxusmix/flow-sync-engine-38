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
    console.log('Fetching Instagram profile via Firecrawl:', cleanUsername);

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

    if (!response.ok || !result?.success) {
      const providerError = result?.error || 'Não foi possível acessar o perfil';
      return new Response(
        JSON.stringify({
          success: false,
          error: `Coleta automática indisponível para Instagram: ${providerError}`,
          source: 'firecrawl',
          unsupported_site: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = result.data?.markdown || result.markdown || '';
    const metadata = result.data?.metadata || result.metadata || {};

    const desc = metadata.description || metadata.ogDescription || '';

    let followers = 0;
    let following = 0;
    let posts_count = 0;

    const descMatch = desc.match(/([\d,.KMkm]+)\s*Followers?,\s*([\d,.KMkm]+)\s*Following,\s*([\d,.KMkm]+)\s*Posts?/i);
    if (descMatch) {
      followers = parseMetricNumber(descMatch[1]);
      following = parseMetricNumber(descMatch[2]);
      posts_count = parseMetricNumber(descMatch[3]);
    }

    if (followers === 0) {
      const postsMatch = markdown.match(/([\d,.KMkm]+)\s*posts?\b/i);
      const followersMatch = markdown.match(/([\d,.KMkm]+)\s*followers?\b/i);
      const followingMatch = markdown.match(/([\d,.KMkm]+)\s*following\b/i);

      if (followersMatch) followers = parseMetricNumber(followersMatch[1]);
      if (followingMatch) following = parseMetricNumber(followingMatch[1]);
      if (postsMatch) posts_count = parseMetricNumber(postsMatch[1]);
    }

    if (followers === 0) {
      const seguidoresMatch = markdown.match(/([\d,.KMkm]+)\s*(?:seguidores|seguidor)/i);
      const seguindoMatch = markdown.match(/([\d,.KMkm]+)\s*seguindo/i);
      const pubMatch = markdown.match(/([\d,.KMkm]+)\s*(?:publicações|publicacao|publica)/i);

      if (seguidoresMatch) followers = parseMetricNumber(seguidoresMatch[1]);
      if (seguindoMatch) following = parseMetricNumber(seguindoMatch[1]);
      if (pubMatch) posts_count = parseMetricNumber(pubMatch[1]);
    }

    if (followers === 0 && following === 0 && posts_count === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não foi possível extrair métricas do perfil.',
          source: 'firecrawl',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username: cleanUsername,
          followers,
          following,
          posts_count,
          full_name: null,
          bio: null,
          profile_pic: metadata.ogImage || null,
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
  const multiplierMatch = clean.match(/([\d.]+)\s*([KMkm])/);
  if (multiplierMatch) {
    const num = parseFloat(multiplierMatch[1]);
    const mult = multiplierMatch[2].toUpperCase();
    if (mult === 'K') return Math.round(num * 1000);
    if (mult === 'M') return Math.round(num * 1000000);
  }
  return parseInt(clean, 10) || 0;
}
