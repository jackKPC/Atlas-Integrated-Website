const http = require("http");
const handler = require("serve-handler");

const OPENROUTER_MODEL = "inclusionai/ling-3.0-flash:free";
const MAX_BODY_BYTES = 32 * 1024;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function handleTutor(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[tutor] OPENROUTER_API_KEY is not set");
    sendJson(res, 500, { error: "tutor is not configured" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: "invalid request body" });
    return;
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : null;
  if (!messages || !messages.length) {
    sendJson(res, 400, { error: "messages required" });
    return;
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": "https://atlasintegrated.ai/ccna2",
        "X-Title": "SRWE Adaptive Trainer",
      },
      body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: 1000 }),
    });

    let data;
    try {
      data = await upstream.json();
    } catch (parseErr) {
      console.error(`[tutor] upstream ${upstream.status}, non-JSON body: ${parseErr.message}`);
      sendJson(res, 502, { error: "upstream error" });
      return;
    }

    if (!upstream.ok) {
      const keyPreview = `length=${apiKey.length} prefix=${JSON.stringify(apiKey.slice(0, 12))} suffix=${JSON.stringify(apiKey.slice(-4))}`;
      console.error(`[tutor] upstream ${upstream.status}: ${JSON.stringify(data)} | key ${keyPreview}`);
      sendJson(res, 502, { error: "upstream error" });
      return;
    }

    const text = data.choices?.[0]?.message?.content || "";
    sendJson(res, 200, { text });
  } catch (err) {
    console.error(`[tutor] request failed: ${err.message}`);
    sendJson(res, 502, { error: "upstream request failed" });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/tutor") {
    handleTutor(req, res);
    return;
  }
  handler(req, res);
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log("listening on " + port);
});
