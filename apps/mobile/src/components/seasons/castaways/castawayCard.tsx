import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Grayscale } from 'react-native-color-matrix-image-filters';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, FlameKindling } from 'lucide-react-native';
import { useMemo } from 'react';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe, type TribesTimeline } from '~/types/tribes';
import { type LeagueMember } from '~/types/leagueMembers';
import { getTribeTimeline } from '~/lib/utils';
import ColorRow from '~/components/shared/colorRow';
import TribeHistoryCircles from '~/components/shared/castaways/tribeHistoryCircles';
import { colors } from '~/lib/colors';

interface CastawayCardProps {
  castaway: EnrichedCastaway;
  tribesTimeline: TribesTimeline;
  tribes: Tribe[];
  member?: LeagueMember;
}

export default function CastawayCard({
  castaway,
  tribesTimeline,
  tribes,
  member,
}: CastawayCardProps) {
  const tribeTimeline = useMemo(
    () => getTribeTimeline(castaway.castawayId, tribesTimeline, tribes),
    [castaway.castawayId, tribesTimeline, tribes]
  );

  const handleLearnMore = async () => {
    const url = `https://survivor.fandom.com/wiki/${encodeURIComponent(castaway.fullName)}`;
    await WebBrowser.openBrowserAsync(url);
  };

  const isFullyEliminated =
    !!castaway.eliminatedEpisode &&
    !castaway.redemption?.some(r => r.secondEliminationEpisode === null);

  return (
    <View className='gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3'>
      {/* Header with Image and Name */}
      <ColorRow
        className='relative h-16 justify-start gap-2 p py-2'
        color={isFullyEliminated ? '#AAAAAA' : castaway.tribe!.color}>
        <View className='flex-row items-center gap-2'>
          <Grayscale amount={+(isFullyEliminated || !!member)}>
            <Image
              source={{ uri: castaway.imageUrl }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 2,
                borderColor: isFullyEliminated
                  ? colors['muted-foreground']
                  : colors.primary
              }} />
          </Grayscale>
          <Text className='font-bold text-foreground'>{castaway.fullName}</Text>
        </View>

        {/* Member Badge */}
        {member && (
          <View className='absolute -right-1 top-1 z-50' style={{ transform: [{ rotate: '30deg' }] }}>
            <ColorRow color={member.color} opaque>
              <Text className='text-base font-bold leading-tight'>
                {member.displayName}
              </Text>
            </ColorRow>
          </View>
        )}

        {/* Tribe History or Spacer */}
        {(tribeTimeline.length > 1 || castaway.eliminatedEpisode) && (
          <TribeHistoryCircles tribeTimeline={tribeTimeline} />
        )}
        <Text className='w-12 leading-none text-lg font-black uppercase tracking-tight text-card-foreground'>
          {/* Elimination Indicator */}
          {isFullyEliminated && (
            <View className='flex-row items-center gap-1'>
              <FlameKindling size={18} color={colors['muted-foreground']} />
              <Text className='italic text-muted-foreground'>
                {castaway.eliminatedEpisode}
              </Text>
            </View>
          )}
        </Text>
      </ColorRow>


      {/* Info Section */}
      <View className='gap-1'>
        <Text className='text-sm text-foreground'>
          <Text className='font-bold text-muted-foreground'>Residence: </Text>
          {castaway.residence}
        </Text>
        <Text className='text-sm text-foreground'>
          <Text className='font-bold text-muted-foreground'>Occupation: </Text>
          {castaway.occupation}
        </Text>
        {castaway.previouslyOn && castaway.previouslyOn.length > 0 && (
          <Text className='text-sm text-foreground'>
            <Text className='font-bold text-muted-foreground'>Previously On: </Text>
            {castaway.previouslyOn.join(', ')}
          </Text>
        )}
      </View>

      {/* Learn More Link */}
      <Pressable
        onPress={handleLearnMore}
        className='mt-auto flex-row items-center gap-1 active:opacity-70'>
        <Text className='text-xs font-bold uppercase tracking-wider text-primary'>
          Learn more
        </Text>
        <ExternalLink size={12} className='text-primary' />
      </Pressable>
    </View>
  );
}
