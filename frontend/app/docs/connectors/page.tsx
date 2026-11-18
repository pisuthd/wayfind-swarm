import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, H2, P, Step, Steps } from '@/components/docs/ui';

export const metadata: Metadata = {
  title: 'Connectors — Wayfind Docs',
  description: 'Connect business apps to Wayfind SWARM: shared gateways, Zoho MCP and Web3 setup, importing from the app.',
};

const STEPS = [
  {
    title: 'Open the Zoho MCP dashboard',
    body: 'Go to zoho.com/mcp and sign in with your Zoho account.',
  },
  {
    title: 'Create a new MCP server',
    body: 'Create a server — one server can expose several services.',
  },
  {
    title: 'Add tools for your service',
    body: 'Add tools and select the service you want to use, then enable permission for those tools.',
  },
  {
    title: 'Switch the authorization type',
    body: 'Open the Connection tab and change the default Authorization On Demand to Authorization via Connection — this pre-authorises the tools so your bots can use them.',
  },
  {
    title: 'Copy the endpoint URL',
    body: 'Open the Connect tab and copy the endpoint to your MCP server. Paste it in the app import step below.',
  },
];

export default function DocsConnectorsPage() {
  return (
    <article>
      <h1 className="font-brico text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">Connectors</h1>
      <P>
        Connectors plug your apps into the team. Import once, and every bot can use the tools
        immediately. The catalog covers Zoho services, third-party apps, and Web3.
      </P>

      <H2 id="catalog">The catalog</H2>
      <P>
        Browse everything at <Link href="/connectors" className="font-bold text-cta hover:underline">/connectors</Link>,
        filterable by Zoho-based services, other services, and Web3. Each page lists what your bots
        will be able to do — tool inventories stay honest, so the counts you see are the tools
        you get.
      </P>

      <H2 id="gateways">One import covers the gateway</H2>
      <P>
        Connectors that share a gateway share one connection: import any Zoho app and every Zoho
        connector shows as installed; import any Web3 connector and the whole Web3 set lights up.
        Updating the endpoint from any sibling updates it for all of them.
      </P>

      <H2 id="import">Importing from the app</H2>
      <P>
        Click <strong>Connectors</strong> at the bottom of the app sidebar, pick the app, and paste
        your endpoint URL. Wayfind registers it on your cloud computer and verifies the
        connection — you&apos;ll see the live tool count. Importing again updates the endpoint in place.
      </P>
      <Callout kind="warning">
        Treat your endpoint URL like a password. It can trigger tools on your account — never paste
        it into public repos or shared docs.
      </Callout>

      <H2 id="zoho-mcp">Setting up Zoho MCP</H2>
      <P>
        Every Zoho MCP connector follows the same five steps on the Zoho side. You only need the
        services you plan to use.
      </P>
      <Steps>
        {STEPS.map((s, i) => (
          <Step key={s.title} title={String(i + 1)}>
            <strong>{s.title}.</strong> {s.body}
          </Step>
        ))}
      </Steps>

      <H2 id="web3">Setting up Web3</H2>
      <P>
        Web3 connectors run through the Web3 Gateway: sign in with email at the gateway site to get
        your wallet and endpoint URL, then import it the same way. Wallet operations, swaps, and
        stablecoin finance arrive together once the gateway is connected.
      </P>

      <H2 id="chat">Connecting from chat</H2>
      <P>
        No self-serve import exists yet for some connectors — or you&apos;d rather delegate. Just ask
        any bot in chat to connect the service; it will walk through the same setup with you.
      </P>
    </article>
  );
}
