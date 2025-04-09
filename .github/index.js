addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    const m3u8Url = url.searchParams.get('url');
  
    if (m3u8Url) {
      return proxyM3u8(m3u8Url, request);
    }
  
    const segmentUrl = url.pathname.slice(1);
    if (segmentUrl) {
      return proxySegment(segmentUrl, request);
    }
  
    return new Response('Invalid request', { status: 400 });
  }
  
  async function proxyM3u8(m3u8Url, request) {
    try {
      const originalResponse = await fetch(m3u8Url);
      if (!originalResponse.ok) {
        return new Response(`Error fetching M3u8: ${originalResponse.status}`, { status: originalResponse.status });
      }
  
      let m3u8Content = await originalResponse.text();
      const baseUrl = new URL(m3u8Url).origin;
  
      // Rewrite URLs
      m3u8Content = m3u8Content.replace(/(https?:\/\/[^\s]+?\.ts)/g, `${new URL(request.url).origin}/$1`);
      m3u8Content = m3u8Content.replace(/(URI=")([^"]+)(\.key")/g, `$1${new URL(request.url).origin}/$2$3`); // Handle encryption keys
  
      const headers = {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*', // Allow all origins
      };
  
      // Copy any relevant headers from the original response
      if (originalResponse.headers.has('Content-Disposition')) {
        headers['Content-Disposition'] = originalResponse.headers.get('Content-Disposition');
      }
  
      return new Response(m3u8Content, { headers });
    } catch (error) {
      console.error('Error proxying M3u8:', error);
      return new Response('Error proxying M3u8', { status: 500 });
    }
  }
  
  async function proxySegment(segmentUrl, request) {
    try {
      const originalResponse = await fetch(segmentUrl, {
        headers: {
          'Range': request.headers.get('Range'),
          'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': new URL(request.url).origin,
        },
      });
  
      if (!originalResponse.ok) {
        return new Response(`Error fetching segment: ${originalResponse.status}`, { status: originalResponse.status });
      }
  
      const segment = await originalResponse.arrayBuffer();
  
      const headers = {
        'Content-Type': 'video/MP2T',
        'Content-Range': originalResponse.headers.get('Content-Range'),
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*', // Allow all origins
      };
  
      // Copy any relevant headers from the original response
      if (originalResponse.headers.has('Content-Disposition')) {
        headers['Content-Disposition'] = originalResponse.headers.get('Content-Disposition');
      }
  
      return new Response(segment, {
        status: originalResponse.status,
        headers,
      });
    } catch (error) {
      console.error('Error proxying segment:', error);
      return new Response('Error proxying segment', { status: 500 });
    }
  }