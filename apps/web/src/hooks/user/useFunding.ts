import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { type DonationStatus, type Funding } from '~/types/funding';

// Funding is edited by hand in the database, so never trust a cached copy
const NEVER_STALE = { staleTime: 0, gcTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true } as const;

/**
  * Fetches the funding goals and how much of each has been raised.
  * @returnObj `Funding`
  */
export function useFunding() {
  return useQuery<Funding>({
    queryKey: ['funding'],
    queryFn: async () => {
      const res = await fetch('/api/funding', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch funding');
      return res.json() as Promise<Funding>;
    },
    ...NEVER_STALE,
  });
}

/**
  * Whether the signed in user has donated, opted out this season, or has donations to thank.
  * @returnObj `DonationStatus`
  */
export function useDonationStatus() {
  const { isSignedIn } = useAuth();
  return useQuery<DonationStatus>({
    queryKey: ['donationStatus'],
    queryFn: async () => {
      const res = await fetch('/api/funding/status', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch donation status');
      return res.json() as Promise<DonationStatus>;
    },
    enabled: !!isSignedIn,
    ...NEVER_STALE,
  });
}

/**
  * Mark the user's donations as thanked once they dismiss the thank you
  */
export function useThankDonations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/funding/thanked', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark donations thanked');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['donationStatus'] }),
  });
}

/**
  * Stop asking the user to donate until a later season
  */
export function useOptOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/funding/optOut', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['donationStatus'] }),
  });
}

/**
  * Hide or show the user's donor crown for everyone
  */
export function useHideBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hidden: boolean) => {
      const res = await fetch('/api/funding/badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden }),
      });
      if (!res.ok) throw new Error('Failed to update your crown');
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['donationStatus'] }),
        queryClient.invalidateQueries({ queryKey: ['leagueMembers'] }),
      ]);
    },
  });
}
