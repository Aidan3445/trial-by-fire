'use client';

import { cn } from '~/lib/utils';
import { type CarouselApi, CoverCarousel } from '~/components/common/carousel';
import PredictionTimingHelp from '~/components/leagues/actions/events/predictions/timingHelp';
import SubmissionCard, { BaseSubmissionCard } from '~/components/leagues/actions/events/predictions/submission';
import { BaseEventDescriptions, BaseEventFullName, BasePredictionReferenceTypes } from '~/lib/events';
import { type MakePredictionsProps } from '~/components/leagues/actions/events/predictions/view';
import { type ScoringBaseEventName, type ReferenceType, type MakePrediction } from '~/types/events';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShauhinActive } from '~/hooks/leagues/enrich/useShauhinActive';
import { useLeague } from '~/hooks/leagues/useLeague';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { loadOverrideConfig } from '~/lib/devEpisodeOverride';
import { PointsIcon } from '~/components/icons/generated';
import { Check } from 'lucide-react';
import { FOCUS_SECONDARY_PICK_EVENT, useSecondaryPick } from '~/hooks/leagues/enrich/useSecondaryPick';
import SecondaryPickForm from '~/components/leagues/hub/picks/secondaryPick/form';

export default function PredictionCards({
  rules,
  predictionsMade,
  castaways,
  tribes,
  wallet,
  totalBet,
  setBetTotal,
  className,
  includeSecondary
}: MakePredictionsProps) {
  const { enabled: devConfig } = loadOverrideConfig() ?? {};
  const shauhinActive = useShauhinActive();
  const { data: league } = useLeague();
  const { data: seasonCastaways } = useCastaways(league?.seasonId ?? null);

  const enabledBasePredictions = useMemo(() =>
    Object.entries(rules?.basePrediction ?? {})
      .filter(([_, rule]) => rule.enabled)
      .map(([baseEventName, rule]) => {
        const eventName = baseEventName as ScoringBaseEventName;
        const fullName = BaseEventFullName[baseEventName as ScoringBaseEventName] ?? baseEventName;
        const prediction: MakePrediction = {
          eventSource: 'Base' as const,
          eventName: eventName,
          label: fullName,
          description: `${BaseEventDescriptions.prediction[eventName]} \
            ${BaseEventDescriptions.italics[eventName] ?? ''}`,
          points: rule.points,
          referenceTypes: BasePredictionReferenceTypes[eventName],
          timing: rule.timing,
          predictionMade: predictionsMade.find((pred) =>
            pred.eventName === eventName) ?? null,
          shauhinEnabled: shauhinActive &&
            rules?.shauhinMode?.enabled &&
            rules.shauhinMode.enabledBets.includes(eventName)
        };
        return prediction;
      }),
    [rules, predictionsMade, shauhinActive]);

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
        predictionMade: predictionsMade.find((pred) =>
          pred.eventName === rule.eventName) ?? null,
      })) ?? [], [rules, predictionsMade]);

  const getOptions = useCallback((referenceTypes: ReferenceType[], eventName?: string) => {
    const options: Record<ReferenceType | 'Direct Castaway', Record<string, {
      id: number,
      color: string,
      tribeName?: string
    }>> = {
      'Castaway': {},
      'Tribe': {},
      'Direct Castaway': {}
    };

    const castawayKey = (referenceTypes.length === 0 || referenceTypes.includes('Castaway')) ?
      'Castaway' : 'Direct Castaway';

    // Tribes with someone still in the game; an empty tribe can't be predicted
    const activeTribes = new Set<string>();
    castaways.forEach((castaway) => {
      if (!devConfig && castaway.eliminatedEpisode
        && !castaway.redemption?.some((r) => r.secondEliminationEpisode === null)) return;
      const tribe = castaway.tribe;
      if (tribe) activeTribes.add(tribe.name);
      options[castawayKey][castaway.fullName] = {
        id: castaway.castawayId,
        color: tribe?.color ?? '#AAAAAA',
        tribeName: tribe?.name ?? 'No Tribe'
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
            color: tribe.tribeColor
          };
        });
    }
    return options;
  }, [castaways, tribes, devConfig, seasonCastaways]);

  const [formBetValues, setFormBetValues] = useState<Record<string, number>>({});
  const updateFormBetValue = useCallback((eventName: string, bet: number) => {
    setFormBetValues((prev) => ({ ...prev, [eventName]: bet }));
  }, []);

  useEffect(() => {
    if (!setBetTotal) return;

    const totalBet = Object.values(formBetValues).reduce((sum, val) => sum + val, 0);
    setBetTotal(totalBet);
  }, [formBetValues, setBetTotal]);

  const secondary = useSecondaryPick();
  const showSecondary = !!includeSecondary && secondary.active;
  const allPredictions = useMemo(() =>
    [...enabledBasePredictions, ...customPredictions], [enabledBasePredictions, customPredictions]);

  const steps = useMemo(() => [
    ...allPredictions.map((prediction) => ({
      label: prediction.label ?? prediction.eventName,
      done: !!prediction.predictionMade,
    })),
    ...(showSecondary ? [{ label: 'Secondary Pick', done: secondary.hasPick }] : []),
  ], [allPredictions, showSecondary, secondary.hasPick]);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => void api.off('select', onSelect);
  }, [api]);

  // Open on the first unfinished pick, once everything has loaded
  const jumpedToFirstOpen = useRef(false);
  useEffect(() => {
    if (!includeSecondary || !api || jumpedToFirstOpen.current) return;
    if (showSecondary && !secondary.loaded) return;
    jumpedToFirstOpen.current = true;
    const firstOpen = steps.findIndex((step) => !step.done);
    if (firstOpen > 0) api.scrollTo(firstOpen);
  }, [includeSecondary, api, showSecondary, secondary.loaded, steps]);

  // The missing-pick banner asks for the secondary slide
  useEffect(() => {
    if (!api || !showSecondary) return;
    const focus = () => api.scrollTo(steps.length - 1);
    window.addEventListener(FOCUS_SECONDARY_PICK_EVENT, focus);
    return () => window.removeEventListener(FOCUS_SECONDARY_PICK_EVENT, focus);
  }, [api, showSecondary, steps.length]);

  if (steps.length === 0) return null;

  const secondaryHeader = (
    <span className='flex gap-2 items-center justify-center'>
      <h3 className='text-lg text-nowrap font-bold uppercase tracking-wider text-card-foreground'>
        Secondary Pick
      </h3>
      <span className='text-xs font-bold uppercase tracking-wider rounded-sm px-1.5 py-0.5 bg-amber-400 text-black'>
        Weekly
      </span>
    </span>
  );
  const secondaryDescription = (
    <p className='text-sm px-2 py-2 bg-secondary font-medium whitespace-normal'>{secondary.description}</p>
  );

  if (steps.length === 1) {
    if (showSecondary) {
      return (
        <article className={cn(
          'flex flex-col mx-2 text-center bg-accent/50 rounded-lg overflow-clip mb-2 border-2 border-primary/20 relative z-10 mt-4',
          className
        )}>
          <div className='py-1'>{secondaryHeader}</div>
          {secondaryDescription}
          <SecondaryPickForm />
        </article>
      );
    }
    const prediction = allPredictions[0]!;
    return (
      <article className={cn(
        'flex flex-col mx-2 text-center bg-accent/50 rounded-lg overflow-clip mb-2 border-2 border-primary/20 relative z-10 mt-4',
        className
      )}>
        <span className='flex gap-2 items-center justify-center'>
          <h3 className='text-lg text-nowrap font-bold uppercase tracking-wider text-card-foreground'>
            {prediction.label}
          </h3>
          <div className='inline-flex items-center'>
            <p className='text-sm font-bold'>{prediction.points}</p>
            <PointsIcon size={16} className='fill-primary' />
          </div>
        </span>
        <div className='flex text-xs font-medium text-card-foreground justify-center items-center gap-1 mb-1'>
          {prediction.timing.join(' - ')}
          <PredictionTimingHelp />
        </div>
        <p className='text-sm px-2 py-2 bg-secondary font-medium'>{prediction.description}</p>
        <BaseSubmissionCard
          prediction={prediction}
          options={getOptions(
            prediction.referenceTypes,
            prediction.eventSource === 'Base' ? prediction.eventName : undefined)}
          wallet={wallet}
          updateBetTotal={updateFormBetValue}
          totalBet={totalBet}
          maxBet={rules?.shauhinMode?.enabled ? rules.shauhinMode.maxBet : undefined} />
      </article>
    );
  }

  const predictionItems = allPredictions
    .map((prediction) => ({
      header: (
        <div>
          <h3 className='text-lg text-nowrap font-bold uppercase tracking-wider text-card-foreground'>
            {prediction.label ?? prediction.eventName}
            <span className='ml-2 inline-flex items-center'>
              <p className='text-sm font-bold'>{prediction.points}</p>
              <PointsIcon size={16} className='fill-primary' />
            </span>
          </h3>
          <div className='flex text-xs font-medium text-card-foreground justify-center items-center gap-1 mb-1'>
            {prediction.timing.join(' - ')}
            <PredictionTimingHelp />
          </div>
        </div>
      ),
      content: (
        <p className='text-sm bg-secondary py-2 px-2 font-medium'>{prediction.description}</p>
      ),
      footer: (
        <SubmissionCard
          prediction={prediction}
          options={getOptions(
            prediction.referenceTypes,
            prediction.eventSource === 'Base' ? prediction.eventName : undefined)}
          wallet={wallet}
          updateBetTotal={updateFormBetValue}
          totalBet={totalBet}
          maxBet={rules?.shauhinMode?.enabled ? rules.shauhinMode.maxBet : undefined} />
      ),
    }));

  if (showSecondary) {
    predictionItems.push({
      header: <div className='pb-1'>{secondaryHeader}</div>,
      content: secondaryDescription,
      footer: <SecondaryPickForm className='bg-b2' />,
    });
  }

  return (
    <span className={cn('w-full', className)}>
      {includeSecondary && (
        <PicksRail steps={steps} current={current} onSelect={(index) => api?.scrollTo(index)} />
      )}
      <CoverCarousel items={predictionItems} onApi={setApi} />
    </span>
  );
}

