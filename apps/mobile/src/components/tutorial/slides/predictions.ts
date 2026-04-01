import { PlaygroundIcon } from '~/components/icons/generated';
import { HelpCircle } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const predictionsSlide: SlideConfig = {
  icon: PlaygroundIcon,
  accentIcon: HelpCircle,
  color: colors.purple500 ?? '#a855f7',
  bgClass: 'bg-purple-500/10',
  borderClass: 'border-purple-500/20',
  badgeClass: 'bg-purple-500/15',
  badgeBorderClass: 'border-purple-500/30',
  title: 'Make Predictions',
  subtitle: 'Call the shots each episode',
  body: 'Before each episode, predict what will happen. Correct predictions earn you bonus points on top of your survivor\'s score.',
  customizable: 'Your league chooses which events can be predicted and when. Predict the winner at the draft, merge, or finale. Predict tribe challenge winners pre-merge, individual winners post-merge. Commissioners can also create custom predictions.',
};
