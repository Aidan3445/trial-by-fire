import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type DonationStatus, type Funding } from '~/types/funding';

// Funding is edited by hand in the database, so never trust a cached copy
const NEVER_STALE = { staleTime: 0, gcTime: 0, refetchOnMount: 'always' } as const;

/**
 * Fetches the funding goals and how much of each has been raised.
 * @returnObj `Funding`
 */
export function useFunding() {
  const getData = useFetch();
  const { isSignedIn } = useAuth();
  return useQuery<Funding>({
    queryKey: ['funding'],
    queryFn: async () => {
      const res = await getData('/api/funding');
      if (!res.ok) throw new Error('Failed to fetch funding');
      return res.json();
    },
    enabled: !!isSignedIn,
    ...NEVER_STALE,
  });
}

/**
 * Whether the signed in user has donated, opted out this season, or has donations to thank.
 * @returnObj `DonationStatus`
 */
export function useDonationStatus() {
  const getData = useFetch();
  const { isSignedIn } = useAuth();
  return useQuery<DonationStatus>({
    queryKey: ['donationStatus'],
    queryFn: async () => {
      const res = await getData('/api/funding/status');
      if (!res.ok) throw new Error('Failed to fetch donation status');
      return res.json();
    },
    enabled: !!isSignedIn,
    ...NEVER_STALE,
  });
}

/**
 * Mark the user's donations as thanked once they dismiss the thank you
 */
export function useThankDonations() {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await postData('/api/funding/thanked');
      if (!res.ok) throw new Error('Failed to mark donations thanked');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['donationStatus'] }),
  });
}

/**
 * Stop asking the user to donate until a later season
 */
export function useOptOut() {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await postData('/api/funding/optOut');
      if (!res.ok) throw new Error('Failed to save');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['donationStatus'] }),
  });
}

/**
 * Hide or show the user's donor crown for everyone
 */
export function useHideBadge() {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hidden: boolean) => {
      const res = await postData('/api/funding/badge', { body: { hidden } });
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
