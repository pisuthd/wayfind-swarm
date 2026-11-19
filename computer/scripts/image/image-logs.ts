// Tail the microVM image builder log group.
// Usage: npx tsx packages/computer/scripts/image/image-logs.ts [groupName]
import { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

const group = process.argv[2] ?? '/aws/lambda-microvms/wayfind-computer';
const logs = new CloudWatchLogsClient({ region: process.env.AWS_REGION ?? 'ap-southeast-1' });
const streams = await logs.send(new DescribeLogStreamsCommand({ logGroupName: group, orderBy: 'LastEventTime', descending: true, limit: 3 }));
for (const s of streams.logStreams ?? []) {
  console.log('=== stream:', s.logStreamName);
  const ev = await logs.send(new GetLogEventsCommand({ logGroupName: group, logStreamName: s.logStreamName, limit: 50 }));
  for (const e of ev.events ?? []) console.log(new Date(e.timestamp!).toISOString(), (e.message ?? '').slice(0, 300));
}
