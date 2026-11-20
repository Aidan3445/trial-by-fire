import { useMemo, useState } from 'react';
import MarqueeText from '~/components/common/marquee';
import { View, Text } from 'react-native';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import { useLeagueActionDetails } from '~/hooks/leagues/enrich/useActionDetails';
import PredictionCards from '~/components/leagues/actions/events/predictions/cards';
import { type LeagueRules } from '~/types/leagues';
import AirStatus from '~/components/shared/episodes/airStatus';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Prediction } from '~/types/events';
import { PointsIcon } from '~/components/icons/generated';
import { useSecondaryPick } from '~/hooks/leagues/mutation/useSecondaryPick';

export interface MakePredictionsProps {
  predictionRuleCount?: number;
  rules?: LeagueRules;
  predictionsMade: Prediction[];
  castaways: EnrichedCastaway[];
  tribes: Array<{ tribeId: number; tribeName: string; tribeColor: string }>;
  wallet?: number;
  totalBet?: number;
  /** Bets edited in the form, by event name */
  setFormBets?: (_bets: Record<string, number>) => void;
  /** Add the weekly secondary pick as the last slide, with a progress rail */
  includeSecondary?: boolean;
}

export default function MakePredictions() {
  const { scores, leagueMembers } = useLeagueData();
  const {
    actionDetails,
    predictionRuleCount,
    keyEpisodes,
    predictionsMade,
    rules,
  } = useLeagueActionDetails();
  const { active: secondaryActive } = useSecondaryPick();

  const castaways = useMemo(() =>
    Object.values(actionDetails ?? {}).flatMap(({ castaways }) =>
      castaways.map((c) => c.castaway)
    ),
    [actionDetails]
  );

  const tribes = useMemo(() =>
    Object.values(actionDetails ?? {}).map(({ tribe }) => tribe),
    [actionDetails]
  );

  const [formBets, setFormBets] = useState<Record<string, number>>({});

  // Bets on predictions that haven't resolved yet, by event name
  const submittedBets = useMemo(() =>
    Object.fromEntries(predictionsMade
      .filter((p) => p.eventId === null)
      .map((p) => [p.eventName, p.bet ?? 0])),
    [predictionsMade]
  );
  const submittedBetTotal = Object.values(submittedBets).reduce((total, bet) => total + bet, 0);
  // Edits laid over what's saved, worked out in the same render so saved bets
  // never show as pending while the form catches up
  const formBetTotal = Object.values({ ...submittedBets, ...formBets }).reduce((total, bet) => total + bet, 0);

  const balance = useMemo(() =>
    (scores?.Member[leagueMembers?.loggedIn?.memberId ?? -1]?.slice().pop() ?? 0) -
    submittedBetTotal,
    [scores?.Member, leagueMembers?.loggedIn?.memberId, submittedBetTotal]
  );

  const pendingBalance = balance + submittedBetTotal - formBetTotal;

  if ((predictionRuleCount === 0 && !secondaryActive) || !keyEpisodes?.nextEpisode) return null;

  // Locked while an episode airs; the episode tracker shows those predictions
  if (keyEpisodes.previousEpisode?.airStatus === 'Airing') return null;
  const canMakePredictions = keyEpisodes.nextEpisode.airStatus === 'Upcoming';

  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card overflow-hidden w-full'>
      {/* Header */}
      <View className='px-3 py-1.5 gap-1'>
        {/* Bet Balance (Shauhin Mode) */}
        {rules?.shauhinMode?.enabled && rules.shauhinMode.enabledBets.length > 0 && (
          <View className='absolute top-0 right-0 items-end'>
            <View className='flex-row items-center px-1'>
              <Text
                allowFontScaling={false}
                className='text-sm italic text-muted-foreground'>
                Bet Balance: {balance}
              </Text>
              <PointsIcon size={11} color={colors.secondary} />
            </View>
            {formBetTotal !== submittedBetTotal && (
              <View
                className={cn(
                  'flex-row items-center rounded-md px-1 bg-amber-400',
                  pendingBalance < 0 && 'bg-red-400',
                  formBetTotal < submittedBetTotal && 'bg-green-400'
                )}>
                <Text
                  allowFontScaling={false}
                  className='text-sm text-primary italic'>
                  Pending: {pendingBalance}
                </Text>
                <PointsIcon size={11} color={colors.primary} />
              </View>
            )}
          </View>
        )}

        {/* Title */}
        <View className='flex-row items-center gap-2'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            {secondaryActive
              ? 'This Week\'s Picks'
              : `This Week's Prediction${predictionRuleCount > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Episode Info */}
        <MarqueeText
          text={`${keyEpisodes.nextEpisode.episodeNumber}: ${keyEpisodes.nextEpisode.title}`}
          className='text-base text-muted-foreground'>
          <AirStatus
            airDate={new Date(keyEpisodes.nextEpisode.airDate)}
            airStatus={keyEpisodes.nextEpisode.airStatus} />
        </MarqueeText>
      </View>

      {/* Prediction Cards */}
      {canMakePredictions && (
        <PredictionCards
          predictionRuleCount={predictionRuleCount}
          rules={rules}
          predictionsMade={predictionsMade}
          castaways={castaways}
          tribes={tribes}
          wallet={balance + submittedBetTotal}
          totalBet={formBetTotal}
          setFormBets={setFormBets}
          includeSecondary />
      )}
    </View>
  );
}