interface PicksRailProps {
  steps: { label: string; done: boolean }[];
  current: number;
  onSelect: (_index: number) => void;
}

/** The current pick is spelled out; the rest shrink to dots, or checks once made. Tap any to jump to it. */
function PicksRail({ steps, current, onSelect }: PicksRailProps) {
  return (
    <div className='flex items-center justify-center gap-1.5 px-4 pb-3' role='tablist' aria-label='Weekly picks'>
      {steps.map((step, index) => {
        const isCurrent = index === current;
        return (
          <button
            key={step.label}
            type='button'
            role='tab'
            aria-selected={isCurrent}
            aria-label={`${step.label}${step.done ? ' (done)' : ''}`}
            title={step.label}
            onClick={() => onSelect(index)}
            className={cn(
              'flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer',
              isCurrent
                ? cn('h-6 min-w-0 max-w-[60%] gap-1 px-3',
                  step.done ? 'bg-green-600 text-white' : 'bg-primary text-primary-foreground')
                : 'size-5 shrink-0 hover:bg-primary/10')}>
            {isCurrent ? (
              <>
                {step.done && <Check className='size-3.5 shrink-0 stroke-white' strokeWidth={3} />}
                <span className='truncate text-xs font-bold uppercase tracking-wide text-white'>{step.label}</span>
              </>
            ) : step.done ? (
              <span className='flex size-4 items-center justify-center rounded-full bg-green-600 text-white'>
                <Check className='size-2.5 stroke-white' strokeWidth={4} />
              </span>
            ) : (
              <span className='size-2 rounded-full bg-primary/40' />
            )}
          </button>
        );
      })}
    </div>
  );
}
