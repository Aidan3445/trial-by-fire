// Re-export all shared event types
export * from '@survivor/types';

// Web-only: Override LivePrediction types using Drizzle schema inference
import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { type livePredictionOptionSchema, type livePredictionResponseSchema, type livePredictionSchema } from '~/server/db/schema/livePredictions';

// These override the shared plain types with Drizzle-inferred versions
export type LivePrediction = InferSelectModel<typeof livePredictionSchema>;
export type LivePredictionInsert = InferInsertModel<typeof livePredictionSchema>;
export type LivePredictionOption = InferSelectModel<typeof livePredictionOptionSchema>;
export type LivePredictionOptionInsert = InferInsertModel<typeof livePredictionOptionSchema>;
export type LivePredictionResponse = InferSelectModel<typeof livePredictionResponseSchema>;
export type LivePredictionResponseInsert = InferInsertModel<typeof livePredictionResponseSchema>;
