import { UserIcon } from '~/components/icons/generated';
import { Users } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const secondarySlide: SlideConfig = {
  icon: UserIcon,
  iconStrokeWidth: 0.5,
  accentIcon: Users,
  color: colors.blue500 ?? '#3b82f6',
  bgClass: 'bg-blue-500/10',
  borderClass: 'border-blue-500/20',
  badgeClass: 'bg-blue-500/15',
  badgeBorderClass: 'border-blue-500/30',
  title: 'Pick a Secondary',
  subtitle: 'A second castaway for bonus points',
  body: 'Each episode, choose a secondary player. Multiple people can pick the same one. Unlike your main survivor, your secondary doesn\'t earn streak points. You can still pick one even if your main has been eliminated.',
  customizable: 'Your league controls the points multiplier (50% or full), the lockout period before re-picking the same player (or never repeat), whether you can pick your own survivor, and whether picks are visible to others before the episode airs.',
  tag: 'NEW',
};
;
