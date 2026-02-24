# Travis Soul Plugin

OpenClaw extension that injects Travis's identity, memory, and T.I.L.U. governance into every interaction.

## What This Does

- **Soul Injection**: Every Claude call gets the full Travis system prompt — identity, T.I.L.U. principles, operational context, active state
- **Memory Loading**: Fetches `TRAVIS_CONTEXT.md` and `TRAVIS_ACTIVE.md` from `tnumber2/travis-core` at gateway startup, refreshes every 30 min
- **T.I.L.U. Membrane**: All outgoing messages pass through Truth/Integrity/Love/Unity filter
- **Memory Write-back**: Significant interactions are logged to `TRAVIS_ACTIVE.md` and Supabase
- **Custom Commands**: `/brief`, `/ventures`, `/brad`, `/deskmate`, `/phimc`, `/tilu`, `/reload`

## Required Environment Variables

```
GITHUB_TOKEN=       # For reading/writing travis-core memory
SUPABASE_URL=       # For ops logging
SUPABASE_ANON_KEY=  # For ops logging
```

## Architecture

```
extensions/travis-soul/
├── index.ts              # Plugin entry — registers all hooks
└── src/
    ├── soul-loader.ts    # GitHub memory fetcher/writer
    ├── soul-prompt.ts    # Builds Travis system prompt
    ├── tilu-membrane.ts  # T.I.L.U. output filter
    ├── memory-writer.ts  # Supabase + GitHub write-back
    └── commands.ts       # /brief /ventures /reload etc.
```

## Hook Map

| Hook                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `gateway_start`       | Load soul from GitHub on boot             |
| `before_prompt_build` | Inject Travis soul into every Claude call |
| `message_sending`     | T.I.L.U. membrane check                   |
| `llm_output`          | Log to Supabase + write-back to memory    |

## Personas

- **TRAVIS-296** (default): Blunt, direct, no fluff — for interactions with 296
- **DESKMATE-AGENT**: Professional, warm — for DeskMate customer interactions
- **TRAVIS-EXEC**: Composed, data-driven — for stakeholder/investor briefings

## T.I.L.U.

Truth → Integrity → Love → Unity

Every output passes through all four in order. If any filter fails, regenerate.
