import { generateClient } from 'aws-amplify/data';

// Same untyped-client pattern as lib/bots.ts (Schema lives in wayfind-cloud).
/* eslint-disable @typescript-eslint/no-explicit-any */
let client: any = null;

function dataClient(): any {
  if (!client) client = generateClient();
  return client;
}

export interface ProfileRow {
  id: string;
  ownerId: string;
  email?: string | null;
  displayName?: string | null;
}

function throwOnErrors(errors: any) {
  if (errors?.length) throw new Error(errors.map((e: any) => e.message).join('; '));
}

export async function getOrCreateProfile(ownerId: string, email: string): Promise<ProfileRow> {
  const { data, errors } = await dataClient().models.UserProfile.profileByOwnerId({ ownerId });
  throwOnErrors(errors);
  if (data && data.length > 0) {
    return { id: data[0].id, ownerId, email: data[0].email ?? null, displayName: data[0].displayName ?? null };
  }
  const { data: created, errors: createErrors } = await dataClient().models.UserProfile.create({
    ownerId,
    email,
    plan: 'free',
  });
  throwOnErrors(createErrors);
  if (!created) throw new Error('Profile create returned no data.');
  return { id: created.id, ownerId, email: created.email ?? null, displayName: created.displayName ?? null };
}

export async function updateProfileName(id: string, displayName: string): Promise<void> {
  const { errors } = await dataClient().models.UserProfile.update({ id, displayName });
  throwOnErrors(errors);
}
