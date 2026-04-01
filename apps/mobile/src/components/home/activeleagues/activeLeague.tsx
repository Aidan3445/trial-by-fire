import { useRouter } from 'expo-router';
import { Trophy, Clock } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import Scoreboard from '~/components/leagues/hub/scoreboard/view';
import { DraftCountdown } from '~/components/leagues/predraft/countdown/view';
import { MAX_LEAGUE_MEMBERS_HOME_DISPLAY } from '~/lib/leagues';
import { type League } from '~/types/leagues';
import { cn } from '~/lib/utils';

interface ActiveLeagueProps {
  league: League;
  memberCount: number;
  maxMembers: number;
}

type StatusConfig = {
  label: string;
  color: string;
  textColor: string;
  strokeColor: string;
  borderColor: string;
  icon: typeof Trophy | typeof Clock;
};

const statusConfig: Record<League['status'], StatusConfig> = {
  Active: {
    label: 'ACTIVE',
    color: 'bg-green-500/20',
    textColor: 'text-green-600',
    strokeColor: '#16a34a',
    borderColor: 'border-green-500/40',
    icon: Trophy,
  },
  Draft: {
    label: 'DRAFT',
    color: 'bg-blue-500/20',
    textColor: 'text-blue-600',
    strokeColor: '#2563eb',
    borderColor: 'border-blue-500/40',
    icon: Clock,
  },
  Predraft: {
    label: 'UPCOMING',
    color: 'bg-yellow-500/20',
    textColor: 'text-yellow-600',
    strokeColor: '#ca8a04',
    borderColor: 'border-yellow-500/40',
    icon: Clock,
  },
  Inactive: {
    label: 'ENDED',
    color: 'bg-gray-500/20',
    textColor: 'text-gray-600',
    strokeColor: '#4b5563',
    borderColor: 'border-gray-500/40',
    icon: Trophy,
  },
};

export default function ActiveLeague({ league, memberCount, maxMembers }: ActiveLeagueProps) {
  const router = useRouter();
  const status = statusConfig[league.status];
  const StatusIcon = status.icon;

  return (
    <View className='px-2 flex-1 gap-2'>
      {/* League Header Card */}
      <Button
        className='stroke-green-600 relative bg-primary/5 border-2 border-primary/20 rounded-lg p-1 active:bg-primary/10'
        onPress={() => {
          router.replace('/leagues');
          // eslint-disable-next-line no-undef
          setTimeout(() => {
            router.navigate({ pathname: '/leagues/[hash]', params: { hash: league.hash } });
          }, 100);
        }}>
        {/* League Name */}
        <Text
          adjustsFontSizeToFit
          numberOfLines={2}
          className='text-2xl font-black leading-tight mb-2 h-16 text-center'>
          {league.name}
        </Text>

        <View className='flex flex-row items-center justify-between gap-4'>
          {/* Season Badge */}
          <View className='self-start border border-primary/40 bg-accent rounded-md px-2 py-1'>
            <Text
              className='text-xs font-bold text-primary'
              allowFontScaling={false}>
              {league.season}
            </Text>
          </View>

          {/* Status Badge */}
          <View
            className={cn(
              'flex-row items-center gap-1.5 rounded-md border px-2 py-1',
              status.color,
              status.borderColor
            )}>
            <StatusIcon size={12} strokeWidth={3} stroke={status.strokeColor} />
            <Text
              className={cn(
                'text-xs font-black tracking-wider',
                status.textColor
              )}
              allowFontScaling={false}>
              {status.label}
            </Text>
          </View>
        </View>
      </Button>

      {/* League Content */}
      <View className='flex-1'>
        {league.status === 'Active' ? (
          <Scoreboard
            className={cn('bg-primary/5 border-2 border-primary/20 rounded-lg overflow-hidden',
              memberCount >= maxMembers && 'flex-1')}
            overrideHash={league.hash}
            maxRows={MAX_LEAGUE_MEMBERS_HOME_DISPLAY} />
        ) : (
          <DraftCountdown
            overrideHash={league.hash}
            className='bg-primary/5 border-2 border-primary/20 rounded-lg overflow-hidden' />
        )}
      </View>
    </View >
  );
}
