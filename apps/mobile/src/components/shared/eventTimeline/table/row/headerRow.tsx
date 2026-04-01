import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';

interface SectionSpacerProps {
  label: string;
  onSectionLayout?: (_label: string, _y: number) => void;
  edit?: boolean;
  leagueData?: boolean;
  noTribes?: boolean;
  noMembers?: boolean;
  noLabels?: boolean;
  noNotes?: boolean;
}

export default function HeaderRow({
  label,
  onSectionLayout,
  edit,
  leagueData,
  noTribes,
  noMembers,
  noLabels,
  noNotes,
}: SectionSpacerProps) {
  return (
    <View
      className={cn(noLabels && 'bg-white border-b-2 border-primary/20 w-full')}
      style={{ height: 29 }}
      onLayout={(e) => onSectionLayout?.(label, e.nativeEvent.layout.y)}>
      {!noLabels && (
        <View className='w-full flex-row items-center gap-4 border-b-2 border-primary/20 bg-white px-4'>
          {edit && (
            <View className='w-8'>
              <Text
                allowFontScaling={false}
                className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Edit
              </Text>
            </View>
          )}
          <View className='w-40 border-r border-secondary py-2'>
            <Text
              allowFontScaling={false}
              className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              Event
            </Text>
          </View>
          {leagueData && (
            <View className='w-16 items-center'>
              <Text
                allowFontScaling={false}
                className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Points
              </Text>
            </View>
          )}
          {!noTribes && (
            <View className='w-24'>
              <Text
                allowFontScaling={false}
                className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Tribes
              </Text>
            </View>
          )}
          <View className='w-32'>
            <Text
              allowFontScaling={false}
              className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              Castaways
            </Text>
          </View>
          {!noMembers && (
            <View className='w-36'>
              <Text
                allowFontScaling={false}
                className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Members
              </Text>
            </View>
          )}
          <View className='w-20'>
            {!noNotes && (
              <Text
                allowFontScaling={false}
                className='text-right text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Notes
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

