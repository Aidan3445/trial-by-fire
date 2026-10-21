import { TouchableOpacity, View } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import { useLiveScoring } from '~/context/liveScoringContext';
import { colors } from '~/lib/colors';

/**
 * Top-left of the root tab headers while an episode airs: whether live scoring
 * alerts are on. Tapping it asks to turn them on or off.
 */
export default function LiveScoringIndicator({ visible = true }: { visible?: boolean }) {
  const { isLive, isOptedIn, openPrompt } = useLiveScoring();
  if (!isLive || !visible) return null;

  return (
    <View className='absolute left-4'>
      <TouchableOpacity
        className='px-4'
        activeOpacity={0.7}
        accessibilityRole='button'
        accessibilityLabel={isOptedIn ? 'Live scoring alerts on' : 'Live scoring alerts silenced'}
        onPress={() => openPrompt()}>
        <View>
          {isOptedIn
            ? <Bell color={colors.primary} size={24} />
            : <BellOff color={colors.neutral} size={24} />}
          {isOptedIn && (
            <View className='absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-500 border border-card' />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
