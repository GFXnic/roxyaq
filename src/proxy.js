import { decodeHeaders } from './utils/handler';

const m3u8ContentTypes = [
    'application/vnd.apple.mpegurl',
    'application/x-mpegurl',
    'audio/x-mpegurl',
    'audio/mpegurl',
    'video/x-mpegurl',
    'application/mpegurl',
    'application/x-hls',
    'application/x-apple-hls',
];

const videoContentTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/MP2T',
    'application/mp4',
    'video/x-m4v',
    ...m3u8ContentTypes,
];

async function proxy(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    try {
        const url = new URL(request.url);
        const urlParams = url.searchParams;
        const targetUrl = urlParams.get('url');
        const headersJson = urlParams.get('headers');

        if (!targetUrl) {
            return new Response('"url" query parameter is required', {
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const mediaUrl = decodeURIComponent(targetUrl);
        let decodedHeaders = {};

        if (headersJson) {
            try {
                decodedHeaders = JSON.parse(decodeURIComponent(headersJson));
            } catch (e) {
                return new Response('Invalid headers format. Must be valid JSON.', {
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    },
                });
            }
        }

        const baseUrl = new URL(mediaUrl);
        const basePath = `${baseUrl.protocol}//${baseUrl.host}${baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1)}`;

        const rangeHeader = request.headers.get('Range');
        const fetchHeaders = {
            ...decodedHeaders,
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
        };

        if (rangeHeader) {
            fetchHeaders['Range'] = rangeHeader;
        }

        const response = await fetch(mediaUrl, {
            headers: fetchHeaders,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const isM3U8 = m3u8ContentTypes.some((type) => contentType.includes(type));

        if (!isM3U8) {
            return new Response(response.body, {
                status: response.status,
                headers: {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Accept-Ranges': 'bytes',
                    'Content-Length': response.headers.get('content-length'),
                    'Content-Range': response.headers.get('content-range'),
                },
            });
        }

        let responseContent = await response.text();
        responseContent = responseContent.replace(/URI=['"](.*?)['"]/, (_, url) => {
            const fullUrl = url.startsWith('http')
                ? url
                : url.startsWith('/')
                    ? `${baseUrl.protocol}//${baseUrl.host}${url}`
                    : `${basePath}${url}`;
            return `URI="${new URL(request.url).origin}/proxy?url=${encodeURIComponent(fullUrl)}&headers=${encodeURIComponent(JSON.stringify(decodedHeaders))}"`;
        });

        const modifiedBody = responseContent.replace(/^(?!#)([^\s]+)$/gm, (match) => {
            const fullUrl = match.startsWith('http')
                ? match
                : match.startsWith('/')
                    ? `${baseUrl.protocol}//${baseUrl.host}${match}`
                    : `${basePath}${match}`;
            return `${new URL(request.url).origin}/proxy?url=${encodeURIComponent(fullUrl)}&headers=${encodeURIComponent(JSON.stringify(decodedHeaders))}`;
        });

        return new Response(modifiedBody, {
            headers: {
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error) {
        console.error('Error in proxy:', error);
        return new Response(`Proxy error: ${error.message}`, {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}

export default proxy;