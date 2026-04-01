import { TorchIcon } from '~/components/icons/generated';
import { Rocket } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const readySlide: SlideConfig = {
  icon: TorchIcon,
  accentIcon: Rocket,
  color: colors.primary,
  bgClass: 'bg-primary/10',
  borderClass: 'border-primary/20',
  badgeClass: 'bg-primary/15',
  badgeBorderClass: 'border-primary/30',
  title: 'Survivors Ready...',
  subtitle: 'Time to outwatch, outpredict, outscore',
  body: 'Join a league, draft your survivor, and start competing. May the best fantasy player win.',
  cta: true,
};
