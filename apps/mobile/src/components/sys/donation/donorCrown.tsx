import { useState } from 'react';
import { Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import Popover from 'react-native-popover-view';
import Button from '~/components/common/button';
import HideCrownToggle from '~/components/sys/donation/hideCrownToggle';
import { useDonation } from '~/context/donationContext';
import { colors } from '~/lib/colors';

export const CROWN_FILL = '#F0B100';

/**
 * Crown in the corner of a donor's color row. Thanks the donor, or invites others to tip.
 * @param self Whether the donor is the signed in user
 */
export default function DonorCrown({ self }: { self?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const { startDonation } = useDonation();

  return (
    <View className='absolute -top-2.5 -right-2' style={{ transform: [{ rotate: '30deg' }] }}>
      <Popover
        isVisible={isVisible}
        onRequestClose={() => setIsVisible(false)}
        popoverStyle={{
          backgroundColor: colors.card,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: `${colors.primary}4D`,
        }}
        backgroundStyle={{ backgroundColor: 'transparent' }}
        arrowSize={{ width: 0, height: 0 }}
        from={
          <Button onPress={() => setIsVisible(true)} className='p-0.5'>
            <Crown size={16} strokeWidth={2} color={colors.primary} fill={CROWN_FILL} />
          </Button>
        }>
        {self ? (
          <View className='p-3 gap-2 w-64 items-center'>
            <Crown size={36} strokeWidth={1.5} color={colors.primary} fill={CROWN_FILL} />
            <Text className='text-base font-bold text-primary text-center'>Thank you for supporting Trial by Fire!</Text>
            <Text className='text-sm text-muted-foreground text-center'>
              Your crown shows everyone in your leagues that you helped keep the app ad free.
            </Text>
            <HideCrownToggle className='w-full border-t border-primary/20 pt-2' />
          </View>
        ) : (
          <View className='p-3 gap-2 w-64'>
            <View className='flex-row items-center gap-1.5'>
              <Crown size={16} strokeWidth={2} color={colors.primary} fill={CROWN_FILL} />
              <Text className='text-base font-bold text-primary'>Supporter</Text>
            </View>
            <Text className='text-sm text-muted-foreground'>They tipped to help keep Trial by Fire ad free.</Text>
            <Button
              onPress={() => {
                setIsVisible(false);
                startDonation();
              }}
              className='w-full rounded-lg bg-primary px-4 py-2'>
              <Text className='text-center text-sm font-semibold text-primary-foreground'>Buy me a coffee</Text>
            </Button>
          </View>
        )}
      </Popover>
    </View>
  );
}
