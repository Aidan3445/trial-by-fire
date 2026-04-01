import { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { ExternalLink, FlameKindling } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import { type EnrichedCastaway } from '~/types/castaways';
import { type ReactNode } from 'react';
import TribeHistoryCircles from '~/components/shared/castaways/tribeHistoryCircles';
import { useTribesTimeline } from '~/hooks/seasons/useTribesTimeline';
import { useTribes } from '~/hooks/seasons/useTribes';
import { getTribeTimeline } from '~/lib/utils';
import { colors } from '~/lib/colors';

interface CastawayModalProps {
  castaway?: EnrichedCastaway;
  children: ReactNode;
}

export default function CastawayModal({ castaway, children }: CastawayModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: tribesTimeline } = useTribesTimeline(castaway?.seasonId || null);
  const { data: tribes } = useTribes(castaway?.seasonId || null);

  const tribeTimeline = getTribeTimeline(
    castaway?.castawayId || 0,
    tribesTimeline || {},
    tribes || []
  );

  if (!castaway) {
    return <>{children}</>;
  }

  const handleLearnMore = () => {
    WebBrowser.openBrowserAsync(`https://survivor.fandom.com/wiki/${castaway.fullName}`);
  };

  return (
    <>
      <Pressable onPress={() => setModalOpen(true)}>
        {children}
      </Pressable>
      <Modal visible={modalOpen} onClose={() => setModalOpen(false)}>
        {/* Header with name and image */}
        <View className='flex-row justify-between gap-3 items-start mb-1'>
          <View className='flex-1'>
            <Text
              allowFontScaling={false}
              className='leading-none text-lg font-black uppercase tracking-tight text-card-foreground'>
              {castaway.fullName}
              {castaway.eliminatedEpisode && (
                <Text className='italic text-muted-foreground'>
                  {'  • '}
                  <View style={{ transform: [{ translateY: 8 }] }}>
                    <FlameKindling size={16} color={colors['muted-foreground']} />
                  </View>
                  {castaway.eliminatedEpisode}
                </Text>
              )}
            </Text>
            <Text className='text-sm text-card-foreground'>
              <Text className='font-bold text-muted-foreground'>Age: </Text>
              {castaway.age}
            </Text>
          </View>
          <Image
            source={{ uri: castaway.imageUrl }}
            alt={castaway.fullName}
            className='w-20 h-20 rounded-md border-2 border-primary/20' />
        </View>

        {/* Season */}
        <View className='flex-row items-center mb-3'>
          <TribeHistoryCircles tribeTimeline={tribeTimeline} />
        </View>

        {/* Info */}
        <View className='gap-1 mb-3'>
          <Text className='text-sm text-card-foreground'>
            <Text className='font-bold text-muted-foreground'>Residence: </Text>
            {castaway.residence}
          </Text>
          <Text className='text-sm text-card-foreground'>
            <Text className='font-bold text-muted-foreground'>Occupation: </Text>
            {castaway.occupation}
          </Text>
          {castaway.previouslyOn && castaway.previouslyOn.length > 0 && (
            <Text className='text-sm text-card-foreground'>
              <Text className='font-bold text-muted-foreground'>Previously On: </Text>
              {castaway.previouslyOn.join(', ')}
            </Text>
          )}
        </View>

        {/* Learn more link */}
        <Button
          onPress={handleLearnMore}
          className='flex-row items-center gap-1 self-start'>
          <Text className='text-primary font-bold uppercase text-xs tracking-wider'>
            Learn more
          </Text>
          <ExternalLink size={12} className='text-primary' />
        </Button>
      </Modal>
    </>
  );
}
