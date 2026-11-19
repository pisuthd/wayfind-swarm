import { LambdaMicrovmsClient, GetMicrovmCommand, GetMicrovmImageCommand } from '@aws-sdk/client-lambda-microvms';
import { mv } from './config';

const id = process.argv[2];
if (id) {
  const r = await mv.send(new GetMicrovmCommand({ microvmIdentifier: id }));
  console.log(JSON.stringify(r, null, 1).slice(0, 2000));
} else {
  const arn = 'arn:aws:lambda:ap-southeast-1:057386374967:microvm-image:wayfind-computer';
  const r = await mv.send(new GetMicrovmImageCommand({ imageIdentifier: arn }));
  console.log(JSON.stringify(r, null, 1).slice(0, 2000));
}
