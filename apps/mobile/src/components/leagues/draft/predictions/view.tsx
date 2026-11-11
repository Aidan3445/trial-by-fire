import { View, Text } from 'react-native';
import { type LeagueRules } from '~/types/leagues';
import { type Prediction } from '~/types/events';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe } from '~/types/tribes';
import { useSecondaryPick } from '~/hooks/leagues/mutation/useSecondaryPick';
import PredictionCards from '~/components/leagues/actions/events/predictions/cards';
import SecondaryPickForm from '~/components/leagues/hub/picks/secondaryPick/form';
import MarqueeText from '~/components/common/marquee';
import AirStatus from '~/components/shared/episodes/airStatus';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useKeyEpisodes } from '~/hooks/seasons/useKeyEpisodes';

export interface WhileYouWaitProps {
  rules?: LeagueRules;
  predictionRuleCount: number;
  predictionsMade: Prediction[];
  castaways: EnrichedCastaway[];
  tribes: Tribe[];
}

export default function WhileYouWait({
  rules,
  predictionRuleCount,
  predictionsMade,
  castaways,
  tribes,
}: WhileYouWaitProps) {
  const { active: secondaryActive, options: secondaryOptions } = useSecondaryPick();
  const { data: league } = useLeague();
  const { data: keyEpisodes } = useKeyEpisodes(league?.seasonId ?? null);

  const showSecondaryPick = secondaryActive && secondaryOptions.length > 0;
  const showPredictions = rules && predictionRuleCount > 0;

  const spokeTitleRule = rules?.basePrediction?.spokeEpTitle;
  const titleEpisode = showPredictions && spokeTitleRule?.enabled && spokeTitleRule.timing.includes('Draft')
    ? keyEpisodes?.nextEpisode
    : null;

  if (!showSecondaryPick && !showPredictions) return null;

  return (
    <View className='w-full rounded-xl border-2 border-primary/20 bg-card'>
      {/* Header */}
      <View className='gap-1 px-3 pt-2'>
        <View className='flex-row items-center gap-2'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            While You Wait
          </Text>
        </View>
        <Text className='text-base text-muted-foreground'>
          {showSecondaryPick && showPredictions
            ? 'Make your secondary pick and predictions to earn extra points!'
            : showSecondaryPick
              ? 'Make your secondary pick to earn extra points!'
              : 'Make your predictions and earn points if you are correct!'}
        </Text>
        {titleEpisode && (
          <MarqueeText
            center
            text={`${titleEpisode.episodeNumber}: ${titleEpisode.title}`}
            className='text-base text-muted-foreground'>
            <AirStatus
              airDate={new Date(titleEpisode.airDate)}
              airStatus={titleEpisode.airStatus} />
          </MarqueeText>
        )}
      </View>

      {/* Secondary Pick */}
      {showSecondaryPick && (
        <View className='gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-2 mx-2 mb-2'>
          <Text className='text-base font-semibold text-foreground'>Secondary Pick</Text>
          <SecondaryPickForm className='p-0' />
        </View>
      )}

      {/* Predictions */}
      {showPredictions && (
        <PredictionCards
          rules={rules}
          predictionRuleCount={predictionRuleCount}
          predictionsMade={predictionsMade}
          castaways={castaways}
          tribes={tribes} />
      )}
    </View>
  );
}
