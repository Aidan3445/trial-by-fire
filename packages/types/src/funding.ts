/**
 * Funding goals for running costs (e.g. Clerk's paid tier for longer login
 * sessions), and what users donate toward them.
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
  // Do not ask for donations
  optedOut: boolean;
  // Total of their Buy Me a Coffee donations we haven't thanked them for yet 
  unthanked: number | null;
  // Hid their donor crown from everyone
  hideBadge: boolean;
};
