import { type ComponentRef, useRef, useState } from 'react';
import { Text, type TouchableOpacity, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import Popover, { Rect } from 'react-native-popover-view';
import Button from '~/components/common/button';
import HideCrownToggle from '~/components/sys/donation/hideCrownToggle';
import { useDonation } from '~/context/donationContext';
import { useHideBadge } from '~/hooks/user/useFunding';
import { colors } from '~/lib/colors';

export const CROWN_FILL = '#F0B100';

/**
 * Crown in the corner of a donor's color row. Thanks the donor, or invites others to tip.
 * @param self Whether the donor is the signed in user
 */
export default function DonorCrown({ self }: { self?: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const [anchor, setAnchor] = useState<Rect>();
  const [hideOnClose, setHideOnClose] = useState(false);
  const triggerRef = useRef<ComponentRef<typeof TouchableOpacity>>(null);
  const { startDonation } = useDonation();
  const { mutate: setHidden } = useHideBadge();

  // Measure once on tap: anchored to a ref, the popover keeps re-measuring and throws if the crown goes away
  const open = () => triggerRef.current?.measureInWindow((x, y, width, height) => {
    setAnchor(new Rect(x, y, width, height));
    setIsVisible(true);
  });

  return (
    <View className='absolute -top-2.5 -right-2'>
      <Button ref={triggerRef} onPress={open} className='p-0.5'>
        {/* Rotating the icon itself crops it to its own box */}
        <View className='p-0.5' style={{ transform: [{ rotate: '30deg' }] }}>
          <Crown size={16} strokeWidth={2} color={colors.primary} fill={CROWN_FILL} />
        </View>
      </Button>
      <Popover
        isVisible={isVisible}
        from={anchor}
        onRequestClose={() => setIsVisible(false)}
        onCloseComplete={() => {
          // Hide once the popover is gone so it doesn't vanish mid-animation with the crown
          if (!hideOnClose) return;
          setHideOnClose(false);
          setHidden(true);
        }}
        popoverStyle={{
          backgroundColor: colors.card,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: `${colors.primary}4D`,
          borderBottomColor: `${colors.primary}4D`,
        }}
        backgroundStyle={{ backgroundColor: 'transparent' }}
        arrowSize={{ width: 0, height: 0 }}>
        {self ? (
          <View className='p-3 gap-2 w-64 items-center'>
            <Crown size={36} strokeWidth={1.5} color={colors.primary} fill={CROWN_FILL} />
            <Text className='text-base font-bold text-primary text-center'>Thank you for supporting Trial by Fire!</Text>
            <Text className='text-sm text-muted-foreground text-center'>
              Your crown shows everyone in your leagues that you helped keep the app ad free.
            </Text>
            <HideCrownToggle
              className='w-full border-t border-primary/20 pt-2'
              onHide={() => {
                setHideOnClose(true);
                setIsVisible(false);
              }} />
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
