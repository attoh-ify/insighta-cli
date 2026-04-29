# Insighta Labs+ — CLI

Command-line interface for the Insighta Labs+ profile intelligence platform. Authenticates via GitHub OAuth with PKCE and interacts with the backend API.

---

## Installation

```bash
npm install
npm run build
npm link
```

After linking, `insighta` is available globally from any directory.

---

## Configuration

Create a `.env` file in the project root:

```env
INSIGHTA_API_URL=http://localhost:8080
```

For production, point to your deployed backend:

```env
INSIGHTA_API_URL=https://api.yourdomain.com
```

---

## Authentication Flow

```
insighta login
      │
      ├── Generates: state, code_verifier, code_challenge (PKCE)
      ├── Starts local HTTP server on port 8976
      ├── Opens browser → backend /auth/github?client=cli&...
      │
      │   [User logs in with GitHub]
      │
      ├── GitHub redirects → http://localhost:8976/callback?code=...
      ├── CLI validates state, POSTs code + code_verifier to backend
      ├── Backend returns access_token + refresh_token
      └── CLI stores tokens at ~/.insighta/credentials.json
```

Tokens are auto-refreshed on every request. If the refresh token is also expired, you are prompted to run `insighta login` again.

---

## Commands

### Auth

```bash
insighta login          # Authenticate via GitHub OAuth
insighta logout         # Invalidate session and clear local tokens
insighta whoami         # Show current user info
```

### Profiles

```bash
# List profiles
insighta profiles list
insighta profiles list --gender male
insighta profiles list --country NG --age-group adult
insighta profiles list --min-age 25 --max-age 40
insighta profiles list --sort-by age --order desc
insighta profiles list --page 2 --limit 20

# Get a single profile
insighta profiles get <id>

# Natural language search
insighta profiles search "young males from Nigeria"

# Create a profile (admin only)
insighta profiles create --name "Harriet Tubman"

# Export as CSV (saved to current working directory)
insighta profiles export --format csv
insighta profiles export --format csv --gender male --country NG
```

---

## Token Handling

| Token | Storage | Expiry |
|---|---|---|
| Access token | `~/.insighta/credentials.json` | 3 minutes |
| Refresh token | `~/.insighta/credentials.json` | 5 minutes |

On every API request:
1. Access token is sent as `Authorization: Bearer <token>`
2. On `401`, the refresh token is used to get a new pair automatically
3. If refresh also fails, credentials are cleared and the user is prompted to re-login

---

## Role Enforcement

| Command | Required Role |
|---|---|
| `profiles list` | admin, analyst |
| `profiles get` | admin, analyst |
| `profiles search` | admin, analyst |
| `profiles export` | admin, analyst |
| `profiles create` | admin only |

---

## Development

```bash
npm run dev        # Run with ts-node
npm run build      # Compile TypeScript → dist/
npm run lint       # Type-check with tsc --noEmit
```