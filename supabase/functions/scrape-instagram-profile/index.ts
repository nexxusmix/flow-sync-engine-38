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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    const profileUrl = `https://www.instagram.com/${cleanUsername}/`;

    console.log('Scraping Instagram profile:', profileUrl);

    // Use Firecrawl to scrape the public profile page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: profileUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await response.json();

    if (!response.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao acessar perfil: ${scrapeData.error || response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    console.log('Scraped markdown length:', markdown.length);

    // Parse metrics from the scraped content
    const metrics = parseInstagramMetrics(markdown, metadata);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username: cleanUsername,
          ...metrics,
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

function parseInstagramMetrics(markdown: string, metadata: any) {
  const result: Record<string, any> = {
    followers: 0,
    following: 0,
    posts_count: 0,
    bio: null,
    full_name: null,
  };

  // Try to extract from metadata title (e.g. "username • Instagram photos and videos")
  if (metadata?.title) {
    result.full_name = metadata.title.split('(')[0]?.split('•')[0]?.trim() || null;
  }

  if (metadata?.description) {
    result.bio = metadata.description;
    
    // Try parsing "X Followers, Y Following, Z Posts" pattern from description
    const descMatch = metadata.description.match(
      /(\d[\d,.KMkm]*)\s*Followers?\s*,\s*(\d[\d,.KMkm]*)\s*Following\s*,\s*(\d[\d,.KMkm]*)\s*Posts?/i
    );
    if (descMatch) {
      result.followers = parseMetricNumber(descMatch[1]);
      result.following = parseMetricNumber(descMatch[2]);
      result.posts_count = parseMetricNumber(descMatch[3]);
      return result;
    }
  }

  // Parse from markdown content - various patterns
  const patterns = [
    // "1,234 Followers" / "1.2K followers"
    { regex: /([\d,.]+[KMkm]?)\s*(?:followers|seguidores)/i, field: 'followers' },
    { regex: /([\d,.]+[KMkm]?)\s*(?:following|seguindo)/i, field: 'following' },
    { regex: /([\d,.]+[KMkm]?)\s*(?:posts|publicações|publicacoes)/i, field: 'posts_count' },
    // Reverse: "Followers 1,234"
    { regex: /(?:followers|seguidores)\s*([\d,.]+[KMkm]?)/i, field: 'followers' },
    { regex: /(?:following|seguindo)\s*([\d,.]+[KMkm]?)/i, field: 'following' },
    { regex: /(?:posts|publicações|publicacoes)\s*([\d,.]+[KMkm]?)/i, field: 'posts_count' },
  ];

  for (const { regex, field } of patterns) {
    const match = markdown.match(regex);
    if (match && !result[field]) {
      result[field] = parseMetricNumber(match[1]);
    }
  }

  return result;
}

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
