import { useMutation } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useChangeLeaderboardUsername() {
  const postData = useFetch('POST');

  return useMutation({
    mutationFn: async (newUsername?: string) => {
      if (newUsername === undefined) {
        const res = await postData('/api/live/leaderboard');
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Failed to establish leaderboard username');
        }
        return;
      }

      const res = await postData('/api/live/leaderboard', {
        body: { newUsername },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change username');
      }
    },
  });
}
