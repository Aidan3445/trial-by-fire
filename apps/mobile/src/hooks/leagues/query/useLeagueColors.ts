import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useLeagueColors(overrideHash?: string) {
  const getData = useFetch('GET');
  const params = useLocalSearchParams();
  const hash = overrideHash ?? (params.hash as string);

  return useQuery<string[]>({
    queryKey: ['leagueMembers', hash, 'usedColors'],
    queryFn: async () => {
      if (!hash) return [];
      const response = await getData(`/api/leagues/${hash}/colors`);
      if (response.status !== 200) {
        console.error('Error fetching used colors:', response.statusText);
        return [];
      }
      const { usedColors } = (await response.json()) as { usedColors: string[] };
      return usedColors;
    },
    enabled: !!hash,
    staleTime: Infinity,
    gcTime: Infinity
  });
}
