import { LambdaMicrovmsClient, CreateMicrovmAuthTokenCommand, GetMicrovmCommand } from '@aws-sdk/client-lambda-microvms';
import { mv } from './config';

const id = process.argv[2];
const info = await mv.send(new GetMicrovmCommand({ microvmIdentifier: id! }));
const t = await mv.send(new CreateMicrovmAuthTokenCommand({ microvmIdentifier: id!, expirationInMinutes: 15, allowedPorts: [{ allPorts: {} }] }));
const token = (t.authToken as Record<string, string>)['X-aws-proxy-auth'];
const r = await fetch(`https://${info.endpoint}/skills`, { headers: { 'X-aws-proxy-auth': token } });
const body = (await r.json()) as { skills: Array<{ name: string; files: number; source: string }> };
console.log('count=', body.skills.length);
for (const s of body.skills) console.log(`- ${s.name} (${s.files} files, ${s.source})`);
