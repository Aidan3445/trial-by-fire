/**
 * Funding goals for running costs (e.g. Clerk's paid tier for longer login
 * sessions), and what users report donating toward them.
 */

export type FundingGoal = {
  fundingId: number;
  name: string;
  description: string;
  goal: number;
  coverage: number;
  priority: number;
  fulfilled: boolean;
};

export type Funding = {
  goals: FundingGoal[];
  total: { goal: number; coverage: number };
};

export type DonationStatus = {
  seasonId: number | null;
  donatedThisSeason: boolean;
  donatedBefore: boolean;
};

export type DonationReport = {
  amount: number;
  fundingId?: number;
};
