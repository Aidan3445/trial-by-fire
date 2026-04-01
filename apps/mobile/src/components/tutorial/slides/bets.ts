import { PointsIcon } from '~/components/icons/generated';
import { Coins } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const betsSlide: SlideConfig = {
  icon: PointsIcon,
  accentIcon: Coins,
  color: colors.amber500 ?? '#f59e0b',
  bgClass: 'bg-amber-500/10',
  borderClass: 'border-amber-500/20',
  badgeClass: 'bg-amber-500/15',
  badgeBorderClass: 'border-amber-500/30',
  title: 'Place Your Bets',
  subtitle: 'Wager points on your predictions',
  body: 'Once betting opens, wager points you\'ve earned throughout the season on predictions. If you\'re right, you gain those points on top of the base score. If you miss, you lose the wager.',
  customizable: 'Your league controls when betting activates (e.g. at the merge or a custom episode), the max points per bet, how many bets per week, and which prediction events are bettable. Betting can also be disabled entirely.',
};
