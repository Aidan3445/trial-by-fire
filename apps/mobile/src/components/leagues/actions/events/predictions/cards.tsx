import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { colors } from '~/lib/colors';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { useShauhinActive } from '~/hooks/leagues/enrich/useShauhinActive';
import { BaseEventDescriptions, BaseEventFullName, BasePredictionReferenceTypes } from '~/lib/events';
import PredictionTimingHelp from '~/components/leagues/actions/events/predictions/timingHelp';
import SubmissionCard from '~/components/leagues/actions/events/predictions/submission';
import { type ScoringBaseEventName, type ReferenceType, type MakePrediction } from '~/types/events';
import { type MakePredictionsProps } from '~/components/leagues/actions/events/predictions/view';
import MarqueeText from '~/components/common/marquee';
import DescriptionCell from '~/components/leagues/actions/events/predictions/description';
import { PointsIcon } from '~/components/icons/generated';

export default function PredictionCards({
  rules,
  predictionsMade,
  castaways,
  tribes,
  wallet,
  totalBet,
  setBetTotal,
}: MakePredictionsProps) {
  const shauhinActive = useShauhinActive();

  const enabledBasePredictions = useMemo(() =>
    Object.entries(rules?.basePrediction ?? {})
      .filter(([_, rule]) => rule.enabled)
      .map(([baseEventName, rule]) => {
        const eventName = baseEventName as ScoringBaseEventName;
        const fullName = BaseEventFullName[eventName] ?? baseEventName;
        const prediction: MakePrediction = {
          eventSource: 'Base' as const,
          eventName: eventName,
          label: fullName,
          description: `${BaseEventDescriptions.prediction[eventName]} ${BaseEventDescriptions.italics[eventName] ?? ''}`,
          points: rule.points,
          referenceTypes: BasePredictionReferenceTypes[eventName],
          timing: rule.timing,
          predictionMade: predictionsMade.find((pred) => pred.eventName === eventName) ?? null,
          shauhinEnabled:
            shauhinActive &&
            rules?.shauhinMode?.enabled &&
            rules.shauhinMode.enabledBets.includes(eventName),
        };
        return prediction;
      }),
    [rules, predictionsMade, shauhinActive]
  );

  const customPredictions: MakePrediction[] = useMemo(() =>
    rules?.custom
      .filter((rule) => rule.eventType === 'Prediction')
      .map((rule) => ({
        eventSource: 'Custom' as const,
        eventName: rule.eventName,
        label: rule.eventName,
        description: rule.description,
        points: rule.points,
        referenceTypes: rule.referenceTypes,
        timing: rule.timing,
        predictionMade: predictionsMade.find((pred) => pred.eventName === rule.eventName) ?? null,
      })) ?? [],
    [rules, predictionsMade]
  );

  const allPredictions = useMemo(
    () => [...enabledBasePredictions, ...customPredictions],
    [enabledBasePredictions, customPredictions]
  );

  const getOptions = useCallback((referenceTypes: ReferenceType[]) => {
    const options: Record<ReferenceType | 'Direct Castaway', Record<string, { id: number; color: string; tribeName?: string }>> = {
      'Castaway': {},
      'Tribe': {},
      'Direct Castaway': {},
    };

    const castawayKey = referenceTypes.length === 0 || referenceTypes.includes('Castaway')
      ? 'Castaway'
      : 'Direct Castaway';

    castaways.forEach((castaway) => {
      if (castaway.eliminatedEpisode
        && !castaway.redemption?.some((r) => r.secondEliminationEpisode === null)) return;
      const tribe = castaway.tribe;
      options[castawayKey][castaway.fullName] = {
        id: castaway.castawayId,
        color: tribe?.color ?? '#AAAAAA',
        tribeName: tribe?.name ?? 'No Tribe',
      };
    });

    if (referenceTypes.length === 0 || referenceTypes.includes('Tribe')) {
      tribes.forEach((tribe) => {
        options.Tribe[tribe.tribeName] = {
          id: tribe.tribeId,
          color: tribe.tribeColor,
        };
      });
    }

    return options;
  }, [castaways, tribes]);

  const [formBetValues, setFormBetValues] = useState<Record<string, number>>({});
  const updateFormBetValue = useCallback((eventName: string, bet: number) => {
    setFormBetValues((prev) => ({ ...prev, [eventName]: bet }));
  }, []);

  useEffect(() => {
    if (!setBetTotal) return;
    const total = Object.values(formBetValues).reduce((sum, val) => sum + val, 0);
    setBetTotal(total);
  }, [formBetValues, setBetTotal]);

  const { ref, props, progressProps, scrollNext, setCarouselData } = useCarousel(allPredictions);

  useEffect(() => {
    setCarouselData(allPredictions);
  }, [allPredictions, scrollNext, setCarouselData]);

  if (allPredictions.length === 0) return null;

  // Single prediction - simpler layout without carousel
  if (allPredictions.length === 1) {
    const prediction = allPredictions[0]!;

    return (
      <View className='mx-2 mb-2 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
        <View className='bg-primary/10 py-2 px-3'>
          <View className='flex-row items-center justify-center gap-2'>
            <Text className='text-lg font-bold uppercase tracking-wider text-foreground'>
              {prediction.label}
            </Text>
            <View className='flex-row items-center'>
              <Text className='text-base font-bold text-foreground'>{prediction.points}</Text>
              <PointsIcon size={16} color={colors.primary} />
            </View>
          </View>
          <View className='flex-row items-center justify-center gap-0.5'>
            <Text className='text-base text-muted-foreground'>
              {prediction.timing.join(' - ')}
            </Text>
            <PredictionTimingHelp />
          </View>
        </View>

        <View className='bg-secondary py-1 px-2'>
          <Text className='text-base font-medium text-foreground text-left leading-none'>
            {prediction.description}
          </Text>
        </View>

        <SubmissionCard
          prediction={prediction}
          options={getOptions(prediction.referenceTypes)}
          wallet={wallet}
          updateBetTotal={updateFormBetValue}
          totalBet={totalBet}
          maxBet={rules?.shauhinMode?.enabled ? rules.shauhinMode.maxBet : undefined} />
      </View>
    );
  }

  // Multiple predictions - carousel layout
  return (
    <View className='gap-2'>
      <Carousel
        ref={ref}
        {...props}
        height={rules?.shauhinMode?.enabled && allPredictions.some((p) => p.shauhinEnabled)
          ? 240
          : 200}
        data={allPredictions}
        renderItem={({ item: prediction }) => (
          <View className='flex-1 mx-2 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
            <View className='bg-primary/10 py-2 px-3'>
              <View className='flex-row items-center justify-center gap-2'>
                <Text
                  allowFontScaling={false}
                  className='text-lg font-bold uppercase tracking-wider text-foreground'>
                  {prediction.label}
                </Text>
                <View className='flex-row items-center'>
                  <Text
                    allowFontScaling={false}
                    className='text-base font-bold text-foreground'>{prediction.points}</Text>
                  <PointsIcon size={13} color={colors.primary} />
                </View>
              </View>
              <View className='flex-row items-center justify-center gap-0.5 pr-1'>
                <MarqueeText
                  allowFontScaling={false}
                  className='text-base text-muted-foreground'
                  containerClassName='flex-row'
                  text={prediction.timing.join(' - ')}
                  noMarqueeContainerClassName='w-min' />
                <PredictionTimingHelp />
              </View>
            </View>

            <DescriptionCell label={prediction.label} description={prediction.description} />

            <SubmissionCard
              prediction={prediction}
              options={getOptions(prediction.referenceTypes)}
              wallet={wallet}
              updateBetTotal={updateFormBetValue}
              totalBet={totalBet}
              maxBet={rules?.shauhinMode?.enabled ? rules.shauhinMode.maxBet : undefined}
              onSubmitSuccess={scrollNext} />
          </View>
        )}
        loop={false} />

      <View className='items-center'>
        <Pagination.Basic {...progressProps} containerStyle={{ marginBottom: 4 }} />
      </View>
    </View>
  );
}
