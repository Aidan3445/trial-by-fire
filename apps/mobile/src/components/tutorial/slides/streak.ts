import { PointsIcon } from '~/components/icons/generated';
import { TrendingUp } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const streakSlide: SlideConfig = {
  icon: PointsIcon,
  accentIcon: TrendingUp,
  color: colors.emerald500 ?? '#10b981',
  bgClass: 'bg-emerald-500/10',
  borderClass: 'border-emerald-500/20',
  badgeClass: 'bg-emerald-500/15',
  badgeBorderClass: 'border-emerald-500/30',
  title: 'Build Your Streak',
  subtitle: 'Bonus points that grow each episode',
  body: 'Every episode your survivor stays in the game, you earn escalating bonus points: 1, then 2, then 3, and so on. The longer they last, the more you earn.',
  customizable: 'Your league can set a streak cap (e.g. max 5 pts/episode), leave it unlimited, or disable streaks entirely.',
  detail: [
    { label: 'Episode 1', value: '+1 pt' },
    { label: 'Episode 2', value: '+2 pts' },
    { label: 'Episode 3', value: '+3 pts' },
    { label: 'Episode 4', value: '+4 pts' },
    { label: 'Episode 5+', value: '+5 pts (if capped)' },
  ],
};
