import z from 'zod';
import { Castaway } from './castaways';

export const LeagueMemberRoles = ['Owner', 'Admin', 'Member'] as const;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 32;

export type LeagueMemberRole = (typeof LeagueMemberRoles)[number];

export type LeagueMember = {
  memberId: number;
  displayName: string;
  color: string;
  role: LeagueMemberRole;
  draftOrder: number;
  loggedIn: boolean;
};

export type StreakMember = {
  member: LeagueMember;
  castaway: Castaway | null;
  tribeColor: string | null;
}

export type LeagueMemberInsert = {
  displayName: string;
  color: string;
};

export type PendingLeagueMember = LeagueMemberInsert & {
  memberId: number;
};

export const DisplayNameZod = z.string()
  .min(DISPLAY_NAME_MIN_LENGTH, { message: `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters` })
  .max(DISPLAY_NAME_MAX_LENGTH, { message: `Display name must be between ${DISPLAY_NAME_MIN_LENGTH} and ${DISPLAY_NAME_MAX_LENGTH} characters` });
export const ColorZod = z.string().regex(/^#[0-9a-f]{6}$/i);

export const LeagueMemberInsertZod = z.object({
  displayName: DisplayNameZod,
  color: ColorZod,
}).transform(data => ({
  ...data,
  displayName: data.displayName.trim(),
}));

export type LeagueMemberStatus = {
  currentCastawayId: number | null;
  currentCastaway: string | null;
  isEliminated: boolean;
};

export type SelectionUpdate = {
  episodeNumber: number;
  memberId: number;
  castawayId: number;
  draft: boolean;
};

export type CurrentSelection = {
  castawayId: number;
  fullName: string;
  isEliminated: boolean;
} | null;

export type SecondaryPickSelection = {
  memberId: number;
  episodeId: number;
  castawayId: number;
};

export type SecondaryPickHistory = {
  memberId: number;
  selections: {
    episodeNumber: number;
    castawayId: number;
    castawayName: string;
    points: number;
  }[];
};
