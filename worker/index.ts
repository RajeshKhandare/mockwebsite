export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("MockTest Worker", { headers: { "content-type": "text/plain; charset=utf-8" } });
  },
};
