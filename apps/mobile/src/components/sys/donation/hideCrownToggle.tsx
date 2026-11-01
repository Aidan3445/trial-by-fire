import { Switch, Text, View } from 'react-native';
import { useDonationStatus, useHideBadge } from '~/hooks/user/useFunding';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

/**
 * Lets a donor hide their crown from everyone, themselves included
 */
export default function HideCrownToggle({ className }: { className?: string }) {
  const { data: status } = useDonationStatus();
  const { mutate: setHidden, isPending } = useHideBadge();

  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      <Text className='text-sm text-primary'>Hide my crown</Text>
      <Switch
        value={status?.hideBadge ?? false}
        disabled={!status || isPending}
        onValueChange={(hidden) => setHidden(hidden)}
        trackColor={{ false: colors.accent, true: colors.primary }}
        thumbColor='white' />
    </View>
  );
}
