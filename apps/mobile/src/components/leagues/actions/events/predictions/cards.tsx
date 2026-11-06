import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { colors } from '~/lib/colors';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { useShauhinActive } from '~/hooks/leagues/enrich/useShauhinActive';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { BaseEventDescriptions, BaseEventFullName, BasePredictionReferenceTypes } from '~/lib/events';
import PredictionTimingHelp from '~/components/leagues/actions/events/predictions/timingHelp';
import SubmissionCard from '~/components/leagues/actions/events/predictions/submission';
import { type ScoringBaseEventName, type ReferenceType, type MakePrediction } from '~/types/events';
import { type MakePredictionsProps } from '~/components/leagues/actions/events/predictions/view';
import MarqueeText from '~/components/common/marquee';
import DescriptionCell from '~/components/leagues/actions/events/predictions/description';
import { PointsIcon } from '~/components/icons/generated';
import { cn } from '~/lib/utils';
import { useSecondaryPick } from '~/hooks/leagues/mutation/useSecondaryPick';
import SecondaryPickForm from '~/components/leagues/hub/picks/secondaryPick/form';

type Slide =
  | { kind: 'prediction'; key: string; prediction: MakePrediction }
  | { kind: 'secondary'; key: string };

export default function PredictionCards({
  rules,
  predictionsMade,
  castaways,
  tribes,
  wallet,
  totalBet,
  setBetTotal,
  includeSecondary,
}: MakePredictionsProps) {
  const shauhinActive = useShauhinActive();
  const { data: league } = useLeague();
  const { data: seasonCastaways } = useCastaways(league?.seasonId ?? null);

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

  const getOptions = useCallback((referenceTypes: ReferenceType[], eventName?: string) => {
    const options: Record<ReferenceType | 'Direct Castaway', Record<string, { id: number; color: string; tribeName?: string }>> = {
      'Castaway': {},
      'Tribe': {},
      'Direct Castaway': {},
    };

    const castawayKey = referenceTypes.length === 0 || referenceTypes.includes('Castaway')
      ? 'Castaway'
      : 'Direct Castaway';

    // Tribes with someone still in the game; an empty tribe can't be predicted
    const activeTribes = new Set<string>();
    castaways.forEach((castaway) => {
      if (castaway.eliminatedEpisode
        && !castaway.redemption?.some((r) => r.secondEliminationEpisode === null)) return;
      const tribe = castaway.tribe;
      if (tribe) activeTribes.add(tribe.name);
      options[castawayKey][castaway.fullName] = {
        id: castaway.castawayId,
        color: tribe?.color ?? '#AAAAAA',
        tribeName: tribe?.name ?? 'No Tribe',
      };
    });

    // Jeff (and any other production castaways) have no season
    if (eventName === 'spokeEpTitle') {
      seasonCastaways?.filter((castaway) => castaway.seasonId === null)
        .forEach((castaway) => {
          options[castawayKey][castaway.fullName] = {
            id: castaway.castawayId,
            color: '#AAAAAA',
            tribeName: 'No Tribe'
          };
        });
    }

    if (referenceTypes.length === 0 || referenceTypes.includes('Tribe')) {
      // Before any tribe is assigned, offer them all
      tribes
        .filter((tribe) => activeTribes.size === 0 || activeTribes.has(tribe.tribeName))
        .forEach((tribe) => {
          options.Tribe[tribe.tribeName] = {
            id: tribe.tribeId,
            color: tribe.tribeColor,
          };
        });
    }

    return options;
  }, [castaways, tribes, seasonCastaways]);

  const [formBetValues, setFormBetValues] = useState<Record<string, number>>({});
  const updateFormBetValue = useCallback((eventName: string, bet: number) => {
    setFormBetValues((prev) => ({ ...prev, [eventName]: bet }));
  }, []);

  useEffect(() => {
    if (!setBetTotal) return;
    const total = Object.values(formBetValues).reduce((sum, val) => sum + val, 0);
    setBetTotal(total);
  }, [formBetValues, setBetTotal]);

  const secondary = useSecondaryPick();
  const showSecondary = !!includeSecondary && secondary.active;

  const slides = useMemo<Slide[]>(() => [
    ...allPredictions.map((prediction) => ({
      kind: 'prediction' as const,
      key: prediction.eventName,
      prediction,
    })),
    ...(showSecondary ? [{ kind: 'secondary' as const, key: 'secondary' }] : []),
  ], [allPredictions, showSecondary]);

  const steps = useMemo(() => slides.map((slide) => slide.kind === 'secondary'
    ? { label: 'Secondary', done: secondary.hasPick }
    : { label: slide.prediction.label ?? slide.prediction.eventName, done: !!slide.prediction.predictionMade }),
    [slides, secondary.hasPick]);

  const { ref, props, progressProps, progress, scrollNext, setCarouselData } = useCarousel(slides);

  useEffect(() => {
    setCarouselData(slides);
  }, [slides, setCarouselData]);

  const scrollToIndex = useCallback((index: number, animated = true) => {
    ref.current?.scrollTo({ index, animated });
  }, [ref]);

  // Open on the first unfinished pick, once everything has loaded
  const jumpedToFirstOpen = useRef(false);
  useEffect(() => {
    if (!includeSecondary || jumpedToFirstOpen.current || !ref.current || slides.length < 2) return;
    if (showSecondary && !secondary.loaded) return;
    jumpedToFirstOpen.current = true;
    const firstOpen = steps.findIndex((step) => !step.done);
    if (firstOpen > 0) scrollToIndex(firstOpen, false);
  }, [includeSecondary, ref, slides.length, showSecondary, secondary.loaded, steps, scrollToIndex]);

  if (slides.length === 0) return null;

  // Same two rows as a prediction header (title + points, then timing) so slides line up
  const secondaryHeader = (
    <View className='bg-primary/10 py-2 px-3'>
      <View className='flex-row items-center justify-center gap-2'>
        <Text allowFontScaling={false} className='text-lg font-bold uppercase tracking-wider text-foreground'>
          Secondary Pick
        </Text>
        {secondary.settings && (
          <View className='rounded-md bg-primary/15 px-1.5'>
            <Text allowFontScaling={false} className='text-sm font-bold text-primary'>
              ×{secondary.settings.multiplier}
            </Text>
          </View>
        )}
      </View>
      <View className='h-6 flex-row items-center justify-center'>
        <View className='rounded-sm bg-amber-400 px-1.5'>
          <Text allowFontScaling={false} className='text-xs font-bold uppercase tracking-wider text-black'>
            Weekly
          </Text>
        </View>
      </View>
    </View>
  );

  // Only the secondary pick this week
  if (slides.length === 1 && showSecondary) {
    return (
      <View className='mx-2 mb-2 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
        {secondaryHeader}
        <View className='bg-secondary py-1 px-2'>
          <Text className='text-base font-medium text-foreground text-left leading-none'>
            {secondary.description}
          </Text>
        </View>
        <SecondaryPickForm className='bg-card/50' />
      </View>
    );
  }

  // Single prediction - simpler layout without carousel
  if (slides.length === 1) {
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
          options={getOptions(
            prediction.referenceTypes,
            prediction.eventSource === 'Base' ? prediction.eventName : undefined)}
          wallet={wallet}
          updateBetTotal={updateFormBetValue}
          totalBet={totalBet}
          maxBet={rules?.shauhinMode?.enabled ? rules.shauhinMode.maxBet : undefined} />
      </View>
    );
  }

  // Multiple slides - carousel layout
  const current = Math.round(progress);
  return (
    <View className='gap-2'>
      {includeSecondary && (
        // The current pick is spelled out; the rest shrink to dots, or checks once made
        <View className='flex-row items-center justify-center gap-1.5 px-3'>
          {steps.map((step, index) => {
            const isCurrent = index === current;
            return (
              <Pressable
                key={slides[index]!.key}
                onPress={() => scrollToIndex(index)}
                accessibilityRole='tab'
                accessibilityLabel={`${step.label}${step.done ? ' (done)' : ''}`}
                accessibilityState={{ selected: isCurrent }}
                hitSlop={6}
                className={cn(
                  'items-center justify-center rounded-full',
                  isCurrent
                    ? cn('h-6 max-w-[60%] flex-row gap-1 px-3 text-secondary', step.done ? 'bg-green-600' : 'bg-primary')
                    : 'size-5')}>
                {isCurrent ? (
                  <>
                    {step.done && <Check size={13} strokeWidth={3} color='white' />}
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      className='shrink text-xs font-bold uppercase tracking-wide text-white'>
                      {step.label}
                    </Text>
                  </>
                ) : step.done ? (
                  <View className='size-4 items-center justify-center rounded-full bg-green-600'>
                    <Check size={10} strokeWidth={4} color='white' />
                  </View>
                ) : (
                  <View className='size-2 rounded-full bg-primary/40' />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
      <Carousel
        ref={ref}
        {...props}
        height={rules?.shauhinMode?.enabled && allPredictions.some((p) => p.shauhinEnabled)
          ? 240
          : 200}
        data={slides}
        renderItem={({ item }) => item.kind === 'secondary' ? (
          <View className='mx-2 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
            {secondaryHeader}
            <DescriptionCell label='Secondary Pick' description={secondary.description} />
            <SecondaryPickForm className='bg-card/50 justify-end' />
          </View>
        ) : (
          <View className='mx-2 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
            <View className='bg-primary/10 py-2 px-3'>
              <View className='flex-row items-center justify-center gap-2'>
                <Text
                  allowFontScaling={false}
                  className='text-lg font-bold uppercase tracking-wider text-foreground'>
                  {item.prediction.label}
                </Text>
                <View className='flex-row items-center'>
                  <Text
                    allowFontScaling={false}
                    className='text-base font-bold text-foreground'>{item.prediction.points}</Text>
                  <PointsIcon size={13} color={colors.primary} />
                </View>
              </View>
              <View className='flex-row items-center justify-center gap-0.5 pr-1'>
                <MarqueeText
                  allowFontScaling={false}
                  className='text-base text-muted-foreground'
                  containerClassName='flex-row'
                  text={item.prediction.timing.join(' - ')}
                  noMarqueeContainerClassName='w-min' />
                <PredictionTimingHelp />
              </View>
            </View>

            <DescriptionCell label={item.prediction.label} description={item.prediction.description} />

            <SubmissionCard
              prediction={item.prediction}
              options={getOptions(
                item.prediction.referenceTypes,
                item.prediction.eventSource === 'Base' ? item.prediction.eventName : undefined)}
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
