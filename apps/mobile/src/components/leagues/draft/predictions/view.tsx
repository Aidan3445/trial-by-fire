import { View, Text, Pressable } from 'react-native';
import { cn } from '~/lib/utils';
import { type LeagueRules } from '~/types/leagues';
import { type Prediction } from '~/types/events';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe } from '~/types/tribes';
import { useChangeCastaway } from '~/hooks/leagues/mutation/useChangeCastaway';
import PredictionCards from '~/components/leagues/actions/events/predictions/cards';
import SearchableSelect from '~/components/common/searchableSelect';

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
  const {
    secondaryPickSettings,
    secondaryCastawayOptions,
    secondarySelected,
    canSubmitSecondary,
    isSubmittingSecondary,
    isEpisodeAiring,
    handleSelectionChange,
    handleSecondarySubmit,
  } = useChangeCastaway();

  const showSecondaryPick = secondaryPickSettings?.enabled && secondaryCastawayOptions.length > 0;
  const showPredictions = rules && predictionRuleCount > 0;

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
      </View>

      {/* Secondary Pick */}
      {showSecondaryPick && (
        <View className='gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-2 mx-2 mb-2'>
          <Text className='text-base font-semibold text-foreground'>Secondary Pick</Text>
          <SearchableSelect
            options={secondaryCastawayOptions}
            selectedValue={secondarySelected ? parseInt(secondarySelected) : undefined}
            onSelect={(value) => handleSelectionChange('secondary', String(value))}
            placeholder='Select secondary pick' />
          <Pressable
            onPress={() => void handleSecondarySubmit()}
            disabled={!canSubmitSecondary}
            className={cn(
              'rounded-lg bg-primary p-3 active:opacity-80',
              !canSubmitSecondary && 'opacity-50'
            )}>
            <Text className='text-center text-base font-bold uppercase tracking-wider text-primary-foreground'>
              {isEpisodeAiring ? 'Episode Airing' : isSubmittingSecondary ? 'Submitting...' : 'Submit'}
            </Text>
          </Pressable>
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
