import { type ReactNode } from 'react';
import { ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type SurveyAnswersState, type SurveySeason } from '~/hooks/user/useSurveyAnswers';
import {
  MoreModesOptions,
  PlayAgainOptions,
  SURVEY_COMMENTS_MAX_LENGTH,
  SURVEY_EMAIL_MAX_LENGTH,
  SURVEY_RATING_MAX,
  SURVEY_RATING_MIN,
} from '~/types/survey';

const RATINGS = Array.from(
  { length: SURVEY_RATING_MAX - SURVEY_RATING_MIN + 1 },
  (_, i) => SURVEY_RATING_MIN + i
);

interface SeasonSurveyProps {
  season: SurveySeason;
  answers: SurveyAnswersState;
  finishing: boolean;
  onFinish: () => void;
}

function Question({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className='gap-1.5'>
      <Text className='text-sm font-semibold text-foreground'>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, selected, onPress, className }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Button
      onPress={onPress}
      className={cn(
        'items-center justify-center rounded-md border-2 py-1.5',
        selected ? 'border-primary bg-primary' : 'border-primary/20 bg-primary/5',
        className
      )}>
      <Text
        allowFontScaling={false}
        className={cn('text-sm font-semibold', selected ? 'text-primary-foreground' : 'text-foreground')}>
        {label}
      </Text>
    </Button>
  );
}

/**
 * End of season survey. Every question is optional and saves as it's answered.
 */
export default function SeasonSurvey({ season, answers, finishing, onFinish }: SeasonSurveyProps) {
  const { height } = useWindowDimensions();
  const { choices, text, emailError, setChoice, setText, saveText } = answers;

  const ratingRow = (field: 'seasonRating' | 'appRating') => (
    <View className='flex-row gap-1'>
      {RATINGS.map((rating) => (
        <Chip
          key={rating}
          label={String(rating)}
          selected={choices[field] === rating}
          onPress={() => setChoice(field, rating)}
          className='flex-1' />
      ))}
    </View>
  );

  return (
    <View className='gap-3'>
      <View className='gap-1'>
        <Text className='text-lg font-bold text-foreground'>How was {season.name}?</Text>
        <Text className='text-sm text-muted-foreground'>A few quick questions, all optional.</Text>
      </View>

      <ScrollView
        style={{ maxHeight: height * 0.55 }}
        contentContainerStyle={{ gap: 16 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}>
        <Question label='How much did you enjoy this season of Survivor?'>
          {ratingRow('seasonRating')}
        </Question>
        <Question label='How much did you enjoy playing Trial by Fire along with it?'>
          {ratingRow('appRating')}
        </Question>
        <Question label='Will you play again next season?'>
          <View className='flex-row flex-wrap gap-1.5'>
            {PlayAgainOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={choices.playAgain === option}
                onPress={() => setChoice('playAgain', option)}
                className='px-3' />
            ))}
          </View>
        </Question>
        <Question label='Interested in new league or game modes next season?'>
          <View className='flex-row flex-wrap gap-1.5'>
            {MoreModesOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={choices.moreModes === option}
                onPress={() => setChoice('moreModes', option)}
                className='px-3' />
            ))}
          </View>
        </Question>
        <Question label='Email, if you’d like us to follow up'>
          <TextInput
            className={cn(
              'rounded-lg border-2 bg-card px-2 py-1.5 text-base leading-5',
              emailError ? 'border-destructive' : 'border-primary/20'
            )}
            placeholder='you@example.com'
            placeholderTextColor={colors.mutedForeground}
            value={text.email}
            onChangeText={(value) => setText('email', value)}
            onBlur={() => saveText('email')}
            maxLength={SURVEY_EMAIL_MAX_LENGTH}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            autoComplete='email'
            textContentType='emailAddress' />
          {emailError && <Text className='text-xs text-destructive'>{emailError}</Text>}
        </Question>
        <Question label='Anything else for the developer?'>
          <TextInput
            className='min-h-20 rounded-lg border-2 border-primary/20 bg-card px-2 py-1.5 text-base leading-5'
            placeholder='Ideas, bugs, anything'
            placeholderTextColor={colors.mutedForeground}
            value={text.comments}
            onChangeText={(value) => setText('comments', value)}
            onBlur={() => saveText('comments')}
            maxLength={SURVEY_COMMENTS_MAX_LENGTH}
            multiline
            textAlignVertical='top' />
        </Question>
      </ScrollView>

      <Button
        onPress={onFinish}
        disabled={finishing}
        className='w-full rounded-lg bg-primary px-4 py-3'>
        <Text className='text-center text-base font-semibold text-primary-foreground'>
          {finishing ? 'Saving...' : 'Done'}
        </Text>
      </Button>
      <Button onPress={onFinish} disabled={finishing} className='self-center pt-1'>
        <Text className='text-center text-xs text-muted-foreground'>No thanks</Text>
      </Button>
    </View>
  );
}
