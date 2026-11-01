import { Switch, Text, View } from 'react-native';
import { useDonationStatus, useHideBadge } from '~/hooks/user/useFunding';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

interface HideCrownToggleProps {
  className?: string;
  // Takes over hiding, for callers that must close first
  onHide?: () => void;
}

/**
 * Lets a donor hide their crown from everyone, themselves included
 */
export default function HideCrownToggle({ className, onHide }: HideCrownToggleProps) {
  const { data: status } = useDonationStatus();
  const { mutate: setHidden } = useHideBadge();

  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      <Text className='text-sm text-primary'>Hide my crown</Text>
      <Switch
        value={status?.hideBadge ?? false}
        disabled={!status}
        onValueChange={(hidden) => {
          if (hidden && onHide) onHide();
          else setHidden(hidden);
        }}
        trackColor={{ false: colors.accent, true: colors.primary }}
        thumbColor='white' />
    </View>
  );
}
