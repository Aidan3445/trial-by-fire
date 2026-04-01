import { View, Text } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { type LivePredictionWithOptions } from '~/types/events';
import StatusBadge from '~/components/livePredictions/play/card/status';
import OptionRow from '~/components/livePredictions/play/card/option';

interface PredictionCardProps {
  prediction: LivePredictionWithOptions;
  onRespond: (_optionId: number) => void;
  isSubmitting: boolean;
}

export default function PredictionCard({ prediction, onRespond, isSubmitting }: PredictionCardProps) {
  const { status, paused, options, title, description, userResponse } = prediction;
  const totalResponses = prediction.responses.length;
  const isOpen = status === 'Open' && !paused;
  const isResolved = status === 'Resolved';
  const isClosed = status === 'Closed';
  const userOptionId = userResponse?.optionId;

  // Check if user got it right
  const userCorrect = isResolved && userResponse
    ? options.find((o) => o.livePredictionOptionId === userOptionId)?.isCorrect === true
    : null;

  return (
    <View className={cn(
      'rounded-xl border-2 bg-card p-3 gap-3',
      isOpen ? 'border-amber-500/30' : isResolved ? 'border-primary/20' : 'border-primary/10'
    )}>
      {/* Header */}
      <View className='flex-row items-start justify-between gap-2'>
        <View className='flex-1 gap-0.5'>
          <Text className='text-base font-bold text-foreground'>{title}</Text>
          {description && (
            <Text className='text-sm text-muted-foreground'>{description}</Text>
          )}
        </View>
        <StatusBadge isOpen={isOpen} isClosed={isClosed} isResolved={isResolved} />
      </View>

      {/* User result banner */}
      {isResolved && userResponse && (
        <View className={cn(
          'flex-row items-center gap-2 rounded-lg px-3 py-2',
          userCorrect ? 'bg-positive/10 border border-positive/20' : 'bg-destructive/10 border border-destructive/20'
        )}>
          {userCorrect
            ? <Check size={16} color={colors.positive} />
            : <X size={16} color={colors.destructive} />}
          <Text className={cn(
            'text-sm font-bold',
            userCorrect ? 'text-positive' : 'text-destructive'
          )}>
            {userCorrect ? 'You got it!' : 'Not this time'}
          </Text>
        </View>
      )}

      {/* Options */}
      <View className='gap-1.5'>
        {options.map((opt) => {
          const responseCount = prediction.responses.filter(
            (r) => r.optionId === opt.livePredictionOptionId
          ).length;
          const pct = totalResponses > 0 ? Math.round((responseCount / totalResponses) * 100) : 0;
          const isSelected = userOptionId === opt.livePredictionOptionId;
          const isCorrectOption = opt.isCorrect === true;
          const showResults = isResolved || (isClosed && !!userResponse);

          return (
            <OptionRow
              key={opt.livePredictionOptionId}
              label={opt.label}
              isSelected={isSelected}
              isCorrectOption={isResolved ? isCorrectOption : false}
              showResults={showResults}
              pct={pct}
              responseCount={responseCount}
              isOpen={isOpen}
              disabled={isSubmitting || !isOpen || !!userResponse}
              onPress={() => onRespond(opt.livePredictionOptionId)} />
          );
        })}
      </View>

      {/* Footer */}
      <View className='flex-row items-center justify-between px-1'>
        <Text className='text-sm text-muted-foreground'>
          {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
        </Text>
        {isOpen && !userResponse && (
          <Text className='text-sm font-semibold text-amber-500'>
            Pick one!
          </Text>
        )}
        {isOpen && userResponse && (
          <Text className='text-sm text-muted-foreground'>
            Locked in ✓
          </Text>
        )}
      </View>
    </View>
  );
}
