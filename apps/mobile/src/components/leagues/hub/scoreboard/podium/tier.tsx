import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '~/lib/utils';
import type { LeagueMember } from '~/types/leagueMembers';
import { PointsIcon } from '~/components/icons/generated';

interface TierProps {
  member?: LeagueMember;
  points?: number;
  place: 'Gold' | 'Silver' | 'Bronze';
  position: 'left' | 'center' | 'right';
  className?: string;
}

const placeColors = {
  Gold: {
    gradient: ['#fcd34d', '#f59e0b'] as const, // amber-300 to amber-500
    border: '#f59e0b',
  },
  Silver: {
    gradient: ['#d4d4d8', '#a1a1aa'] as const, // zinc-300 to zinc-400
    border: '#a1a1aa',
  },
  Bronze: {
    gradient: ['#d97706', '#b45309'] as const, // amber-600 to amber-700
    border: '#b45309',
  },
};

const placeHeights = {
  Gold: 'h-full',
  Silver: 'h-3/5',
  Bronze: 'h-1/3',
};

export default function Tier({ member, points, place, className }: TierProps) {
  if (!member || points === undefined) return null;

  const colors = placeColors[place];

  return (
    <View className='flex-1 flex-col items-center justify-end gap-1 h-full'>
      {/* Name */}
      <View className='rounded bg-econdary/80 px-2 py-1 items-center justify-center h-min'>
        <Text
          className='text-base font-black uppercase tracking-tight text-foreground text-center leading-none'
          numberOfLines={1}
          adjustsFontSizeToFit>
          {member.displayName}
        </Text>
      </View>

      {/* Podium Block */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className='flex-1 items-center justify-end pb-4'
        style={{ borderColor: colors.border, borderWidth: 2, borderRadius: 4 }}>
        <View className={cn('w-24 items-center', placeHeights[place], className)}>
          <View className='flex-row items-center'>
            <PointsIcon size={20} color='#000' />
            <Text allowFontScaling={false} className='text-2xl font-black text-black'>{points}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
