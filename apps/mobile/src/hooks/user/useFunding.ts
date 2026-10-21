import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type DonationReport, type DonationStatus, type Funding } from '~/types/funding';

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
 * Whether the signed in user has reported donating, this season or before.
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
 * Report a donation; adds it to a goal and returns the updated funding.
 */
export function useReportDonation() {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: DonationReport) => {
      const res = await postData('/api/funding/donations', { body: report });
      if (!res.ok) {
        const { error } = await res.json() as { error?: string };
        throw new Error(error ?? 'Failed to save your donation');
      }
      return res.json() as Promise<Funding>;
    },
    onSuccess: async (funding) => {
      queryClient.setQueryData(['funding'], funding);
      await queryClient.invalidateQueries({ queryKey: ['donationStatus'] });
    },
  });
}
