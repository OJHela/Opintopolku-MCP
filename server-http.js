#!/usr/bin/env node
/**
 * ePerusteet MCP Server — Yhdistetty versio v2
 * Valtakunnalliset perusteet + kuntakohtaiset OPS:t
 * 17 työkalua, ei vaadi autentikointia.
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const BASE_P = "https://eperusteet.opintopolku.fi/eperusteet-service/api/external";
const BASE_Y = "https://eperusteet.opintopolku.fi/eperusteet-ylops-service/api";

function apiGet(base, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + path);
    const req = https.request(
      { hostname: url.hostname, path: url.pathname + url.search, method: "GET",
        headers: { Accept: "application/json", "User-Agent": "eperusteet-mcp/2.0" } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({ raw: data.slice(0, 3000) }); } });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

const P = (path) => apiGet(BASE_P, path);
const Y = (path) => apiGet(BASE_Y, path);

function qs(params) {
  const p = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return p ? "?" + p : "";
}

const TOOLS = [
  {
    name: "hae_perusteet",
    description: "Hae valtakunnallisia perusteita ja tutkintoja nimellä tai koulutustyypillä. Koulutustyypit: koulutustyyppi_2 (perusopetus), koulutustyyppi_5 (lukio), koulutustyyppi_11 (ammatillinen).",
    inputSchema: { type: "object", properties: {
      nimi: { type: "string" }, koulutustyyppi: { type: "string" },
      sivu: { type: "number" }, sivukoko: { type: "number" },
      voimassaolo: { type: "boolean" }, poistunut: { type: "boolean" }, tuleva: { type: "boolean" }
    }},
  },
  {
    name: "hae_peruste",
    description: "Hae yksittäisen valtakunnallisen perusteen tiedot ID:llä.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_peruste_sisallysluettelo",
    description: "Hae valtakunnallisen perusteen rakenne ja sisällysluettelo.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_koulutusalat",
    description: "Hae kaikki koulutusalat koodeineen.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "hae_tutkinnonosat",
    description: "Hae ammatillisen tutkinnon osat.",
    inputSchema: { type: "object", properties: { perusteId: { type: "number" } }, required: ["perusteId"] },
  },
  {
    name: "hae_tutkinnonosa",
    description: "Hae yksittäinen tutkinnon osa.",
    inputSchema: { type: "object", properties: { perusteId: { type: "number" }, tutkinnonosanId: { type: "number" } }, required: ["perusteId", "tutkinnonosanId"] },
  },
  {
    name: "hae_oppiaineet",
    description: "Hae perusopetuksen tai lukion valtakunnallisen perusteen oppiaineet.",
    inputSchema: { type: "object", properties: { perusteId: { type: "number" } }, required: ["perusteId"] },
  },
  {
    name: "hae_oppiaine",
    description: "Hae yksittäinen oppiaine valtakunnallisesta perusteesta.",
    inputSchema: { type: "object", properties: { perusteId: { type: "number" }, oppiaineId: { type: "number" } }, required: ["perusteId", "oppiaineId"] },
  },
  {
    name: "hae_uusimmat_perusteet",
    description: "Hae viimeksi muutetut valtakunnalliset perusteet.",
    inputSchema: { type: "object", properties: { sivukoko: { type: "number" } } },
  },
  {
    name: "hae_opetussuunnitelmat",
    description: "Hae kuntien julkaistuja paikallisia opetussuunnitelmia (OPS). Hae kunnan nimellä esim. 'Helsinki', 'Tampere', 'Espoo'. Palauttaa ID:t joita voi käyttää muissa OPS-työkaluissa.",
    inputSchema: { type: "object", properties: {
      nimi: { type: "string", description: "Kunnan nimi" },
      koulutustyyppi: { type: "string", description: "'perusopetus', 'lukio', 'esiopetus'" },
      sivu: { type: "number" }, sivukoko: { type: "number" }
    }},
  },
  {
    name: "hae_opetussuunnitelma",
    description: "Hae kuntakohtaisen OPS:n perustiedot ID:llä.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_ops_dokumentti",
    description: "Hae kunnan OPS-dokumentti tekstinä — sisältää tuntijaot ja kaiken paikallisesti päätetyn. Helsinki perusopetus dokumenttiId=34654760.",
    inputSchema: { type: "object", properties: { dokumenttiId: { type: "number", description: "Dokumentin ID. Helsinki=34654760" } }, required: ["dokumenttiId"] },
  },
  {
    name: "hae_ops_tuntijako",
    description: "Hae kunnan OPS:n tuntijako — viikkotuntimäärät vuosiluokittain.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_ops_oppiaineet",
    description: "Hae kunnan paikallisen OPS:n oppiaineet.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_ops_luvut",
    description: "Hae kunnan OPS:n rakenne ja luvut.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "hae_ops_tiedot",
    description: "Hae kunnan OPS:n täydelliset tiedot.",
    inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
  },
  {
    name: "vertaile_tuntijakoja",
    description: "Vertaile kahden kunnan tuntijakoja rinnakkain dokumentti-ID:iden avulla.",
    inputSchema: { type: "object", properties: {
      dokumenttiId1: { type: "number" }, dokumenttiId2: { type: "number" },
      kunta1: { type: "string" }, kunta2: { type: "string" }
    }, required: ["dokumenttiId1", "dokumenttiId2"] },
  },
];

async function callTool(name, args) {
  switch (name) {
    case "hae_perusteet":
      return P(`/perusteet${qs({ nimi: args.nimi, koulutustyyppi: args.koulutustyyppi, sivu: args.sivu ?? 0, sivukoko: args.sivukoko ?? 10, voimassaolo: args.voimassaolo, poistunut: args.poistunut, tuleva: args.tuleva })}`);
    case "hae_peruste":
      return P(`/peruste/${args.id}`);
    case "hae_peruste_sisallysluettelo":
      return P(`/peruste/${args.id}/kaikki`);
    case "hae_koulutusalat":
      return P(`/perusteet/koulutusalat`);
    case "hae_tutkinnonosat":
      return P(`/peruste/${args.perusteId}/tutkinnonosat`);
    case "hae_tutkinnonosa":
      return P(`/peruste/${args.perusteId}/tutkinnonosa/${args.tutkinnonosanId}`);
    case "hae_oppiaineet":
      return P(`/peruste/${args.perusteId}/oppiaineet`);
    case "hae_oppiaine":
      return P(`/peruste/${args.perusteId}/oppiaine/${args.oppiaineId}`);
    case "hae_uusimmat_perusteet":
      return P(`/perusteet/uusimmat${qs({ sivukoko: args.sivukoko ?? 10 })}`);
    case "hae_opetussuunnitelmat":
      return Y(`/opetussuunnitelmat/julkiset${qs({ perusteenNimi: args.nimi, koulutustyyppi: args.koulutustyyppi, sivu: args.sivu ?? 0, sivukoko: args.sivukoko ?? 10, julkaistu: true })}`);
    case "hae_opetussuunnitelma":
      return Y(`/opetussuunnitelmat/${args.id}`);
    case "hae_ops_dokumentti":
      return Y(`/dokumentit/${args.dokumenttiId}`);
    case "hae_ops_tuntijako":
      return Y(`/opetussuunnitelmat/${args.id}/tuntijako`);
    case "hae_ops_oppiaineet":
      return Y(`/opetussuunnitelmat/${args.id}/oppiaineet`);
    case "hae_ops_luvut":
      return Y(`/opetussuunnitelmat/${args.id}/lops`);
    case "hae_ops_tiedot":
      return Y(`/opetussuunnitelmat/${args.id}/kaikki`);
    case "vertaile_tuntijakoja": {
      const [d1, d2] = await Promise.all([
        Y(`/dokumentit/${args.dokumenttiId1}`),
        Y(`/dokumentit/${args.dokumenttiId2}`),
      ]);
      return { kunta1: args.kunta1 || `Dokumentti ${args.dokumenttiId1}`, kunta2: args.kunta2 || `Dokumentti ${args.dokumenttiId2}`, dokumentti1: d1, dokumentti2: d2 };
    }
    default:
      throw new Error(`Tuntematon työkalu: ${name}`);
  }
}

async function handleMcpMessage(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return { response: { jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "eperusteet-mcp", version: "2.0.0" } } }, sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}` };
  }
  if (method === "notifications/initialized") return { response: null };
  if (method === "ping") return { response: { jsonrpc: "2.0", id, result: {} } };
  if (method === "tools/list") return { response: { jsonrpc: "2.0", id, result: { tools: TOOLS } } };
  if (method === "tools/call") {
    const { name, arguments: toolArgs } = params;
    try {
      const data = await callTool(name, toolArgs || {});
      return { response: { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } } };
    } catch (e) {
      return { response: { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Virhe: ${e.message}` }], isError: true } } };
    }
  }
  return { response: { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } } };
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id, Accept");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ name: "eperusteet-mcp", version: "2.0.0", mcp_endpoint: "/mcp", tools: TOOLS.map(t => t.name) }));
    return;
  }
  if (req.method === "GET" && req.url === "/health") { res.writeHead(200); res.end("OK"); return; }
  if (req.url === "/mcp") {
    if (req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        let messages;
        try { const p = JSON.parse(body); messages = Array.isArray(p) ? p : [p]; }
        catch { res.writeHead(400); res.end(JSON.stringify({ error: "Invalid JSON" })); return; }
        const isSse = (req.headers["accept"] || "").includes("text/event-stream");
        if (isSse) {
          const results = []; let sid = null;
          for (const msg of messages) { const { response, sessionId } = await handleMcpMessage(msg); if (sessionId) sid = sessionId; if (response) results.push(response); }
          const h = { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" };
          if (sid) h["Mcp-Session-Id"] = sid;
          res.writeHead(200, h);
          for (const r of results) res.write(`data: ${JSON.stringify(r)}\n\n`);
          res.end();
        } else {
          const results = []; let sid = null;
          for (const msg of messages) { const { response, sessionId } = await handleMcpMessage(msg); if (sessionId) sid = sessionId; if (response) results.push(response); }
          if (sid) res.setHeader("Mcp-Session-Id", sid);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(results.length === 1 ? results[0] : results));
        }
      });
      return;
    }
    if (req.method === "DELETE") { res.writeHead(200); res.end(); return; }
  }
  res.writeHead(404); res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`ePerusteet MCP v2.0 running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Tools: ${TOOLS.length}`);
});
