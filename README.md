# ePerusteet MCP Server

MCP (Model Context Protocol) server for the Finnish **ePerusteet** service — the national repository of educational curricula and qualifications maintained by Opetushallitus.

Uses the **public external API** at `https://eperusteet.opintopolku.fi/eperusteet-service/api/external` — **no authentication required**.

## Requirements

- Node.js 18 or newer
- No npm packages needed — uses only Node.js built-ins

## Setup

### 1. Make the server executable

```bash
chmod +x server.js
```

### 2. Configure Claude Desktop (or any MCP client)

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "eperusteet": {
      "command": "node",
      "args": ["/absolute/path/to/eperusteet-mcp/server.js"]
    }
  }
}
```

Replace `/absolute/path/to/eperusteet-mcp/` with the actual path.

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

### 3. Restart Claude Desktop

---

## Available Tools

| Tool | Description |
|------|-------------|
| `hae_perusteet` | Search curricula/qualifications by name, type, status |
| `hae_peruste` | Get a single curriculum/qualification by ID |
| `hae_peruste_sisallysluettelo` | Get a curriculum's full table of contents |
| `hae_koulutusalat` | List all education sectors with codes |
| `hae_tutkinnonosat` | List all qualification units for a vocational qualification |
| `hae_tutkinnonosa` | Get a single qualification unit by ID |
| `hae_oppiaineet` | List all subjects in a basic/upper-secondary curriculum |
| `hae_oppiaine` | Get a single subject by ID |
| `hae_muutos` | Get recently modified curricula |

## Koulutustyyppi codes

| Code | Type |
|------|------|
| `koulutustyyppi_0` | Esiopetus (Pre-primary) |
| `koulutustyyppi_2` | Perusopetus (Basic education) |
| `koulutustyyppi_5` | Lukio (Upper secondary) |
| `koulutustyyppi_11` | Ammatillinen perustutkinto (Vocational) |
| `koulutustyyppi_12` | Ammatillinen lisäkoulutus (Further vocational) |
| `koulutustyyppi_13` | Erikoisammattitutkinto (Specialist vocational) |
| `koulutustyyppi_14` | Ammattitutkinto (Further vocational qualification) |
| `koulutustyyppi_18` | Vapaa sivistystyö |

## Example prompts

Once connected to Claude:

- *"Hae lähihoitajan peruste ePerusteista"*
- *"Etsi kaikki lukion perusteet"*
- *"Näytä perusteen 1013059 rakenne"*
- *"Mitkä ovat perusopetuksen matematiikan tutkinnon osat?"*
