/**
 * Phase 1 PDF service stub. Playwright/Chromium fills this container later.
 * /health is 200; every other path is 501.
 */
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3001);

createServer((request, response) => {
  const path = (request.url ?? "/").split("?")[0];
  if (path === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, service: "flyte-pdf", stub: true }));
    return;
  }
  response.writeHead(501, { "content-type": "application/json" });
  response.end(JSON.stringify({ error: "not implemented", service: "flyte-pdf" }));
}).listen(port, "0.0.0.0");
