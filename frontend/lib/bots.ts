import { generateClient } from 'aws-amplify/data';

// Untyped data client: the generated Schema lives in wayfind-cloud (backend
// package — not importable from a frontend). Runtime model access comes from
// amplify_outputs.json, which this frontend shares with the backend.
// `any` is deliberate — the wrappers below only touch documented fields.
// Reads/writes are owner-scoped server-side (same user pool as cloud/ONE).
/* eslint-disable @typescript-eslint/no-explicit-any */
let client: any = null;

function dataClient(): any {
  if (!client) client = generateClient();
  return client;
}

export interface BotRow {
  id: string;
  ownerId?: string | null;
  name: string;
  role?: string | null;
  description?: string | null;
  isChiefOfStaff?: boolean | null;
  skillsEnabled?: string[] | null;
  mcpEnabled?: string[] | null;
  color?: string | null;
  shape?: string | null;
  status?: string | null;
}

function toRow(r: any): BotRow {
  return {
    id: r.id,
    ownerId: r.ownerId ?? null,
    name: r.name,
    role: r.role ?? null,
    description: r.description ?? null,
    isChiefOfStaff: r.isChiefOfStaff ?? false,
    skillsEnabled: (r.skillsEnabled as string[] | null | undefined) ?? null,
    mcpEnabled: (r.mcpEnabled as string[] | null | undefined) ?? null,
    color: r.color ?? null,
    shape: r.shape ?? null,
    status: r.status ?? null,
  };
}

function throwOnErrors(errors: any) {
  if (errors?.length) throw new Error(errors.map((e: any) => e.message).join('; '));
}

export async function listBotsByOwner(ownerId: string): Promise<BotRow[]> {
  const { data, errors } = await dataClient().models.Bot.botsByOwnerId({ ownerId });
  throwOnErrors(errors);
  return ((data ?? []) as any[]).map(toRow);
}

export async function createBotRow(input: {
  ownerId: string;
  name: string;
  role?: string;
  description?: string;
  isChiefOfStaff?: boolean;
  color: string;
  shape: string;
}): Promise<BotRow> {
  const { data, errors } = await dataClient().models.Bot.create({
    ownerId: input.ownerId,
    name: input.name,
    ...(input.isChiefOfStaff ? { role: 'Chief of staff', isChiefOfStaff: true } : {}),
    ...(!input.isChiefOfStaff && input.role ? { role: input.role } : {}),
    ...(!input.isChiefOfStaff && input.description ? { description: input.description } : {}),
    color: input.color,
    shape: input.shape,
    status: 'active',
  });
  throwOnErrors(errors);
  if (!data) throw new Error('Create failed with no error detail.');
  return toRow(data);
}

export async function updateBotRow(id: string, patch: Partial<BotRow>): Promise<void> {
  const { errors } = await dataClient().models.Bot.update({ id, ...patch });
  throwOnErrors(errors);
}

export async function deleteBotRow(id: string): Promise<void> {
  const { errors } = await dataClient().models.Bot.delete({ id });
  throwOnErrors(errors);
}
