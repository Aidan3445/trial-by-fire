import { type BaseEventName, type AutoEvent, type EventReference, type EventWithReferences } from '@survivor/types';
import { BaseEventLabelPrefixes, BaseEventLabels } from './events';

/**
 * Margin of overlap for two detected events to be considered the same
 */
export const SAME_CHECK_OVERLAP = 0.5;

export function fingerprintOverlap(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const [small, large] = a.length <= b.length ? [a, b] : [b, a];
  const set = new Set(large);
  const shared = new Set(small.filter((hash) => set.has(hash))).size;
  return shared / new Set(small).size;
}

/** The label the base event form builds for an event and subtype. */
export function autoEventLabel(eventName: BaseEventName, subtype: string | null) {
  if (!subtype) return null;
  if (!BaseEventLabels[eventName].includes(subtype)) return subtype;
  return `${BaseEventLabelPrefixes[eventName]} ${subtype}`.trim();
}

/** Get the subtype to prefill */
export function autoEventFormSubtype(eventName: BaseEventName, subtype: string | null) {
  if (!subtype) return '';
  return BaseEventLabels[eventName].includes(subtype) ? subtype : 'Custom';
}

const sameReference = (a: EventReference, b: EventReference) => a.type === b.type && a.id === b.id;

type EventShape = Pick<EventWithReferences, 'eventName' | 'label' | 'references'>;

/**
 * Was an auto event actually kept or was it discarded after review
 */
export function autoEventKept(autoEvent: Pick<AutoEvent, 'eventName' | 'subtype' | 'references'>, event: EventShape) {
  if (autoEvent.eventName === event.eventName) return true;
  const label = autoEventLabel(autoEvent.eventName, autoEvent.subtype);
  if (label && label === event.label?.trim()) return true;
  return autoEvent.references.some((ref) => event.references.some((other) => sameReference(ref, other)));
}

/**
 * Prevent duplicate prompting of the same auto event 
 */
export function findScoredMatch<E extends EventShape & { episodeId: number }>(
  autoEvent: Pick<AutoEvent, 'episodeId' | 'eventName' | 'references'>,
  events: E[]
) {
  return events.find((event) =>
    event.episodeId === autoEvent.episodeId &&
    event.eventName === autoEvent.eventName &&
    (autoEvent.references.length === 0 ||
      autoEvent.references.some((ref) => event.references.some((other) => sameReference(ref, other))))
  ) ?? null;
}
