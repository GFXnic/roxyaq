async function handleCorsRequest(targetUrl, headers) {
	try {
		const response = await fetch(targetUrl, {
			redirect: 'follow',
			headers: headers,
		});

		const responseHeaders = new Headers(response.headers);
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');

		return new Response(response.body, {
			status: response.status,
			headers: responseHeaders,
		});
	} catch (error) {
		console.error('Error fetching the webpage:', error.message);
		return new Response('An error occurred while fetching the webpage.', {
			status: 500,
			headers: { 'Access-Control-Allow-Origin': '*' },
		});
	}
}

export default handleCorsRequest;
