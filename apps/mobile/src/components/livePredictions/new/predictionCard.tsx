import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Check, Pause, Play, Trash2, Lock } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LivePredictionWithOptions } from '~/types/events';

interface LivePredictionCardProps {
  prediction: LivePredictionWithOptions;
}

export default function LivePredictionCard({ prediction }: LivePredictionCardProps) {
  const patchData = useFetch('PATCH');
  const deleteData = useFetch('DELETE');
  const queryClient = useQueryClient();
  const [resolving, setResolving] = useState(false);
  const [selectedCorrect, setSelectedCorrect] = useState<Set<number>>(new Set());

  const { status, paused, options, responses, title, description } = prediction;
  const totalResponses = responses.length;

  const statusColor = paused
    ? 'text-amber-500'
    : status === 'Open'
      ? 'text-positive'
      : status === 'Closed'
        ? 'text-blue-500'
        : 'text-muted-foreground';

  const statusBorder = paused
    ? 'border-amber-500/20'
    : status === 'Open'
      ? 'border-positive/20'
      : status === 'Closed'
        ? 'border-blue-500/20'
        : 'border-primary/20';

  const statusLabel = paused ? 'Paused' : status;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['livePredictions'] });

  const handleAction = (action: 'close' | 'togglePause', confirmMsg?: string) => {
    const doAction = () => {
      void (async () => {
        const res = await patchData(`/api/live/${prediction.livePredictionId}`, {
          body: { action },
        });
        if (!res.ok) Alert.alert('Error', 'Action failed');
        await invalidate();
      })();
    };

    if (confirmMsg) {
      Alert.alert('Confirm', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: doAction },
      ]);
    } else {
      doAction();
    }
  };

  const handleResolve = () => {
    void (async () => {
      const res = await patchData(`/api/live/${prediction.livePredictionId}`, {
        body: {
          action: 'resolve',
          correctOptionIds: Array.from(selectedCorrect),
        },
      });
      if (!res.ok) {
        Alert.alert('Error', 'Failed to resolve');
        return;
      }
      setResolving(false);
      await invalidate();
    })();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Prediction',
      'This will permanently delete this prediction and all responses. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteData(`/api/live/${prediction.livePredictionId}`);
              await invalidate();
            })();
          },
        },
      ]
    );
  };

  const toggleCorrectOption = (optionId: number) => {
    setSelectedCorrect((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  };

  return (
    <View className={cn('rounded-xl border-2 bg-card p-2 gap-2', statusBorder)}>
      {/* Header */}
      <View className='flex-row items-start justify-between px-1'>
        <View className='flex-1 gap-0.5'>
          <Text className='text-base font-bold text-foreground'>{title}</Text>
          {description && (
            <Text className='text-sm text-muted-foreground'>{description}</Text>
          )}
        </View>
        <View className='flex-row items-center gap-1'>
          <Text className={cn('text-sm font-bold uppercase', statusColor)}>
            {statusLabel}
          </Text>
          <Text className='text-sm text-muted-foreground'>
            · {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
          </Text>
        </View>
      </View>

      {/* Options with response counts */}
      <View className='gap-1'>
        {options.map((opt) => {
          const responseCount = responses.filter((r) => r.optionId === opt.livePredictionOptionId).length;
          const pct = totalResponses > 0 ? Math.round((responseCount / totalResponses) * 100) : 0;
          const isCorrect = opt.isCorrect === true;
          const isIncorrect = opt.isCorrect === false;
          const isSelectedCorrect = selectedCorrect.has(opt.livePredictionOptionId);

          return (
            <Pressable
              key={opt.livePredictionOptionId}
              onPress={resolving ? () => toggleCorrectOption(opt.livePredictionOptionId) : undefined}
              className={cn(
                'flex-row items-center justify-between rounded-lg px-3 py-2',
                isCorrect && 'bg-positive/10 border border-positive/30',
                isIncorrect && 'bg-primary/5 border border-primary/10',
                !isCorrect && !isIncorrect && 'bg-primary/5 border border-primary/10',
                resolving && isSelectedCorrect && 'bg-positive/20 border-positive/40',
                resolving && 'active:opacity-80',
              )}>
              <View className='flex-row items-center gap-2 flex-1'>
                {resolving && (
                  <View className={cn(
                    'w-5 h-5 rounded-full border-2 items-center justify-center',
                    isSelectedCorrect
                      ? 'bg-positive border-positive'
                      : 'border-muted-foreground'
                  )}>
                    {isSelectedCorrect && <Check size={12} color='white' />}
                  </View>
                )}
                {isCorrect && !resolving && (
                  <Check size={14} color={colors.positive} />
                )}
                <Text className={cn(
                  'text-base',
                  isCorrect ? 'font-bold text-positive' : 'text-foreground'
                )}>
                  {opt.label}
                </Text>
              </View>
              <Text className='text-sm text-muted-foreground'>
                {responseCount} ({pct}%)
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Resolve mode confirmation */}
      {resolving && (
        <View className='flex-row gap-2'>
          <Pressable
            onPress={() => { setResolving(false); setSelectedCorrect(new Set()); }}
            className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-2.5 active:opacity-80'>
            <Text className='text-center font-semibold text-foreground'>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleResolve}
            className='flex-1 rounded-lg bg-positive p-2.5 active:opacity-80'>
            <Text className='text-center font-semibold text-white'>
              Confirm{selectedCorrect.size === 0 ? ' (None Correct)' : ` (${selectedCorrect.size})`}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Action buttons */}
      {!resolving && (
        <View className='flex-row gap-2 px-1'>
          {/* Open predictions: close or pause */}
          {status === 'Open' && (
            <>
              <ActionButton
                icon={paused ? Play : Pause}
                label={paused ? 'Resume' : 'Pause'}
                color={'#f59e0b'}
                onPress={() => handleAction('togglePause')} />
              <ActionButton
                icon={Lock}
                label='Close'
                color={'#3b82f6'}
                onPress={() => handleAction('close', 'Close this prediction? No more responses will be accepted.')} />
            </>
          )}

          {/* Closed predictions: resolve, pause, or delete */}
          {status === 'Closed' && (
            <>
              <ActionButton
                icon={Check}
                label='Resolve'
                color={colors.positive!}
                onPress={() => setResolving(true)} />
              <ActionButton
                icon={paused ? Play : Pause}
                label={paused ? 'Show' : 'Hide'}
                color={'#f59e0b'}
                onPress={() => handleAction('togglePause')} />
            </>
          )}

          {/* Any status: delete */}
          <ActionButton
            icon={Trash2}
            label='Delete'
            color={colors.destructive!}
            onPress={handleDelete} />
        </View>
      )}
    </View>
  );
}

function ActionButton({
  icon: Icon,
  label,
  color,
  onPress,
}: {
  icon: typeof Check;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className='flex-row items-center gap-1 rounded-lg border-2 border-primary/10 px-2.5 py-1.5 active:opacity-70'>
      <Icon size={14} color={color} />
      <Text className='text-sm font-semibold' style={{ color }}>{label}</Text>
    </Pressable>
  );
}
