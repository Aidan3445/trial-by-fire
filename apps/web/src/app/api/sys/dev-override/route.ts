import { type NextRequest, NextResponse } from 'next/server';
import { type DevHarnessState } from '~/server/devHarness';
import { type EpisodeOverrideConfig } from '~/types/episodes';

/*
 * Dev harness control. Intentionally unauthenticated: NODE_ENV is inlined at build
 * time, so in prod this is a bare 404 and the harness import is stripped.
 */

export const dynamic = 'force-dynamic';

export type DevHarnessResponse = Omit<DevHarnessState, 'ownerId'> & {
  /** Whether the override currently applies to this device's requests */
  active: boolean;
  /** Whether this device set the current override */
  isOwner: boolean;
};

const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404 });

async function toResponse(state: DevHarnessState, ownerId: string | null): Promise<DevHarnessResponse> {
  const { getActiveOverride } = await import('~/server/devHarness');
  const { ownerId: stateOwner, ...rest } = state;
  const isOwner = !!ownerId && ownerId === stateOwner;
  const active = state.broadcast ? !!(await getActiveOverride(state)) : isOwner && !!state.config?.enabled;
  return { ...rest, active, isOwner };
}

export async function GET(_: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return notFound();

  const { readHarnessState, getHarnessOwnerId } = await import('~/server/devHarness');
  return NextResponse.json(await toResponse(readHarnessState(), await getHarnessOwnerId()), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return notFound();

  const {
    HARNESS_OWNER_COOKIE, getHarnessOwnerId, newHarnessOwnerId, writeHarnessState,
  } = await import('~/server/devHarness');
  const body = await req.json() as { config?: EpisodeOverrideConfig | null; broadcast?: boolean };
  const ownerId = await getHarnessOwnerId() ?? newHarnessOwnerId();

  const state = writeHarnessState({
    // Whoever sets the override owns it (it applies only to them while broadcast is off)
    ...(body.config !== undefined ? { config: body.config, ownerId } : {}),
    ...(body.broadcast !== undefined ? { broadcast: body.broadcast } : {}),
  });

  const res = NextResponse.json(await toResponse(state, ownerId));
  res.cookies.set(HARNESS_OWNER_COOKIE, ownerId, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
  return res;
}
