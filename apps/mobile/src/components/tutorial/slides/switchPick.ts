import { PlaygroundIcon } from '~/components/icons/generated';
import { ArrowLeftRight } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const switchPickSlide: SlideConfig = {
  icon: PlaygroundIcon,
  accentIcon: ArrowLeftRight,
  color: colors.cyan500 ?? '#06b6d4',
  bgClass: 'bg-cyan-500/10',
  borderClass: 'border-cyan-500/20',
  badgeClass: 'bg-cyan-500/15',
  badgeBorderClass: 'border-cyan-500/30',
  title: 'Switch Your Pick',
  subtitle: 'Swap before it\'s too late',
  body: 'You can change your main survivor at any time before they\'re eliminated. But be careful: once you drop them, someone else can scoop them up.',
  customizable: 'Your league controls whether voluntary switches preserve your streak or reset it to zero.',
};
