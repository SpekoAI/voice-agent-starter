# Agent instructions

This is a Next.js (App Router, TypeScript) voice-agent starter. The browser talks to an AI voice
agent over WebRTC; speech-to-text, the language model, and text-to-speech all run on
[Speko](https://speko.ai). There is no model code or audio plumbing in this repo.

## Run it

1. The app needs exactly one secret: `SPEKO_API_KEY` (starts with `sk_live_`). If it is not set,
   ask the user to create one at <https://platform.speko.ai/agents/keys> and put it in
   `.env.local` (`cp .env.example .env.local`). Do not paste keys into code, logs, or commits.
2. `pnpm install && pnpm dev` → <http://localhost:3000>, click **Start call**. On a remote VM,
   run `pnpm dev -- -H 0.0.0.0` and open the forwarded/proxied URL for port 3000.

## Where things are

- `app/api/session/route.ts` — server route; mints a short-lived session via
  `POST https://api.speko.dev/v1/sessions` with the API key. The key must stay server-side.
- `components/VoiceAgent.tsx` — client widget (`@spekoai/client`, WebRTC).
- `app/page.tsx` — the page; layout is swappable, the widget is self-contained.

## Customizing

Change the agent's behaviour in `app/api/session/route.ts` (`SYSTEM_PROMPT`, `intent`, `voice`,
`firstMessage`), or set `SPEKO_AGENT_ID` to use an agent saved at
<https://platform.speko.ai/agents>. API reference: <https://docs.speko.dev>.

## Guardrails

- Never expose `SPEKO_API_KEY` to the client bundle; only `app/api/*` may read it.
- `/api/session` is unauthenticated by design in this starter — add auth or rate limiting before
  telling a user a public deployment is production-ready.
- Keep `pnpm-lock.yaml` in sync (`pnpm install`, not `npm`/`yarn`, when adding dependencies).
