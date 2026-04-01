import { View, Text } from 'react-native';
import Button from '~/components/common/button';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useFetch } from '~/hooks/helpers/useFetch';
import Clock from '~/components/leagues/predraft/countdown/clock';
import { Calendar, CalendarX2 } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import SetDraftDate from '~/components/leagues/predraft/countdown/edit';
import { useRouter, useSegments } from 'expo-router';

interface DraftCountdownProps {
  overrideHash?: string;
  className?: string;
}

export function DraftCountdown({ overrideHash, className }: DraftCountdownProps) {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { data: league } = useLeague(overrideHash);
  const { data: leagueSettings } = useLeagueSettings(overrideHash);
  const { data: leagueMembers } = useLeagueMembers(overrideHash);
  const segments = useSegments();
  const router = useRouter();

  const editable = useMemo(
    () =>
      leagueMembers?.loggedIn
      && leagueMembers.loggedIn.role === 'Owner'
      && leagueSettings,
    [leagueMembers, leagueSettings]
  );

  const trackedDraftDate = useMemo(() => {
    return leagueSettings?.draftDate ? new Date(leagueSettings.draftDate) : null;
  }, [leagueSettings]);

  const onDraftJoin = async () => {
    if (!league) return;
    if (league.status === 'Predraft') {
      const res = await putData(`/api/leagues/${league.hash}/status`);
      if (res.status !== 200) {
        console.error(`Failed to join draft: ${res.statusText}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['league', league.hash] });
      await queryClient.invalidateQueries({ queryKey: ['settings', league.hash] });
    }

    if (!segments.includes('draft')) {
      router.push(`/leagues/${league.hash}`);
    }
  };

  return (
    <View className={cn('w-full flex-1 p-2 pt-1', className)}>
      {/* Header */}
      <View>
        <View className='flex-row items-center justify-between mb-1'>
          <View className='flex-row items-center gap-1'>
            <View className='h-6 w-1 bg-primary rounded-full' />
            <Text className='text-xl font-black uppercase tracking-tight'>
              Draft Status
            </Text>
          </View>

          {/* Action Buttons */}
          {editable && <SetDraftDate overrideHash={overrideHash} onDraftJoin={onDraftJoin} />}
        </View>
      </View>

      {/* Countdown / Action */}
      <View className='justify-center flex-1'>
        <View className='bg-accent border border-primary/40 rounded-md overflow-hidden'>
          <View className='px-3 pb-1 flex-row items-center gap-2'>
            {trackedDraftDate ? (trackedDraftDate.getTime() > Date.now() && (
              <>
                <Calendar size={16} stroke={colors.primary} />
                <Text
                  allowFontScaling={false}
                  className='text-base font-medium text-primary'>
                  Starts: {trackedDraftDate.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </>
            )) : (
              <>
                <CalendarX2 size={16} stroke={colors.primary} />
                <Text className='text-base font-medium text-primary'>
                  Draft date not scheduled
                </Text>
              </>
            )}
          </View>
          <Clock
            endDate={trackedDraftDate}
            replacedBy={
              <Button
                className='flex items-center justify-center rounded-md py-4 bg-primary m-2 mt-1'
                disabled={!league || (leagueMembers?.loggedIn?.role !== 'Owner' && league?.status !== 'Draft')}
                onPress={onDraftJoin}>
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  className='text-center text-2xl font-black uppercase tracking-wider text-primary-foreground'>
                  {league?.status === 'Draft'
                    ? 'Join Draft'
                    : leagueMembers?.loggedIn?.role === 'Owner'
                      ? 'Start Draft'
                      : 'Waiting for Commissioner'}
                </Text>
              </Button>
            } />
        </View>
      </View>
    </View>
  );
}
