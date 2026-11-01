import { Text, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { CROWN_FILL } from '~/components/sys/donation/donorCrown';
import HideCrownToggle from '~/components/sys/donation/hideCrownToggle';
import { useDonationStatus } from '~/hooks/user/useFunding';
import { colors } from '~/lib/colors';

/**
 * Supporter settings on the profile tab, only for donors
 */
export default function SupporterSettings() {
  const { data: status } = useDonationStatus();
  if (!status || !(status.donatedBefore || status.donatedThisSeason)) return null;

  return (
    <View className='rounded-xl bg-card p-4 gap-2 border-2 border-primary/20'>
      <View className='flex-row items-center gap-2'>
        <Crown size={22} strokeWidth={2} color={colors.primary} fill={CROWN_FILL} />
        <Text className='text-primary text-base font-semibold'>Supporter</Text>
      </View>
      <Text className='text-muted-foreground leading-5'>
        Thanks for supporting Trial by Fire! Your crown shows next to your name in your leagues.
      </Text>
      <HideCrownToggle />
    </View>
  );
}
