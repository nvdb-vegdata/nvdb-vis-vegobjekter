import index from "./index.html";

const UBERIKET_BASE_URL = "https://nvdbapiles.atlas.vegvesen.no/uberiket";

Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/uberiket/*": async (req) => {
      const url = new URL(req.url);
      const targetUrl = new URL(url.pathname.replace("/uberiket", ""), UBERIKET_BASE_URL);
      targetUrl.search = url.search;

      const headers = new Headers(req.headers);
      headers.set("X-Client", "nvdb-vis-vegobjekter");
      headers.delete("host");

      const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
      const proxyRequest = new Request(targetUrl, {
        method: req.method,
        headers,
        body,
      });

      const response = await fetch(proxyRequest);

      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Server running at http://localhost:3000");
