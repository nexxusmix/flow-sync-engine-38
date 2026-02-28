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
    console.log('Fetching Instagram profile via Firecrawl:', cleanUsername);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileUrl = `https://www.instagram.com/${cleanUsername}/`;

    // Use Firecrawl to scrape – it renders JS and bypasses basic blocks
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

    if (!response.ok || !result.success) {
      console.error('Firecrawl error:', JSON.stringify(result).substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível acessar o perfil via Firecrawl' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = result.data?.markdown || result.markdown || '';
    const metadata = result.data?.metadata || result.metadata || {};
    
    console.log('Markdown length:', markdown.length);
    console.log('Metadata title:', metadata.title);
    console.log('Markdown preview:', markdown.substring(0, 500));

    // Parse from metadata (og:description usually has "X Followers, Y Following, Z Posts")
    const desc = metadata.description || metadata.ogDescription || '';
    console.log('Meta description:', desc);

    let followers = 0, following = 0, posts_count = 0;
    let full_name: string | null = null;
    let bio: string | null = null;
    let profile_pic: string | null = metadata.ogImage || null;

    // Pattern 1: "123 Followers, 456 Following, 78 Posts"
    const descMatch = desc.match(/([\d,.KMkm]+)\s*Followers?,\s*([\d,.KMkm]+)\s*Following,\s*([\d,.KMkm]+)\s*Posts?/i);
    if (descMatch) {
      followers = parseMetricNumber(descMatch[1]);
      following = parseMetricNumber(descMatch[2]);
      posts_count = parseMetricNumber(descMatch[3]);
      console.log('Parsed from meta description:', { followers, following, posts_count });
    }

    // Pattern 2: Try from markdown content - Instagram shows "X posts", "Y followers", "Z following"
    if (followers === 0) {
      // Try patterns like "1,234 posts" "5.6M followers" "890 following"
      const postsMatch = markdown.match(/([\d,.KMkm]+)\s*posts?\b/i);
      const followersMatch = markdown.match(/([\d,.KMkm]+)\s*followers?\b/i);
      const followingMatch = markdown.match(/([\d,.KMkm]+)\s*following\b/i);

      if (followersMatch) followers = parseMetricNumber(followersMatch[1]);
      if (followingMatch) following = parseMetricNumber(followingMatch[1]);
      if (postsMatch) posts_count = parseMetricNumber(postsMatch[1]);
      console.log('Parsed from markdown:', { followers, following, posts_count });
    }

    // Pattern 3: Try "Seguidores" (Portuguese Instagram)
    if (followers === 0) {
      const seguidoresMatch = markdown.match(/([\d,.KMkm]+)\s*(?:seguidores|seguidor)/i);
      const seguindoMatch = markdown.match(/([\d,.KMkm]+)\s*seguindo/i);
      const pubMatch = markdown.match(/([\d,.KMkm]+)\s*(?:publicações|publicacao|publica)/i);

      if (seguidoresMatch) followers = parseMetricNumber(seguidoresMatch[1]);
      if (seguindoMatch) following = parseMetricNumber(seguindoMatch[1]);
      if (pubMatch) posts_count = parseMetricNumber(pubMatch[1]);
      console.log('Parsed from PT markdown:', { followers, following, posts_count });
    }

    // Extract name from title: "Name (@username) • Instagram"
    const titleMatch = (metadata.title || '').match(/^(.+?)\s*[\(•@]/);
    if (titleMatch) full_name = titleMatch[1].trim();

    // Extract bio from description after the metrics
    const bioMatch = desc.match(/Posts?\s*[-–—]\s*(.+)/i);
    if (bioMatch) bio = bioMatch[1].trim().replace(/"/g, '');

    if (followers === 0 && following === 0 && posts_count === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair métricas do perfil. Verifique se é público e o username está correto.',
          debug: { markdownPreview: markdown.substring(0, 300), desc }
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          full_name,
          bio,
          profile_pic,
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
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
