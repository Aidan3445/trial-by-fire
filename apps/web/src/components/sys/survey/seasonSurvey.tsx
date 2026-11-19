'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '~/components/common/button';
import { Input } from '~/components/common/input';
import { Textarea } from '~/components/common/textarea';
import { cn } from '~/lib/utils';
import {
  isValidEmail, MoreModesOptions, PlayAgainOptions, SURVEY_COMMENTS_MAX_LENGTH, SURVEY_EMAIL_MAX_LENGTH,
  SURVEY_RATING_MAX, SURVEY_RATING_MIN, type SurveyAnswers, type SurveyFinishResult,
} from '~/types/survey';

// Typing pauses this long before a text answer saves
const TEXT_SAVE_DELAY_MS = 800;
const RATINGS = Array.from({ length: SURVEY_RATING_MAX - SURVEY_RATING_MIN + 1 }, (_, i) => i + SURVEY_RATING_MIN);

async function saveAnswers(seasonId: number, answers: SurveyAnswers) {
  const res = await fetch('/api/survey', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seasonId, ...answers }),
  });
  if (!res.ok) console.error('Failed to save survey answer', await res.text());
}

function Question({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className='space-y-1.5'>
      <p className='text-sm font-semibold'>{label}</p>
      {children}
    </div>
  );
}

interface ChoicesProps<T extends string | number> {
  options: readonly T[];
  value: T | null;
  onChange: (_value: T | null) => void;
  compact?: boolean;
}

function Choices<T extends string | number>({ options, value, onChange, compact }: ChoicesProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', compact && 'grid grid-cols-10 gap-1')}>
      {options.map((option) => (
        <button
          key={option}
          type='button'
          // Tapping the picked answer again clears it
          onClick={() => onChange(value === option ? null : option)}
          className={cn(
            'cursor-pointer rounded-md border-2 text-xs font-bold transition-colors',
            compact ? 'py-1.5' : 'px-2.5 py-1',
            value === option
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-accent border-primary/20 hover:border-primary/50')}>
          {option}
        </button>
      ))}
    </div>
  );
}

interface SeasonSurveyProps {
  seasonId: number;
  seasonName: string;
  onFinish: (_result: SurveyFinishResult) => void;
}

/**
  * Short, all optional end of season feedback. Each answer saves as soon as
  * it's picked; finishing decides whether to ask for a donation next.
  */
export default function SeasonSurvey({ seasonId, seasonName, onFinish }: SeasonSurveyProps) {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [emailTouched, setEmailTouched] = useState(false);
  const [finishing, setFinishing] = useState(false);
  // Text answers waiting on a pause in typing
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; answers: SurveyAnswers } | null>(null);
  // Saves run one at a time, so a quick change of mind can't land before the first pick
  const saves = useRef<Promise<void>>(Promise.resolve());

  const save = useCallback((update: SurveyAnswers) => {
    saves.current = saves.current
      .then(() => saveAnswers(seasonId, update))
      .catch((e) => console.error('Failed to save survey answer', e));
  }, [seasonId]);

  const flush = useCallback(() => {
    if (!pending.current) return;
    clearTimeout(pending.current.timer);
    save(pending.current.answers);
    pending.current = null;
  }, [save]);

  const saveLater = (update: SurveyAnswers) => {
    const merged = { ...pending.current?.answers, ...update };
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = { answers: merged, timer: setTimeout(flush, TEXT_SAVE_DELAY_MS) };
  };

  useEffect(() => () => flush(), [flush]);

  const pick = <K extends keyof SurveyAnswers>(key: K) => (value: SurveyAnswers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    save({ [key]: value });
  };

  const email = answers.email ?? '';
  const emailInvalid = email.trim() !== '' && !isValidEmail(email);
  const onEmailChange = (value: string) => {
    setAnswers((current) => ({ ...current, email: value }));
    if (value.trim() === '') saveLater({ email: null });
    else if (isValidEmail(value)) saveLater({ email: value.trim() });
    else if (pending.current) {
      // Don't save a half typed address
      const rest = { ...pending.current.answers };
      delete rest.email;
      pending.current.answers = rest;
    }
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    flush();
    try {
      await saves.current;
      const res = await fetch('/api/survey/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId }),
      });
      onFinish(res.ok ? await res.json() as SurveyFinishResult : { askDonation: false });
    } catch (e) {
      console.error('Failed to finish survey', e);
      onFinish({ askDonation: false });
    }
  };

  const linkClass = 'cursor-pointer text-muted-foreground text-xs hover:text-foreground transition-colors';
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        <h2 className='text-lg font-bold'>How was {seasonName}?</h2>
        <p className='text-muted-foreground text-sm'>
          A few quick questions to help improve Trial by Fire for next season. Answer as many as you like.
        </p>
      </div>
      <div className='space-y-4 max-h-[55svh] overflow-y-auto pr-1'>
        <Question label='How much did you enjoy this season of Survivor?'>
          <Choices compact options={RATINGS} value={answers.seasonRating ?? null} onChange={pick('seasonRating')} />
        </Question>
        <Question label='How much did you enjoy playing Trial by Fire along with it?'>
          <Choices compact options={RATINGS} value={answers.appRating ?? null} onChange={pick('appRating')} />
        </Question>
        <Question label='Will you play again next season?'>
          <Choices options={PlayAgainOptions} value={answers.playAgain ?? null} onChange={pick('playAgain')} />
        </Question>
        <Question label='Interested in new league or game modes next season?'>
          <Choices options={MoreModesOptions} value={answers.moreModes ?? null} onChange={pick('moreModes')} />
        </Question>
        <Question label='Email, if you’d like us to follow up'>
          <Input
            type='email'
            placeholder='you@example.com'
            maxLength={SURVEY_EMAIL_MAX_LENGTH}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => {
              setEmailTouched(true);
              flush();
            }} />
          {emailTouched && emailInvalid && (
            <p className='text-destructive text-xs'>That doesn’t look like an email address.</p>
          )}
        </Question>
        <Question label='Anything else for the developer?'>
          <Textarea
            rows={3}
            maxLength={SURVEY_COMMENTS_MAX_LENGTH}
            value={answers.comments ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setAnswers((current) => ({ ...current, comments: value }));
              saveLater({ comments: value.trim() === '' ? null : value });
            }}
            onBlur={flush} />
        </Question>
      </div>
      <div className='flex flex-col gap-2'>
        <Button
          className='w-full'
          disabled={finishing || (emailTouched && emailInvalid)}
          onClick={() => void finish()}>
          Done
        </Button>
        <button className={cn(linkClass, 'pt-1')} disabled={finishing} onClick={() => void finish()}>
          No thanks
        </button>
      </div>
    </div>
  );
}
