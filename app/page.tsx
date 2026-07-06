import { VoiceAgent } from '@/components/VoiceAgent';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide text-zinc-400">
          Voice Agent Starter
        </div>
        <a
          href="https://docs.speko.dev"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          Docs
        </a>
      </header>

      <section className="mt-14 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Talk to your AI agent
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Click start, allow the microphone, and speak. Speech recognition, the
          language model, and the voice all run on{' '}
          <a
            href="https://speko.ai"
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 hover:underline"
          >
            Speko
          </a>
          . This app is just the widget and one server route.
        </p>
      </section>

      <VoiceAgent />

      <footer className="mt-auto pt-12 text-center text-xs text-zinc-600">
        Built with{' '}
        <a
          href="https://www.npmjs.com/package/@spekoai/client"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-500 hover:text-zinc-300"
        >
          @spekoai/client
        </a>{' '}
        - get an API key at{' '}
        <a
          href="https://platform.speko.dev"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-500 hover:text-zinc-300"
        >
          platform.speko.dev
        </a>
      </footer>
    </main>
  );
}
