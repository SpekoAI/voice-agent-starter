'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ConversationMessage,
  VoiceConversation,
} from '@spekoai/client';

type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';

export function VoiceAgent() {
  const [state, setState] = useState<CallState>('idle');
  const [messages, setMessages] = useState<readonly ConversationMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const conversationRef = useRef<VoiceConversation | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  const isLive = state === 'listening' || state === 'speaking';

  // End the session if the component unmounts mid-call.
  useEffect(() => {
    return () => {
      void conversationRef.current?.endSession().catch(() => undefined);
      conversationRef.current = null;
    };
  }, []);

  // Keep the transcript scrolled to the newest line.
  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function startCall() {
    setState('connecting');
    setError(null);
    setMessages([]);
    setMuted(false);
    setAudioBlocked(false);

    try {
      // 1. Ask our server for short-lived session credentials. The Speko API
      //    key stays server-side; the browser only gets a one-call token.
      const res = await fetch('/api/session', { method: 'POST' });
      const data = (await res.json()) as {
        transportToken?: string;
        transportUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.transportToken || !data.transportUrl) {
        throw new Error(data.error ?? `Session request failed (${res.status})`);
      }

      // 2. Join the session over WebRTC. Imported dynamically so the module
      //    (which touches browser-only APIs) never loads during SSR.
      const { VoiceConversation } = await import('@spekoai/client');
      const conversation = await VoiceConversation.create({
        transportToken: data.transportToken,
        transportUrl: data.transportUrl,
        onModeChange: (mode) => {
          setState(mode === 'speaking' ? 'speaking' : 'listening');
        },
        onDisconnect: () => {
          conversationRef.current = null;
          setState('ended');
        },
        // The SDK delivers the full reconciled transcript on every update -
        // deduped, ordered, interim lines included. Just render it.
        onTranscript: (transcript) => {
          setMessages(transcript);
        },
        onError: (err) => {
          setError(err.message);
          setState('error');
        },
        // Browser autoplay policy can silently block the agent's audio.
        // Surface a tap-to-unmute affordance instead of a dead call.
        onAudioPlaybackBlocked: () => {
          setAudioBlocked(true);
        },
      });

      conversationRef.current = conversation;
      setState('listening');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }

  async function endCall() {
    const conversation = conversationRef.current;
    conversationRef.current = null;
    try {
      await conversation?.endSession();
    } catch {
      // Already disconnected - nothing to clean up.
    }
    setState('ended');
  }

  async function toggleMute() {
    const conversation = conversationRef.current;
    if (!conversation) return;
    const next = !muted;
    await conversation.setMicMuted(next);
    setMuted(next);
  }

  async function unblockAudio() {
    await conversationRef.current?.startAudioPlayback();
    setAudioBlocked(false);
  }

  return (
    <div className="mt-12 flex flex-col items-center gap-8">
      <Orb state={state} />

      <div className="text-center">
        <div className="text-lg font-medium">{stateHeadline(state)}</div>
        <div className="mt-1 text-sm text-zinc-500">{stateHint(state, muted)}</div>
      </div>

      {audioBlocked && (
        <button
          type="button"
          onClick={() => void unblockAudio()}
          className="rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2 text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
        >
          Tap to enable audio
        </button>
      )}

      {error && (
        <div className="max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isLive && state !== 'connecting' && (
          <button
            type="button"
            onClick={() => void startCall()}
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            {state === 'idle' ? 'Start call' : 'Start a new call'}
          </button>
        )}
        {state === 'connecting' && (
          <button
            type="button"
            disabled
            className="cursor-wait rounded-full bg-zinc-800 px-8 py-3 text-sm font-semibold text-zinc-400"
          >
            Connecting...
          </button>
        )}
        {isLive && (
          <>
            <button
              type="button"
              onClick={() => void toggleMute()}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500"
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              type="button"
              onClick={() => void endCall()}
              className="rounded-full bg-red-500/90 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              End call
            </button>
          </>
        )}
      </div>

      {messages.length > 0 && (
        <div className="w-full max-w-lg">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Transcript
          </div>
          <div
            ref={transcriptRef}
            className="max-h-72 space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
          >
            {messages.map((message, i) => (
              <div
                key={message.segmentId ?? `line-${i}`}
                className={message.isFinal ? '' : 'opacity-60'}
              >
                <span
                  className={
                    message.source === 'agent'
                      ? 'font-semibold text-sky-400'
                      : 'font-semibold text-zinc-400'
                  }
                >
                  {message.source === 'agent' ? 'Agent' : 'You'}
                </span>
                <span className="ml-2 text-sm leading-relaxed text-zinc-200">
                  {message.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Orb({ state }: { state: CallState }) {
  const core =
    state === 'speaking'
      ? 'bg-sky-400'
      : state === 'listening'
        ? 'bg-emerald-400'
        : state === 'connecting'
          ? 'bg-zinc-500'
          : state === 'error'
            ? 'bg-red-500'
            : 'bg-zinc-700';

  const active = state === 'speaking' || state === 'listening';

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {active && (
        <>
          <span className={`orb-ring absolute inset-0 rounded-full ${core}`} />
          <span className={`orb-ring-delayed absolute inset-0 rounded-full ${core}`} />
        </>
      )}
      <span
        className={`relative h-20 w-20 rounded-full ${core} transition-colors duration-300`}
      />
    </div>
  );
}

function stateHeadline(state: CallState): string {
  switch (state) {
    case 'idle':
      return 'Ready when you are';
    case 'connecting':
      return 'Connecting';
    case 'listening':
      return 'Listening';
    case 'speaking':
      return 'Agent is speaking';
    case 'ended':
      return 'Call ended';
    case 'error':
      return 'Something went wrong';
  }
}

function stateHint(state: CallState, muted: boolean): string {
  switch (state) {
    case 'idle':
      return 'Starts a live voice session in your browser.';
    case 'connecting':
      return 'Minting a session and joining over WebRTC.';
    case 'listening':
      return muted
        ? 'Microphone is muted.'
        : 'Talk normally - you can interrupt the agent at any time.';
    case 'speaking':
      return 'The mic stays open - interrupt whenever you want.';
    case 'ended':
      return 'Start another call whenever you like.';
    case 'error':
      return 'Check the message above, then try again.';
  }
}
