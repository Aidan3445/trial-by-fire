export * from '@survivor/lib';
// Re-exports from @survivor/lib: cn, findTribeCastaways, getTribeTimeline,
// basePredictionRulesSchemaToObject, basePredictionRulesObjectToSchema,
// camelToTitle, getHslIndex

// Mobile-only exports below:

import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

export function reviveDates(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }

  const result = {} as Record<string, any>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      // ISO date string pattern
      result[key] = new Date(value);
    } else if (typeof value === 'object') {
      result[key] = reviveDates(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
  * A unique ID for this app launch instance
  */
export const APP_LAUNCH_ID = uuid();
