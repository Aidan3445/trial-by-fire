import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { cn } from '~/lib/utils';

interface SectionSpacerProps {
  label: string;
  scrollX?: SharedValue<number>;
  edit?: boolean;
  leagueData?: boolean;
  noTribes?: boolean;
  noMembers?: boolean;
  noLabels?: boolean;
  noNotes?: boolean;
}

export default function HeaderRow({
  label,
  scrollX,
  edit,
  leagueData,
  noTribes,
  noMembers,
  noLabels,
  noNotes,
}: SectionSpacerProps) {
  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX?.value ?? 0 }],
  }));

  return (
    <View
      className={cn(noLabels && 'bg-white border-b-2 border-primary/20 w-full')}
      style={{ height: 29 }}>
      {!noLabels && (
        <View className='w-full flex-row items-center gap-4 border-b-2 border-primary/20 bg-white px-4'>
          {/* Sticky section label overlay */}
          <Animated.View
            style={[{
              position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10,
            }, stickyStyle]}>
            <View className={cn('bg-white pl-4 justify-center border-b-2 border-primary/20 h-full',
              edit ? 'w-56' : 'w-44')}>
              <View className={cn('h-full justify-center border-r border-secondary',
                edit ? 'w-52' : 'w-40')}>
                <Text
                  allowFontScaling={false}
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  {label}
                </Text>
              </View>
            </View>
          </Animated.View>

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
