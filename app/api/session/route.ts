import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SPEKO_API_BASE = process.env.SPEKO_API_BASE ?? 'https://api.speko.dev';

/**
 * The agent's brain runs on Speko's platform (STT -> LLM -> TTS pipeline).
 * This prompt is the only "agent code" in the template - edit it, or create
 * a saved agent at https://platform.speko.dev/agents and set SPEKO_AGENT_ID
 * to use that instead.
 */
const SYSTEM_PROMPT = `You are a friendly, concise voice assistant.
You are talking to someone over live audio, so keep replies short and
conversational - one or two sentences unless they ask for detail.
If you do not know something, say so plainly.`;

/**
 * Mints a short-lived Speko voice session and returns browser-safe transport
 * credentials. SPEKO_API_KEY stays on the server - the browser only ever sees
 * a token scoped to this one conversation, which expires with the session.
 *
 * NOTE: this route is unauthenticated by design (it is a starter). Anyone who
 * can reach your deployment can start a call billed to your Speko account.
 * Add your own auth / rate limiting before shipping to production.
 */
export async function POST(): Promise<NextResponse> {
  const apiKey = process.env.SPEKO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'SPEKO_API_KEY is not set. Copy .env.example to .env.local and add your key from https://platform.speko.dev/api-keys',
      },
      { status: 503 },
    );
  }

  const agentId = process.env.SPEKO_AGENT_ID;

  // With SPEKO_AGENT_ID set, the saved agent's prompt, voice, and routing
  // config drive the call. Otherwise the inline defaults below apply.
  const sessionBody = agentId
    ? {
        mode: 'cascade',
        agentId,
        ttlSeconds: 900,
        metadata: { app: 'voice-agent-starter' },
      }
    : {
        mode: 'cascade',
        intent: { language: 'en-US', optimizeFor: 'latency' },
        systemPrompt: SYSTEM_PROMPT,
        ttlSeconds: 900,
        metadata: { app: 'voice-agent-starter' },
      };

  const upstream = await fetch(`${SPEKO_API_BASE}/v1/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionBody),
  });

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 500);
    return NextResponse.json(
      { error: `Speko API error (${upstream.status}): ${detail}` },
      { status: upstream.status >= 500 ? 502 : upstream.status },
    );
  }

  const session = (await upstream.json()) as {
    sessionId: string;
    transportToken: string;
    transportUrl: string;
    expiresAt: string;
  };

  // Return only what the browser needs - never the API key.
  return NextResponse.json({
    sessionId: session.sessionId,
    transportToken: session.transportToken,
    transportUrl: session.transportUrl,
    expiresAt: session.expiresAt,
  });
}
