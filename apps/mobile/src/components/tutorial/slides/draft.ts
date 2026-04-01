import { UserIcon } from '~/components/icons/generated';
import { MousePointerClick } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const draftSlide: SlideConfig = {
  icon: UserIcon,
  iconStrokeWidth: 0.5,
  accentIcon: MousePointerClick,
  color: colors.amber500 ?? '#f59e0b',
  bgClass: 'bg-amber-500/10',
  borderClass: 'border-amber-500/20',
  badgeClass: 'bg-amber-500/15',
  badgeBorderClass: 'border-amber-500/30',
  title: 'Draft Your Survivor',
  subtitle: 'Your main castaway',
  body: 'Each player in your league drafts one castaway. Only you earn points for everything they do. No one else can pick your player.',
  customizable: 'Your league can customize point values for challenges, idols, advantages, and more. Commissioners can also create custom events that they score and track manually.',
};
