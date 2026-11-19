// List S3 backup keys for a computer's workspace.
// Usage: npx tsx packages/computer/scripts/image/s3-ls.ts <computerId> [prefixFilter]
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BUCKET } from './config';

const computerId = process.argv[2];
const filter = process.argv[3] ?? '';
const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'ap-southeast-1' });
const prefix = `computers/${computerId}/workspace/${filter}`;
let token: string | undefined;
let n = 0;
do {
  const r = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }));
  for (const o of r.Contents ?? []) { console.log(o.Key, o.Size); n++; }
  token = r.NextContinuationToken;
} while (token);
console.log(`total=${n}`);
