import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight, Hourglass } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import { type PublicLeague } from '~/types/leagues';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import { ScrollView } from 'react-native-gesture-handler';

interface PendingLeaguesProps {
  pendingLeagues: PublicLeague[];
  className?: string;
}

export default function PendingLeagues({ pendingLeagues, className }: PendingLeaguesProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <Button
        className={className}
        onPress={() => setIsOpen(true)}>
        <View className='mr-1 h-10 w-10 items-center justify-center rounded-full bg-primary/20'>
          <Hourglass size={18} color={colors.primary} />
        </View>
        <View className='flex-1'>
          <Text
            allowFontScaling={false}
            className='font-bold text-foreground'>
            View Pending
          </Text>
          <Text
            allowFontScaling={false}
            className='text-xs text-muted-foreground'>
            Awaiting approval...
          </Text>
        </View>
        <ChevronRight size={20} color={colors.primary} />
      </Button>

      {/* Modal */}
      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <View className='gap-2'>
          {/* Header */}
          <View>
            <View className='flex-row items-center gap-3'>
              <View className='h-6 w-1 rounded-full bg-primary' />
              <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                Pending Leagues
              </Text>
            </View>
            <Text className='text-base text-muted-foreground'>
              These are leagues you have requested to join. Please wait for the league owner to
              approve your request.
            </Text>
          </View>

          {/* League List */}
          <ScrollView className='max-h-44' enabled={pendingLeagues.length > 3}>
            <View className='gap-2'>
              {pendingLeagues.length > 0 ? (pendingLeagues.map((league, index) => (
                <View
                  key={index}
                  className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
                  <Text className='text-base font-bold text-foreground'>{league.name}</Text>
                </View>
              ))
              ) : (
                <Text className='text-sm text-muted-foreground'>
                  You have no pending league requests.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <Pressable
            className='rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'
            onPress={() => setIsOpen(false)}>
            <Text className='text-center font-semibold text-foreground'>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
