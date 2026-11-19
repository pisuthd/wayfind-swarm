// Read-only probe of a running VM: /ready + /skills + OS marker.
// Usage: npx tsx packages/computer/scripts/image/vm-skills.ts <microvmId>
import { LambdaMicrovmsClient, CreateMicrovmAuthTokenCommand, GetMicrovmCommand } from '@aws-sdk/client-lambda-microvms';
import { mv } from './config';

const id = process.argv[2];
if (!id) throw new Error('usage: vm-skills.ts <microvmId>');
const info = await mv.send(new GetMicrovmCommand({ microvmIdentifier: id }));
console.log('state=', info.state, 'endpoint=', info.endpoint);
if (info.state !== 'RUNNING' || !info.endpoint) process.exit(0);
const t = await mv.send(new CreateMicrovmAuthTokenCommand({ microvmIdentifier: id, expirationInMinutes: 15, allowedPorts: [{ allPorts: {} }] }));
const token = (t.authToken as Record<string, string>)['X-aws-proxy-auth'];
for (const p of ['/ready', '/skills']) {
  const r = await fetch(`https://${info.endpoint}${p}`, { headers: { 'X-aws-proxy-auth': token } });
  const body = await r.text();
  console.log(p, '->', r.status, body.slice(0, 1200));
}
