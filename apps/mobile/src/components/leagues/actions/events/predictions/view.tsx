import { useMemo, useState } from 'react';
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

export interface MakePredictionsProps {
  predictionRuleCount?: number;
  rules?: LeagueRules;
  predictionsMade: Prediction[];
  castaways: EnrichedCastaway[];
  tribes: Array<{ tribeId: number; tribeName: string; tribeColor: string }>;
  wallet?: number;
  totalBet?: number;
  setBetTotal?: (_total: number) => void;
}

export default function MakePredictions() {
  const { scores, leagueMembers } = useLeagueData();
  const {
    actionDetails,
    predictionRuleCount,
    keyEpisodes,
    predictionsMade,
    basePredictionsMade,
    rules,
  } = useLeagueActionDetails();

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

  const [formBetTotal, setFormBetTotal] = useState(0);

  const pendingBetTotal = useMemo(() =>
    Object.values(basePredictionsMade ?? {})
      .flatMap((preds) => preds)
      .filter((p) => p.eventId === null && (p.bet ?? 0) > 0)
      .reduce((total, p) => total + (p.bet ?? 0), 0),
    [basePredictionsMade]
  );

  const submittedBetTotal = useMemo(() =>
    predictionsMade.reduce(
      (total, p) => total + (p.eventId !== null ? 0 : p.bet ?? 0),
      0
    ),
    [predictionsMade]
  );

  const balance = useMemo(() =>
    (scores?.Member[leagueMembers?.loggedIn?.memberId ?? -1]?.slice().pop() ?? 0) -
    submittedBetTotal -
    pendingBetTotal,
    [scores?.Member, leagueMembers?.loggedIn?.memberId, submittedBetTotal, pendingBetTotal]
  );

  if (predictionRuleCount === 0 || !keyEpisodes?.nextEpisode) return null;

  const isLocked = keyEpisodes.previousEpisode?.airStatus === 'Airing';
  const canMakePredictions =
    keyEpisodes.nextEpisode.airStatus === 'Upcoming' && !isLocked;

  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card overflow-hidden w-full'>
      {/* Header */}
      <View className='p-3 gap-2'>
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
                  balance - formBetTotal < 0 && 'bg-red-400',
                  formBetTotal < submittedBetTotal && 'bg-green-400'
                )}>
                <Text
                  allowFontScaling={false}
                  className='text-sm text-primary italic'>
                  Pending: {balance - formBetTotal}
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
            {isLocked
              ? 'Predictions Locked'
              : `This Week's Prediction${predictionRuleCount > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Episode Info */}
        <View className='flex-row flex-wrap items-center justify-center gap-2'>
          <Text className='text-base text-muted-foreground'>
            {keyEpisodes.nextEpisode.episodeNumber}: {keyEpisodes.nextEpisode.title}
          </Text>
          <AirStatus
            airDate={new Date(keyEpisodes.nextEpisode.airDate)}
            airStatus={keyEpisodes.nextEpisode.airStatus} />
        </View>
      </View>

      {/* Prediction Cards */}
      {canMakePredictions && (
        <PredictionCards
          predictionRuleCount={predictionRuleCount}
          rules={rules}
          predictionsMade={predictionsMade}
          castaways={castaways}
          tribes={tribes}
          wallet={balance}
          totalBet={formBetTotal}
          setBetTotal={setFormBetTotal} />
      )}
    </View>
  );
}
