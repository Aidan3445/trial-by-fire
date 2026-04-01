import { TorchIcon } from '~/components/icons/generated';
import { HandMetal } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import { type SlideConfig } from '~/components/tutorial/slides/slide';

export const welcomeSlide: SlideConfig = {
  icon: TorchIcon,
  accentIcon: HandMetal,
  color: colors.primary,
  bgClass: 'bg-primary/10',
  borderClass: 'border-primary/20',
  badgeClass: 'bg-primary/15',
  badgeBorderClass: 'border-primary/30',
  title: 'Welcome to Trial by Fire',
  subtitle: 'Your Fantasy Survivor experience',
  body: 'Draft castaways, earn points, make predictions, and compete with friends across the entire season.',
};
