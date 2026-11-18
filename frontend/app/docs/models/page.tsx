import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, DocTable, H2, P } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Models — Wayfind Docs',
  description: 'The AI models behind Wayfind SWARM: chat routing, images, voice, and grounded search.',
};

export default function DocsModelsPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Models</h1>
      <P>
        Wayfind routes each job to the right model and the spend lands in your usage. You can pick
        the chat model per bot in its settings; images, voice, and search are handled
        automatically. From-prices below are per input tokens.
      </P>

      <DocTable
        head={['Job', 'Model', 'From']}
        rows={[
          ['Chat (default)', 'GLM 5.3 Flash', '$0.45'],
          ['Chat (alternative)', 'DeepSeek V4.1 Flash', '$0.30'],
          ['Chat (curated)', 'Claude Haiku 5.5 / GPT-6 Luna', '$0.15'],
          ['Images', 'Muse Image', 'flat per image'],
          ['Voice', 'Muse Voice Transcribe', '—'],
          ['Fresh facts', 'Web search + cited sources', '—'],
        ]}
      />

      <H2 id="chat">Chat</H2>
      <P>
        GLM 5.3 Flash serves every conversation out of the box; DeepSeek V4.1 Flash is selectable
        per bot, and the curated Claude/GPT options trade through a different provider. You
        describe the outcome — the routing is Wayfind&apos;s job. See{' '}
        <Link href="/docs/billing" className="font-bold text-cta hover:underline">Billing</Link> for
        how chat spend works.
      </P>

      <H2 id="images">Image generation</H2>
      <P>
        Ask any bot to generate or edit an image — “a hero banner for the spring sale” or, of an
        existing image, “make it night”. Muse Image renders it, the picture lands inline in chat
        and in the workspace <span className="font-mono text-sm">generated/</span> folder. Billed
        only on success.
      </P>

      <H2 id="voice">Voice</H2>
      <P>
        Tap the mic button in chat and speak the job instead of typing it. Muse Voice transcribes
        the recording and the bot carries on as if you&apos;d written it.
      </P>

      <H2 id="grounding">Grounded search</H2>
      <P>
        When a bot needs facts fresher than training data — prices, docs, today&apos;s news — it
        searches the web and answers with a Sources list, so you can verify anything that matters.
      </P>

      <Callout kind="tip">
        No keys, nothing to configure. Chat, image, voice, and grounding all run on Wayfind&apos;s
        side — unlike connectors, where you bring your own endpoint URL (see{' '}
        <Link href="/docs/connectors" className="font-bold text-cta hover:underline">Connectors</Link>).
      </Callout>
    </article>
  );
}
