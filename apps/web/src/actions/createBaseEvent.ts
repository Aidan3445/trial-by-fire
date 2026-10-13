'use server';

import { auth, requireSystemAdminAuth } from '~/lib/auth';
import createBaseEventLogic from '~/services/seasons/mutation/createBaseEvent';
import { type BaseEventInsert } from '~/types/events';

/**
  * Create a new base event for the season
  * @param baseEvent event to create
  * @param autoEventId the detected auto event the form was filled from, if any
  * @throws if the user is not a system admin
  * @throws if the event cannot be created
  * @returns the id of the created base event
  * @returnObj `newEventId`
  */
export default async function createBaseEvent(baseEvent: BaseEventInsert, autoEventId?: number) {
  try {
    const fromAutoEvent = autoEventId ? { autoEventId, userId: (await auth()).userId ?? null } : undefined;
    return await requireSystemAdminAuth(createBaseEventLogic)(baseEvent, fromAutoEvent);
  } catch (e) {
    let message: string;
    if (e instanceof Error) message = e.message;
    else message = String(e);

    if (message.includes('User not authorized')) throw e;

    console.error('Failed to create base event', e);
    throw new Error('Failed to create base event.');
  }
}


