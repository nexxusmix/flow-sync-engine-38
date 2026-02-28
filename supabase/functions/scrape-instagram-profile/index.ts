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
    console.log('Fetching Instagram profile:', cleanUsername);

    // Try multiple public endpoints to get profile data
    const profileData = await fetchInstagramProfile(cleanUsername);

    if (!profileData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível acessar os dados do perfil. Verifique se o perfil é público e o username está correto.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          username: cleanUsername,
          ...profileData,
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

async function fetchInstagramProfile(username: string) {
  // Method 1: Instagram public JSON endpoint
  try {
    const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (res.ok) {
      const json = await res.json();
      const user = json?.data?.user;
      if (user) {
        console.log('Method 1 success: web_profile_info');
        return {
          followers: user.edge_followed_by?.count || 0,
          following: user.edge_follow?.count || 0,
          posts_count: user.edge_owner_to_timeline_media?.count || 0,
          full_name: user.full_name || null,
          bio: user.biography || null,
          profile_pic: user.profile_pic_url_hd || user.profile_pic_url || null,
          is_verified: user.is_verified || false,
          is_private: user.is_private || false,
          external_url: user.external_url || null,
        };
      }
    } else {
      const text = await res.text();
      console.log('Method 1 failed:', res.status, text.substring(0, 200));
    }
  } catch (e) {
    console.log('Method 1 error:', e.message);
  }

  // Method 2: Instagram /?__a=1&__d=dis endpoint
  try {
    const res = await fetch(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
    });

    if (res.ok) {
      const json = await res.json();
      const user = json?.graphql?.user || json?.user;
      if (user) {
        console.log('Method 2 success: __a=1');
        return {
          followers: user.edge_followed_by?.count || user.follower_count || 0,
          following: user.edge_follow?.count || user.following_count || 0,
          posts_count: user.edge_owner_to_timeline_media?.count || user.media_count || 0,
          full_name: user.full_name || null,
          bio: user.biography || null,
          profile_pic: user.profile_pic_url_hd || user.profile_pic_url || null,
          is_verified: user.is_verified || false,
          is_private: user.is_private || false,
          external_url: user.external_url || null,
        };
      }
    } else {
      const text = await res.text();
      console.log('Method 2 failed:', res.status, text.substring(0, 200));
    }
  } catch (e) {
    console.log('Method 2 error:', e.message);
  }

  // Method 3: Parse from HTML meta tags
  try {
    const res = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (res.ok) {
      const html = await res.text();
      
      // Parse from meta description: "X Followers, Y Following, Z Posts"
      const descMatch = html.match(/content="([\d,.KMkm]+)\s*Followers?,\s*([\d,.KMkm]+)\s*Following,\s*([\d,.KMkm]+)\s*Posts?/i);
      
      if (descMatch) {
        console.log('Method 3 success: HTML meta');
        return {
          followers: parseMetricNumber(descMatch[1]),
          following: parseMetricNumber(descMatch[2]),
          posts_count: parseMetricNumber(descMatch[3]),
          full_name: extractMeta(html, 'og:title')?.split('(')[0]?.split('•')[0]?.trim() || null,
          bio: extractMeta(html, 'description') || null,
          profile_pic: extractMeta(html, 'og:image') || null,
          is_verified: false,
          is_private: false,
          external_url: null,
        };
      } else {
        console.log('Method 3: no meta match found');
      }
    } else {
      const text = await res.text();
      console.log('Method 3 failed:', res.status, text.substring(0, 200));
    }
  } catch (e) {
    console.log('Method 3 error:', e.message);
  }

  return null;
}

function extractMeta(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["'](?:og:)?${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  
  // Try reverse order (content before property)
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:)?${property}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : null;
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
