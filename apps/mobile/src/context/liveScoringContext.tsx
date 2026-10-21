import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import { useAiringEpisode } from '~/hooks/seasons/useAiringEpisode';
import { useLiveScoringSession } from '~/hooks/user/useLiveScoringSession';
import { useLeagues } from '~/hooks/user/useLeagues';
import { colors } from '~/lib/colors';

type LiveScoringContextValue = {
  /** An episode is airing in a season where the user has an active league */
  isLive: boolean;
  isOptedIn: boolean;
  /** Ask whether to turn live scoring alerts on or off, for the airing episode or a given one */
  openPrompt: (_episodeId?: number) => void;
};

const LiveScoringContext = createContext<LiveScoringContextValue>({
  isLive: false,
  isOptedIn: false,
  openPrompt: () => undefined,
});

/**
 * Live scoring alerts for the airing episode: the on/off prompt, opened from the
 * "episode starting" notification or the header indicator
 */
export function LiveScoringProvider({ children }: { children: ReactNode }) {
  const { airingEpisode } = useAiringEpisode();
  const { data: leagues } = useLeagues();
  const [promptEpisodeId, setPromptEpisodeId] = useState<number | null>(null);

  const isLive = !!airingEpisode && !!leagues?.some(({ league }) =>
    league.status === 'Active' && league.seasonId === airingEpisode.seasonId);

  // A notification can name an episode before the airing one has loaded
  const episodeId = promptEpisodeId ?? airingEpisode?.episodeId;
  const { isOptedIn, optIn, optOut, isUpdating } = useLiveScoringSession(episodeId);

  const openPrompt = useCallback((id?: number) => {
    setPromptEpisodeId(id ?? airingEpisode?.episodeId ?? null);
  }, [airingEpisode?.episodeId]);
  const close = () => setPromptEpisodeId(null);

  const value = useMemo(() => ({ isLive, isOptedIn, openPrompt }), [isLive, isOptedIn, openPrompt]);

  return (
    <LiveScoringContext.Provider value={value}>
      {children}
      <Modal visible={promptEpisodeId !== null} onClose={close}>
        <View className='gap-4'>
          <View className='flex-row items-center justify-center gap-2'>
            {isOptedIn
              ? <Bell size={22} color={colors.primary} />
              : <BellOff size={22} color={colors.primary} />}
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              Live Scoring Alerts
            </Text>
          </View>
          <Text className='text-base text-muted-foreground text-center'>
            {isOptedIn
              ? 'Alerts are on for this episode. Turn them off?'
              : 'Would you like to turn on live scoring alerts for this episode?'}
          </Text>
          <View className='flex-row gap-2'>
            <Button
              onPress={close}
              className='flex-1 rounded-lg border-2 border-primary/30 bg-primary/5 p-3 active:opacity-80'>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-primary'>
                {isOptedIn ? 'Keep On' : 'No'}
              </Text>
            </Button>
            <Button
              disabled={isUpdating}
              onPress={() => {
                if (isOptedIn) optOut();
                else optIn();
                close();
              }}
              className='flex-1 rounded-lg bg-primary p-3 active:opacity-80'>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-primary-foreground'>
                {isOptedIn ? 'Turn Off' : 'Yes'}
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </LiveScoringContext.Provider>
  );
}

export function useLiveScoring() {
  return useContext(LiveScoringContext);
}
