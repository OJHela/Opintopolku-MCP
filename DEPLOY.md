# ePerusteet MCP Server — HTTP

Täsmälleen sama konsepti kuin Finlex MCP: deployaa nettiin ja lisää Claude.ai:hin yhdellä URL:lla.

---

## Deploy Railwaylle (suositeltu, ilmainen taso riittää)

### 1. Luo GitHub-repo

Kopioi nämä tiedostot uuteen GitHub-repoon:
- `server-http.js`
- `package.json`
- `Dockerfile`
- `railway.toml`

### 2. Railway-projekti

1. Mene osoitteeseen [railway.app](https://railway.app) ja kirjaudu sisään
2. Klikkaa **New Project → Deploy from GitHub repo**
3. Valitse äsken luomasi repo
4. Railway tunnistaa Dockerfilen automaattisesti
5. Klikkaa **Deploy**

### 3. Hae URL

Kun deploy on valmis:
- Avaa projekti Railwayssa
- Mene **Settings → Networking → Generate Domain**
- Saat URL:n muotoa: `https://eperusteet-mcp-production.up.railway.app`

### 4. Lisää Claude.ai:hin

1. Avaa [claude.ai](https://claude.ai) → **Settings → Integrations**
2. Klikkaa **Add integration**
3. Syötä URL: `https://sinun-urli.up.railway.app/mcp`
4. Valmis ✓

---

## Vaihtoehto: Render.com

1. Luo uusi **Web Service** GitHubista
2. Valitse **Docker** ympäristö
3. Klikkaa **Create Web Service**
4. Saat URL:n automaattisesti

---

## Testaa paikallisesti

```bash
node server-http.js
# → Käynnistyy portissa 3000

# Toisessa terminaalissa:
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

---

## Työkalut

| Työkalu | Kuvaus |
|---------|--------|
| `hae_perusteet` | Hae perusteita nimellä / koulutustyypillä |
| `hae_peruste` | Yksittäinen peruste ID:llä |
| `hae_peruste_sisallysluettelo` | Rakenteen sisällysluettelo |
| `hae_koulutusalat` | Kaikki koulutusalat koodeilla |
| `hae_tutkinnonosat` | Ammatillisen tutkinnon osat |
| `hae_tutkinnonosa` | Yksittäinen tutkinnon osa |
| `hae_oppiaineet` | Perusopetuksen/lukion oppiaineet |
| `hae_oppiaine` | Yksittäinen oppiaine |
| `hae_uusimmat` | Viimeksi muutetut perusteet |
