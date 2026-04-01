import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe } from '~/types/tribes';
import ColorRow from '~/components/shared/colorRow';
import CastawayModal from '~/components/shared/castaways/castawayModal';
import { cn } from '~/lib/utils';

interface EpisodeMarkerProps {
  episodeNumber: number;
  episodeTitle?: string;
  tribes: Tribe[];
  castawaysByTribe: Record<number, EnrichedCastaway[]>;
  isKeyEpisode?: boolean;
  keyEpisodeLabels?: string[];
}

export default function EpisodeMarker({
  episodeNumber,
  episodeTitle,
  tribes,
  castawaysByTribe,
  isKeyEpisode,
  keyEpisodeLabels,
}: EpisodeMarkerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandProgress = useSharedValue(0);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
    expandProgress.value = withTiming(isExpanded ? 0 : 1, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 1000]),
  }));

  const getBadgeColor = (keyEpisodeLabel: string) => {
    if (keyEpisodeLabel === 'Premiere') return 'bg-green-500/20 text-green-600 border-green-500/40';
    if (keyEpisodeLabel === 'Finale') return 'bg-red-500/20 text-red-600 border-red-500/40';
    if (keyEpisodeLabel === 'Merge') return 'bg-blue-500/20 text-blue-600 border-blue-500/40';
    if (keyEpisodeLabel === 'Redemption') return 'bg-black/20 text-black border-black/40';
    return 'bg-primary/20 text-primary border-primary/40';
  };

  const getBadgeTextColor = (keyEpisodeLabel: string) => {
    if (keyEpisodeLabel === 'Premiere') return 'text-green-600';
    if (keyEpisodeLabel === 'Finale') return 'text-red-600';
    if (keyEpisodeLabel === 'Merge') return 'text-blue-600';
    if (keyEpisodeLabel === 'Redemption') return 'text-black';
    return 'text-primary';
  };

  return (
    <View>
      {/* Accordion Trigger */}
      <Pressable
        onPress={toggleExpanded}
        className='flex-row items-center rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:bg-primary/10'>
        <View className='flex-1'>
          {/* Episode Number and Badge */}
          <View className='flex-row flex-wrap items-center gap-2'>
            <Text className='text-sm font-bold uppercase tracking-wider text-foreground'>
              Episode {episodeNumber}
            </Text>
            {isKeyEpisode && keyEpisodeLabels?.map((label) => (
              <View key={label} className={cn('rounded border-2 px-2 py-0.5', getBadgeColor(label))}>
                <Text className={cn('text-xs font-black', getBadgeTextColor(label))}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Episode Title */}
          {episodeTitle && (
            <Text className='text-sm font-medium text-muted-foreground'>{episodeTitle}</Text>
          )}
        </View>

        {/* Chevron */}
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} className='text-foreground' />
        </Animated.View>
      </Pressable>

      {/* Accordion Content */}
      <Animated.View style={contentStyle} className='overflow-hidden'>
        <View className='gap-3 pl-4 pt-3'>
          {tribes.map((tribe) => {
            const tribeMembers = castawaysByTribe[tribe.tribeId] ?? [];
            if (tribeMembers.length === 0) return null;

            return (
              <View
                key={tribe.tribeId}
                className='rounded-lg border-2 border-primary/20 bg-primary/5 p-3'>
                {/* Tribe Header */}
                <View className='mb-2 flex-row items-center gap-2'>
                  <View
                    className='h-3 w-3 shrink-0 rounded-full'
                    style={{ backgroundColor: tribe.tribeColor }}
                  />
                  <Text className='text-sm font-bold uppercase tracking-wider text-foreground'>
                    {tribe.tribeName}
                  </Text>
                </View>

                {/* Castaway Grid */}
                <View className='w-full flex-row flex-wrap gap-1'>
                  {tribeMembers.map((castaway) => (
                    <View key={castaway.castawayId} className='w-[48%]'>
                      <ColorRow
                        className='min-h-8 gap-2 border-2'
                        color={tribe.tribeColor}>
                        <CastawayModal castaway={castaway}>
                          <Text className='text-sm font-medium leading-none'>
                            {castaway.fullName}
                          </Text>
                        </CastawayModal>
                      </ColorRow>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}
