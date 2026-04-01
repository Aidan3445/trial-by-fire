import { HelpCircle } from 'lucide-react-native';
import { Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import { colors } from '~/lib/colors';

export default function PredictionTimingHelp() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <Button
        className='w-6 h-6 items-center justify-center'
        onPress={() => setIsVisible(true)}>
        <HelpCircle size={16} color={colors.primary} />
      </Button>

      <Modal visible={isVisible} onClose={() => setIsVisible(false)}>
        <View className='flex-row items-center gap-1 mb-2'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Prediction Timing
          </Text>
        </View>

        <Text className='text-base text-foreground mb-2'>
          Prediction timing determines when players make their predictions.
          {'\n'}Predictions can be set at various points in the season:
        </Text>

        <View className='rounded-lg border-2 border-primary/20 bg-primary/5 px-2'>
          <ScrollView>
            <View>
              <Text className='text-base text-foreground'>
                • <Text className='font-bold'>Draft</Text> – Predictions are locked in when players
                draft their teams, before the league starts.
              </Text>
              <Text className='text-base text-foreground'>
                • <Text className='font-bold'>Weekly</Text> – Predictions are made each week. Can
                apply to:
              </Text>
              <View className='ml-4'>
                <Text className='text-base text-foreground'>
                  • <Text className='font-bold'>Default</Text> – Every week from draft to finale.
                </Text>
                <Text className='text-base text-foreground'>
                  • <Text className='font-bold'>Pre-Merge Only</Text> – Weekly predictions end once
                  the tribes merge.
                </Text>
                <Text className='text-base text-foreground'>
                  • <Text className='font-bold'>Post-Merge Only</Text> – Weekly predictions start
                  after the merge.
                </Text>
              </View>
              <Text className='text-base text-foreground'>
                • <Text className='font-bold'>Merge</Text> – Predictions are made right after the
                merge episode airs.
              </Text>
              <Text className='text-base text-foreground'>
                • <Text className='font-bold'>Finale</Text> – Predictions are made just before the
                final episode.
              </Text>
            </View>
          </ScrollView>
        </View>

        <Text className='text-base text-foreground mb-4'>
          A prediction may be required at multiple points (e.g., Draft, Merge, and Finale), but only
          one prediction will be made on a given episode.
        </Text>

        <Button
          className='rounded-lg bg-primary p-3 active:opacity-80'
          onPress={() => setIsVisible(false)}>
          <Text className='text-center font-semibold text-white'>Got it</Text>
        </Button>
      </Modal>
    </>
  );
} 
