const http = require("http");
const path = require("path");
const { readFile } = require("fs/promises");
const handler = require("serve-handler");

const OPENROUTER_MODEL = "inclusionai/ling-3.0-flash:free";
// Exhibit questions need a model that accepts image input; the default text
// model above does not. Free vision endpoints come and go on OpenRouter, so
// instead of pinning one ID we discover what's currently available from the
// public catalog and fall through a ranked chain until a call succeeds.
// OPENROUTER_VISION_MODEL still overrides everything when set.
const VISION_MODEL_FALLBACKS = [
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "google/gemma-3-27b-it:free",
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
];
const VISION_PREFERENCE = ["gemini", "qwen", "gemma", "mistral-small", "llama"];
const VISION_CHAIN_MAX = 4;
const VISION_CACHE_MS = 6 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 32 * 1024;

let visionCache = { at: 0, models: [] };

async function getVisionModels() {
  if (process.env.OPENROUTER_VISION_MODEL) return [process.env.OPENROUTER_VISION_MODEL];
  if (visionCache.models.length && Date.now() - visionCache.at < VISION_CACHE_MS) return visionCache.models;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error(`models endpoint ${res.status}`);
    const data = await res.json();
    const free = (data.data || []).filter((m) =>
      typeof m.id === "string" && m.id.endsWith(":free") &&
      (m.architecture?.input_modalities || []).includes("image"));
    const rank = (id) => {
      const p = VISION_PREFERENCE.findIndex((s) => id.includes(s));
      return p === -1 ? VISION_PREFERENCE.length : p;
    };
    const models = free.map((m) => m.id).sort((a, b) => rank(a) - rank(b)).slice(0, VISION_CHAIN_MAX);
    if (models.length) {
      visionCache = { at: Date.now(), models };
      return models;
    }
  } catch (err) {
    console.error(`[tutor] vision model discovery failed: ${err.message}`);
  }
  return VISION_MODEL_FALLBACKS.slice(0, VISION_CHAIN_MAX);
}
const MAX_IMAGES = 4;
const ASSETS_DIR = path.join(__dirname, "ccna3-assets");
const IMAGE_MIME = { ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function loadExhibitImages(srcs) {
  const parts = [];
  for (const src of srcs.slice(0, MAX_IMAGES)) {
    if (typeof src !== "string" || !src.startsWith("/ccna3-assets/")) continue;
    const filePath = path.join(ASSETS_DIR, src.slice("/ccna3-assets/".length));
    if (!path.resolve(filePath).startsWith(ASSETS_DIR + path.sep)) continue;
    const mime = IMAGE_MIME[path.extname(filePath).toLowerCase()];
    if (!mime) continue;
    try {
      const buf = await readFile(filePath);
      parts.push({ type: "image_url", image_url: { url: `data:${mime};base64,${buf.toString("base64")}` } });
    } catch (err) {
      console.error(`[tutor] could not read exhibit ${src}: ${err.message}`);
    }
  }
  return parts;
}

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

  let models = [OPENROUTER_MODEL];
  const imageSrcs = Array.isArray(payload.images) ? payload.images : [];
  if (imageSrcs.length) {
    const imageParts = await loadExhibitImages(imageSrcs);
    if (imageParts.length) {
      models = await getVisionModels();
      const last = messages[messages.length - 1];
      if (typeof last.content === "string") {
        messages[messages.length - 1] = { role: last.role, content: [{ type: "text", text: last.content }, ...imageParts] };
      }
    }
  }

  let lastFailure = "no models attempted";
  for (const model of models) {
    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey,
          "HTTP-Referer": "https://atlasintegrated.ai/ccna2",
          "X-Title": "SRWE Adaptive Trainer",
        },
        body: JSON.stringify({ model, messages, max_tokens: 1000 }),
      });

      let data;
      try {
        data = await upstream.json();
      } catch (parseErr) {
        lastFailure = `${model}: upstream ${upstream.status}, non-JSON body`;
        console.error(`[tutor] ${lastFailure}: ${parseErr.message}`);
        continue;
      }

      if (!upstream.ok) {
        lastFailure = `${model}: upstream ${upstream.status}`;
        console.error(`[tutor] ${lastFailure}: ${JSON.stringify(data)}`);
        continue;
      }

      const text = data.choices?.[0]?.message?.content || "";
      if (!text.trim()) {
        lastFailure = `${model}: empty completion`;
        console.error(`[tutor] ${lastFailure}: ${JSON.stringify(data).slice(0, 400)}`);
        continue;
      }

      if (model !== models[0]) console.error(`[tutor] fell back to ${model}`);
      sendJson(res, 200, { text });
      return;
    } catch (err) {
      lastFailure = `${model}: request failed (${err.message})`;
      console.error(`[tutor] ${lastFailure}`);
    }
  }

  console.error(`[tutor] all ${models.length} model(s) failed; last: ${lastFailure}`);
  sendJson(res, 502, { error: "upstream error" });
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
