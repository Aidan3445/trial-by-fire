'use server';

import { requireLeagueMemberAuth } from '~/lib/auth';
import requestCloneLogic from '~/services/leagues/mutation/requestClone';

/**
  * Ask the league owner to clone the league for the new season
  * @param hash The league
  * @throws an error if they can't ask right now
  * @returnObj `{ success }`
  */
export default async function requestClone(hash: string) {
  try {
    return await requireLeagueMemberAuth(requestCloneLogic)(hash);
  } catch (e) {
    let message: string;
    if (e instanceof Error) message = e.message;
    else message = String(e);

    if (message.includes('User not') || message.includes('Not a league member')) throw e;

    console.error('Failed to request a clone', e);
    throw new Error('Could not send the request right now.');
  }
}
