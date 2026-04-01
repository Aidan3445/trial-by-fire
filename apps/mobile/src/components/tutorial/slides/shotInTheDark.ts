import { LeaguesIcon } from '~/components/icons/generated';
import { Dices } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import type { SlideConfig } from '~/components/tutorial/slides/slide';

export const shotInTheDarkSlide: SlideConfig = {
  icon: LeaguesIcon,
  accentIcon: Dices,
  color: colors.red500 ?? '#ef4444',
  bgClass: 'bg-red-500/10',
  borderClass: 'border-red-500/20',
  badgeClass: 'bg-red-500/15',
  badgeBorderClass: 'border-red-500/30',
  title: 'Shot in the Dark',
  subtitle: 'A last-ditch play to save your streak',
  body: 'Think your survivor is going home? Play your Shot in the Dark before the episode airs. If they do get voted out, you keep your streak bonus when you pick a new player. You only get one per league, use it wisely.',
  customizable: 'Your league can enable or disable Shot in the Dark. It requires survival streaks to be active.',
  tag: 'NEW',
};
