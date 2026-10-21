import 'server-only';

import { asc } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingSchema } from '~/server/db/schema/funding';
import { type Funding } from '~/types/funding';

/**
  * Get the funding goals, never cached so edits to the table show on the next load
  * @returnObj `Funding`
  */
export default async function getFunding(): Promise<Funding> {
  const rows = await db
    .select()
    .from(fundingSchema)
    .orderBy(asc(fundingSchema.priority), asc(fundingSchema.fundingId));

  const goals = rows.map((row) => {
    const goal = Number(row.goal);
    const coverage = Number(row.coverage);
    return {
      fundingId: row.fundingId,
      name: row.name,
      description: row.description,
      goal,
      coverage,
      priority: row.priority,
      fulfilled: coverage >= goal,
    };
  });

  return {
    goals,
    total: {
      goal: goals.reduce((sum, goal) => sum + goal.goal, 0),
      coverage: goals.reduce((sum, goal) => sum + Math.min(goal.coverage, goal.goal), 0),
    },
  };
}
