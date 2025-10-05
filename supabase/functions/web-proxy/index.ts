import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying request to:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch: ${response.status} ${response.statusText}`,
          url: url 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();

    // If HTML, inject base tag and remove frame-busting headers
    if (contentType.includes('text/html')) {
      const baseUrl = new URL(url).origin;
      content = content
        .replace('<head>', `<head><base href="${baseUrl}/">`)
        .replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '')
        .replace(/<meta[^>]*content=["']?frame-ancestors[^>]*>/gi, '');
    }

    return new Response(content, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'X-Frame-Options': 'ALLOWALL'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
