#!/usr/bin/env node
/**
 * ePerusteet MCP Server — HTTP transport
 * Deployable to Railway, Render, Fly.io etc.
 * Implements MCP Streamable HTTP transport (POST /mcp)
 *
 * Public API: https://eperusteet.opintopolku.fi/eperusteet-service/api/external
 * No auth required.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const BASE = "https://eperusteet.opintopolku.fi/eperusteet-service/api/external";

// ─── ePerusteet API ──────────────────────────────────────────────────────────

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "eperusteet-mcp/1.0",
      },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function qs(params) {
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return p ? "?" + p : "";
}

// ─── Tools ───────────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "hae_perusteet",
    description:
      "Hae ePerusteet-tietokannasta opetussuunnitelmia ja tutkintoja. Voit hakea nimellä, koulutustyypillä ja muilla kriteereillä.",
    inputSchema: {
      type: "object",
      properties: {
        nimi: { type: "string", description: "Hae nimellä (esim. 'Lähihoitaja', 'Matematiikka')" },
        koulutustyyppi: {
          type: "string",
          description:
            "Koulutustyyppi: koulutustyyppi_2 (perusopetus), koulutustyyppi_5 (lukio), koulutustyyppi_11 (ammatillinen). Jätä tyhjäksi kaikille.",
        },
        sivu: { type: "number", description: "Sivunumero (alkaa 0)" },
        sivukoko: { type: "number", description: "Tulosten määrä, max 100. Oletus: 10" },
        voimassaolo: { type: "boolean", description: "Vain voimassaolevat" },
        poistunut: { type: "boolean", description: "Sisällytä poistuneet" },
        tuleva: { type: "boolean", description: "Sisällytä tulevat" },
      },
    },
  },
  {
    name: "hae_peruste",
    description: "Hae yksittäisen perusteen kaikki tiedot ID:n perusteella.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Perusteen numeerinen ID (esim. 1013059)" },
      },
      required: ["id"],
    },
  },
  {
    name: "hae_peruste_sisallysluettelo",
    description: "Hae perusteen täydellinen sisällysluettelo ja rakenne.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number", description: "Perusteen ID" },
      },
      required: ["id"],
    },
  },
  {
    name: "hae_koulutusalat",
    description: "Hae kaikki koulutusalat koodeineen.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "hae_tutkinnonosat",
    description: "Hae ammatillisen tutkinnon kaikki tutkinnon osat.",
    inputSchema: {
      type: "object",
      properties: {
        perusteId: { type: "number", description: "Perusteen ID" },
      },
      required: ["perusteId"],
    },
  },
  {
    name: "hae_tutkinnonosa",
    description: "Hae yksittäinen tutkinnon osa.",
    inputSchema: {
      type: "object",
      properties: {
        perusteId: { type: "number", description: "Perusteen ID" },
        tutkinnonosanId: { type: "number", description: "Tutkinnon osan ID" },
      },
      required: ["perusteId", "tutkinnonosanId"],
    },
  },
  {
    name: "hae_oppiaineet",
    description: "Hae perusopetuksen tai lukion perusteen oppiaineet.",
    inputSchema: {
      type: "object",
      properties: {
        perusteId: { type: "number", description: "Perusteen ID" },
      },
      required: ["perusteId"],
    },
  },
  {
    name: "hae_oppiaine",
    description: "Hae yksittäinen oppiaine.",
    inputSchema: {
      type: "object",
      properties: {
        perusteId: { type: "number", description: "Perusteen ID" },
        oppiaineId: { type: "number", description: "Oppiaineen ID" },
      },
      required: ["perusteId", "oppiaineId"],
    },
  },
  {
    name: "hae_uusimmat",
    description: "Hae viimeksi muutetut perusteet.",
    inputSchema: {
      type: "object",
      properties: {
        sivukoko: { type: "number", description: "Tulosten määrä. Oletus: 10." },
      },
    },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "hae_perusteet":
      return apiGet(
        `/perusteet${qs({
          nimi: args.nimi,
          koulutustyyppi: args.koulutustyyppi,
          sivu: args.sivu ?? 0,
          sivukoko: args.sivukoko ?? 10,
          voimassaolo: args.voimassaolo,
          poistunut: args.poistunut,
          tuleva: args.tuleva,
        })}`
      );
    case "hae_peruste":
      return apiGet(`/peruste/${args.id}`);
    case "hae_peruste_sisallysluettelo":
      return apiGet(`/peruste/${args.id}/kaikki`);
    case "hae_koulutusalat":
      return apiGet(`/perusteet/koulutusalat`);
    case "hae_tutkinnonosat":
      return apiGet(`/peruste/${args.perusteId}/tutkinnonosat`);
    case "hae_tutkinnonosa":
      return apiGet(`/peruste/${args.perusteId}/tutkinnonosa/${args.tutkinnonosanId}`);
    case "hae_oppiaineet":
      return apiGet(`/peruste/${args.perusteId}/oppiaineet`);
    case "hae_oppiaine":
      return apiGet(`/peruste/${args.perusteId}/oppiaine/${args.oppiaineId}`);
    case "hae_uusimmat":
      return apiGet(`/perusteet/uusimmat${qs({ sivukoko: args.sivukoko ?? 10 })}`);
    default:
      throw new Error(`Tuntematon työkalu: ${name}`);
  }
}

// ─── MCP request handler ──────────────────────────────────────────────────────

// In-memory session store (stateless is fine for read-only tools, but we track
// session IDs so clients that send Mcp-Session-Id get consistent responses)
const sessions = new Set();

function mcpResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function mcpError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMcpMessage(msg) {
  const { id, method, params } = msg;

  if (method === "initialize") {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessions.add(sessionId);
    return {
      response: mcpResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "eperusteet-mcp", version: "1.0.0" },
      }),
      sessionId,
    };
  }

  if (method === "notifications/initialized") return { response: null };

  if (method === "ping") {
    return { response: mcpResponse(id, {}) };
  }

  if (method === "tools/list") {
    return { response: mcpResponse(id, { tools: TOOLS }) };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      const data = await callTool(name, args || {});
      return {
        response: mcpResponse(id, {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }),
      };
    } catch (e) {
      return {
        response: mcpResponse(id, {
          content: [{ type: "text", text: `Virhe: ${e.message}` }],
          isError: true,
        }),
      };
    }
  }

  return { response: mcpError(id, -32601, `Method not found: ${method}`) };
}

// ─── HTTP server ──────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS — needed so browser-based MCP clients can connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        name: "eperusteet-mcp",
        version: "1.0.0",
        description: "MCP server for ePerusteet (Opetushallitus)",
        mcp_endpoint: "/mcp",
        tools: TOOLS.map((t) => t.name),
      })
    );
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // MCP endpoint — Streamable HTTP transport
  if (req.url === "/mcp") {
    if (req.method === "POST") {
      // Read body
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        let messages;
        try {
          const parsed = JSON.parse(body);
          // Support both single message and batch
          messages = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        const clientAcceptsSse =
          (req.headers["accept"] || "").includes("text/event-stream");

        if (clientAcceptsSse) {
          // SSE streaming response (for clients that request it)
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          });

          for (const msg of messages) {
            const { response, sessionId } = await handleMcpMessage(msg);
            if (sessionId) res.setHeader("Mcp-Session-Id", sessionId);
            if (response) {
              res.write(`data: ${JSON.stringify(response)}\n\n`);
            }
          }
          res.end();
        } else {
          // Standard JSON response
          const results = [];
          let newSessionId = null;

          for (const msg of messages) {
            const { response, sessionId } = await handleMcpMessage(msg);
            if (sessionId) newSessionId = sessionId;
            if (response) results.push(response);
          }

          if (newSessionId) res.setHeader("Mcp-Session-Id", newSessionId);
          res.writeHead(200, { "Content-Type": "application/json" });
          // Single message → single object; batch → array
          res.end(JSON.stringify(results.length === 1 ? results[0] : results));
        }
      });
      return;
    }

    // DELETE = session termination (graceful, just acknowledge)
    if (req.method === "DELETE") {
      const sid = req.headers["mcp-session-id"];
      if (sid) sessions.delete(sid);
      res.writeHead(200);
      res.end();
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`ePerusteet MCP server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
