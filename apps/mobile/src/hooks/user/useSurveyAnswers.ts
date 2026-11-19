import { useCallback, useRef, useState } from 'react';
import { useFetch } from '~/hooks/helpers/useFetch';
import { isValidEmail, type MoreModes, type PlayAgain, type SurveyAnswers } from '~/types/survey';

const TEXT_SAVE_DELAY_MS = 800;

export type SurveySeason = { seasonId: number; name: string };

type Choices = {
  seasonRating: number | null;
  appRating: number | null;
  playAgain: PlayAgain | null;
  moreModes: MoreModes | null;
};
export type ChoiceField = keyof Choices;
export type TextField = 'email' | 'comments';

const EMPTY_CHOICES: Choices = { seasonRating: null, appRating: null, playAgain: null, moreModes: null };
const EMPTY_TEXT: Record<TextField, string> = { email: '', comments: '' };
const EMPTY_SAVED: Record<TextField, string | null> = { email: null, comments: null };

/**
 * Survey answers, each saved as soon as it's picked. Text saves after a pause in
 * typing and on blur; call `flush` before finishing to send anything pending.
 * @param seasonId The season the survey is about
 */
export function useSurveyAnswers(seasonId: number | null) {
  const putData = useFetch('PUT');
  const putRef = useRef(putData);
  putRef.current = putData;
  const seasonRef = useRef(seasonId);
  seasonRef.current = seasonId;

  const [choices, setChoices] = useState<Choices>(EMPTY_CHOICES);
  const [text, setTextState] = useState(EMPTY_TEXT);
  const [emailError, setEmailError] = useState<string | null>(null);
  const choicesRef = useRef(choices);
  const textRef = useRef(text);
  const savedText = useRef(EMPTY_SAVED);
  // eslint-disable-next-line no-undef
  const timers = useRef<Partial<Record<TextField, ReturnType<typeof setTimeout>>>>({});
  // Saves run one at a time, so a quick change of mind can't land before the first pick
  const queue = useRef<Promise<void>>(Promise.resolve());

  const save = useCallback((update: SurveyAnswers) => {
    const id = seasonRef.current;
    if (id === null) return;
    queue.current = queue.current
      .then(() => putRef.current('/api/survey', { body: { seasonId: id, ...update } }))
      .then((res) => {
        if (!res.ok) console.error('Failed to save survey answer', res.status);
      })
      .catch((error) => console.error('Failed to save survey answer', error));
  }, []);

  const saveText = useCallback((field: TextField) => {
    // eslint-disable-next-line no-undef
    clearTimeout(timers.current[field]);
    delete timers.current[field];
    const trimmed = textRef.current[field].trim();
    if (field === 'email') {
      if (trimmed && !isValidEmail(trimmed)) {
        setEmailError('Enter a valid email');
        return;
      }
      setEmailError(null);
    }
    const value = trimmed || null;
    if (value === savedText.current[field]) return;
    savedText.current = { ...savedText.current, [field]: value };
    save({ [field]: value } as SurveyAnswers);
  }, [save]);

  const setText = useCallback((field: TextField, value: string) => {
    textRef.current = { ...textRef.current, [field]: value };
    setTextState(textRef.current);
    if (field === 'email' && (!value.trim() || isValidEmail(value))) setEmailError(null);
    // eslint-disable-next-line no-undef
    clearTimeout(timers.current[field]);
    // eslint-disable-next-line no-undef
    timers.current[field] = setTimeout(() => saveText(field), TEXT_SAVE_DELAY_MS);
  }, [saveText]);

  // Tapping the picked answer again clears it
  const setChoice = useCallback(<F extends ChoiceField>(field: F, value: NonNullable<Choices[F]>) => {
    const next = choicesRef.current[field] === value ? null : value;
    choicesRef.current = { ...choicesRef.current, [field]: next };
    setChoices(choicesRef.current);
    save({ [field]: next } as SurveyAnswers);
  }, [save]);

  const flush = useCallback(async () => {
    (Object.keys(timers.current) as TextField[]).forEach(saveText);
    await queue.current;
  }, [saveText]);

  const reset = useCallback(() => {
    // eslint-disable-next-line no-undef
    Object.values(timers.current).forEach((timer) => clearTimeout(timer));
    timers.current = {};
    choicesRef.current = EMPTY_CHOICES;
    textRef.current = EMPTY_TEXT;
    savedText.current = EMPTY_SAVED;
    setChoices(EMPTY_CHOICES);
    setTextState(EMPTY_TEXT);
    setEmailError(null);
  }, []);

  return { choices, text, emailError, setChoice, setText, saveText, flush, reset };
}

export type SurveyAnswersState = ReturnType<typeof useSurveyAnswers>;
