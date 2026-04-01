import { PointsIcon } from '~/components/icons/generated';
import { Zap } from 'lucide-react-native';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const livePredictionsSlide: SlideConfig = {
  icon: PointsIcon,
  accentIcon: Zap,
  color: '#f59e0b',
  bgClass: 'bg-amber-500/10',
  borderClass: 'border-amber-500/20',
  badgeClass: 'bg-amber-500/15',
  badgeBorderClass: 'border-amber-500/30',
  title: 'Live Predictions',
  subtitle: 'Play along while watching',
  body: 'While episodes are airing, join live and predict what happens in real time. No points on the line, just bragging rights. Track your accuracy and build a streak across the season.',
  tag: 'NEW',
};
