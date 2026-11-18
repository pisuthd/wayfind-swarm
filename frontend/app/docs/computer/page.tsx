import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, DocTable, H2, P } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Cloud computer — Wayfind Docs',
  description: 'Your Wayfind cloud computer: Debian MicroVM, lifecycle, workspace sync, preview, terminal, and built-in tooling.',
};

export default function DocsComputerPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Cloud computer</h1>
      <P>
        Every account gets one isolated cloud computer, shared by all its bots. It&apos;s where the
        work happens: files, tools, skills, and memory live there — not on your laptop.
      </P>

      <H2 id="what-it-is">What it is</H2>
      <P>
        A small virtual machine (a Firecracker MicroVM on AWS) running Debian 12, with VM-level
        isolation and near-instant launch and resume. It ships with Node, Bun, a Chromium browser,
        and browser-automation tooling preinstalled, plus a seed of engineering skills. Your
        computer keeps its state while it sleeps, so a bot can pick up exactly where it left off.
      </P>

      <H2 id="lifecycle">Lifecycle</H2>
      <P>The computer manages itself:</P>
      <DocTable
        head={['State', 'What it means']}
        rows={[
          ['Booting', 'Starting up or resuming — chat may take a few seconds to respond.'],
          ['Ready', 'Working. Bots run tools, read files, and stream results.'],
          ['Suspended', 'Asleep after idling. Wakes automatically on your next message.'],
          ['Recycling', 'Restarted fresh roughly every 8 hours. Your workspace and memory carry over.'],
        ]}
      />
      <P>
        If chat ever shows a computer error instead of recovering, starting a new message or
        reopening the app re-provisions automatically — nothing you saved is lost.
      </P>

      <H2 id="workspace">Workspace and files</H2>
      <P>
        Each bot works in the shared workspace, synced to private storage so it survives restarts.
        Anything a bot saves — code, drafts, generated images — lands here and comes back after a
        reboot.
      </P>

      <H2 id="preview">Preview and terminal</H2>
      <P>
        Bots serving web apps expose them on ports: open <strong>Computer → Preview</strong> and
        enter the port (frontend dev servers use 5173). The <strong>terminal</strong> tab gives you
        a shell on the same machine for a look around.
      </P>
      <Callout kind="tip">
        QA uses the built-in browser to click through your app and confirm it works — the same
        preview you see, verified end to end. See{' '}
        <Link href="/docs/bots" className="font-bold text-cta hover:underline">Bots</Link>.
      </Callout>
    </article>
  );
}
