## Cloudflare Proxy

This application serves as a proxy for HLS streams, Images and enabling secure access to media content.

### Deploy Using Cloudflare deploy button

- Enter valid Cloudflare API key and Account ID.
- Enable github workflows
- Run **`deploy`** workflow in your forked repo actions `https://github.com/[User-Name]/[Repo-Name]/actions/workflows/deploy.yml` .
  
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Toasty360/Roxy)
>[!TIP]
> Dont' forget to run the workflow

### Deploy Manually

- Setup wrangler on your system.
- Download the source code.
- Run `npm install`
- Run `npm run dev` or `wrangler dev` in your terminal to start a development server
- Open a browser tab at http://localhost:8787/ to see your worker in action
- Run `wrangler deploy` to publish your worker

### Proxy Endpoint

- `/proxy` - for HLS
- `/cors` - for Images/Web pages
- `/image` - for Images/Web pages
- `/thumbnail` - for thumbnail images

Use the following format to access the proxy:

```
/proxy?url=<encoded_m3u8_url>&headers=<encoded_headers>
```

- **`url`**: Base64-encoded M3U8 URL.
- **`headers`**: (Optional) Base64-encoded JSON string for custom headers.

---

### Encoding Instructions

#### Encode M3U8 URL:

```javascript
btoa('http://example.com/stream.m3u8');
```

#### Encode Headers (if needed):

```javascript
btoa(JSON.stringify({ Referrer: 'https://anitaku.bz' }));
```

---

### Example Request

```
/proxy?url=aHR0cDovL2V4YW1wbGUuY29tL3N0cmVhbS5tM3U4&headers=eyJBdXRob3JpemF0aW9uIjoiQmVhcmVyIHRva2VuIn0=
```
