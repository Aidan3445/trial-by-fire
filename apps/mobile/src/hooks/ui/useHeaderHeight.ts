import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EXTRA_HEIGHT_PLATFORM_OFFSET = Platform.OS === 'ios' ? 0 : 8;

export default function useHeaderHeight(extraHeight: number = 16) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top + extraHeight + EXTRA_HEIGHT_PLATFORM_OFFSET, 45);
}
