import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Speko Voice Agent Starter',
  description:
    'Talk to an AI voice agent in the browser. Next.js + @spekoai/client, one API key, no audio plumbing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
