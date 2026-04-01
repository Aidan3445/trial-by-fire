import { Settings2, Trash2 } from 'lucide-react-native';
import { Text, View, Alert } from 'react-native';
import Button from '~/components/common/button';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import {
  type CustomEventRule,
  type CustomEventRuleInsert,
  CustomEventRuleInsertZod
} from '~/types/leagues';
import CustomEventModal from '~/components/leagues/customization/events/custom/modal';
import { PointsIcon } from '~/components/icons/generated';

interface CustomEventCardProps {
  rule: CustomEventRule;
  locked?: boolean;
  onUpdate: (_rule: CustomEventRuleInsert, _id: number) => Promise<void>;
  onDelete: (_id: number, _eventName: string) => Promise<void>;
  leagueMembers: any;
}

export default function CustomEventCard({
  rule,
  locked,
  onUpdate,
  onDelete,
  leagueMembers
}: CustomEventCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const reactForm = useForm<CustomEventRuleInsert>({
    defaultValues: rule,
    resolver: zodResolver(CustomEventRuleInsertZod)
  });

  const handleSubmit = async () => {
    const data = reactForm.getValues();
    await onUpdate(data, rule.customEventRuleId);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${rule.eventName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void onDelete(rule.customEventRuleId, rule.eventName)
      }
    ]);
  };

  const canEdit = leagueMembers?.loggedIn?.role === 'Owner' && !locked;

  return (
    <View
      className={cn(
        'rounded-lg p-3 border-2',
        locked
          ? 'bg-primary/5 border-primary/10'
          : 'bg-primary/10 border-primary/20'
      )}>
      {/* Header Row */}
      <View className='flex-row items-center justify-between gap-2'>
        <View className='flex-1 flex-row items-center gap-2'>
          <Text className='text-base font-bold uppercase tracking-wider flex-shrink'>
            {rule.eventName}
          </Text>
          <Text className='text-muted-foreground'>•</Text>
          <View className='flex-row items-center'>
            <Text
              className={cn(
                'text-base font-bold',
                rule.points <= 0 ? 'text-destructive' : 'text-positive'
              )}>
              {rule.points}
            </Text>
            <PointsIcon
              size={12}
              color={rule.points <= 0 ? colors.destructive : colors.positive}
            />
          </View>
        </View>
        {canEdit && (
          <View className='flex-row gap-2'>
            <Button onPress={() => setIsEditing(true)}>
              <Settings2 size={24} color={colors.primary} />
            </Button>
            <Button onPress={handleDelete}>
              <Trash2 size={24} color={colors.destructive} />
            </Button>
          </View>
        )}
      </View>

      {/* Prediction Timing */}
      {rule.eventType === 'Prediction' && (
        <Text className='text-sm italic text-muted-foreground'>
          Predictions: {rule.timing.join(', ')}
        </Text>
      )}

      {/* Description */}
      <Text className='text-sm text-muted-foreground' numberOfLines={2}>
        {rule.description}
      </Text>

      {/* Edit Modal */}
      <CustomEventModal
        type='Edit'
        isVisible={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleSubmit}
        reactForm={reactForm}
      />
    </View>
  );
}
