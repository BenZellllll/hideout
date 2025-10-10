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

    // SSRF protection - block internal networks
    try {
      const target = new URL(url);
      if (!/^https?:$/.test(target.protocol)) {
        return new Response(
          JSON.stringify({ error: 'Invalid protocol' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Block private IP ranges and localhost
      const hostname = target.hostname.toLowerCase();
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^172\.(1[6-9]|2[0-9]|3[01])\./,
        /^192\.168\./,
        /^169\.254\./,  // AWS/GCP metadata
        /^0\./,
        /^\[?::1\]?$/,  // IPv6 localhost
        /^\[?fe80:/i,   // IPv6 link-local
        /^\[?fc00:/i,   // IPv6 unique local
      ];
      
      if (blockedPatterns.some(pattern => pattern.test(hostname))) {
        return new Response(
          JSON.stringify({ error: 'Blocked: Cannot access internal resources' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Proxying request to:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: `Failed to load page: ${response.status}`,
          success: false 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();

    if (contentType.includes('text/html')) {
      const baseUrl = new URL(url).origin;
      const functionBase = `${new URL(req.url).origin}/functions/v1/http-proxy`;
      content = content
        .replace(/<head>/i, `<head><base href="${baseUrl}/">`)
        .replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '')
        .replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');

      // Inject resource rewriter so images, scripts, styles, iframes, media load via proxy
      const injector = `<script>(function(){
        const functionBase='${functionBase}';
        const currentUrl='${url}';
        const toProxy=(u)=>{ try{ if(!u) return u; const abs=new URL(u, currentUrl).href; return functionBase+'?url='+encodeURIComponent(abs);}catch{return u;}};
        function rewrite(){
          document.querySelectorAll('a[href]').forEach(a=>{ const href=a.getAttribute('href'); if(href && !href.startsWith('#') && !href.startsWith('javascript:')){ a.setAttribute('data-original-href', href); a.href=toProxy(href);} });
          document.querySelectorAll('form[action]').forEach(f=>{ const action=f.getAttribute('action'); if(action){ f.setAttribute('data-original-action', action); f.action=toProxy(action);} });
          document.querySelectorAll('img[src], script[src], iframe[src], video[src], audio[src], source[src]').forEach(el=>{ const s=el.getAttribute('src'); if(s){ el.setAttribute('data-original-src', s); el.setAttribute('src', toProxy(s)); }});
          document.querySelectorAll('link[rel="stylesheet"][href]').forEach(l=>{ const h=l.getAttribute('href'); if(h){ l.setAttribute('data-original-href', h); l.setAttribute('href', toProxy(h)); }});
        }
        if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', rewrite); } else { rewrite(); }
        const mo=new MutationObserver(rewrite); mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','href']});
      })();<\/script>`;

      if (/<\/head>/i.test(content)) {
        content = content.replace(/<\/head>/i, injector + '</head>');
      } else if (/<\/body>/i.test(content)) {
        content = content.replace(/<\/body>/i, injector + '</body>');
      } else {
        content += injector;
      }
    }

    return new Response(
      JSON.stringify({ 
        html: content,
        success: true 
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
