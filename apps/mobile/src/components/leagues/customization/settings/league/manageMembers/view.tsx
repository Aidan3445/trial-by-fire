import { View, Text, ScrollView } from 'react-native';
import { Circle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/common/tabs';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { usePendingMembers } from '~/hooks/leagues/query/usePendingMembers';
import { colors } from '~/lib/colors';
import CurrentMember from '~/components/leagues/customization/settings/league/manageMembers/current';
import PendingMember from '~/components/leagues/customization/settings/league/manageMembers/pending';
import { cn } from '~/lib/utils';

export default function ManageMembers() {
  const { data: leagueMembers } = useLeagueMembers();
  const { data: pendingMembers } = usePendingMembers();
  const { data: leagueSettings } = useLeagueSettings();
  const [tab, setTab] = useState<string>('current');

  useEffect(() => {
    if (!leagueSettings?.isProtected && tab === 'pending') {
      setTab('current');
    }
  }, [leagueSettings, tab]);

  const loggedInRole = leagueMembers?.loggedIn?.role;
  if (loggedInRole !== 'Owner' && loggedInRole !== 'Admin') {
    return null;
  }

  const hasPendingMembers = (pendingMembers?.members?.length ?? 0) > 0;

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      {/* Header */}
      <View className='flex-row items-center gap-1 h-8'>
        <View className='h-6 w-1 bg-primary rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight'>
          Manage Members
        </Text>
      </View>

      {/* Tabs */}
      <Tabs defaultValue='current' value={tab} onValueChange={setTab}>
        <TabsList className='rounded-lg'>
          <TabsTrigger value='current' className='flex-1'>
            Current
          </TabsTrigger>

          <TabsTrigger
            value='pending'
            className='flex-1'
            disabled={!leagueSettings?.isProtected}>
            <View className='flex-row items-center gap-1'>
              <Text
                className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  tab === 'pending' ? 'text-white' : 'text-black'
                )}>
                Pending
              </Text>
              {leagueSettings?.isProtected && hasPendingMembers && (
                <Circle size={8} fill={colors.primary} color={colors.primary} />
              )}
            </View>
          </TabsTrigger>
        </TabsList>

        {/* Current Members Tab */}
        <TabsContent value='current' className='gap-2'>
          <View className='gap-1'>
            <Text className='text-base text-muted-foreground'>
              <Text className='font-bold'>Admins</Text> can help score custom events and admit/remove members.
            </Text>
            <Text className='text-base text-muted-foreground'>
              <Text className='font-bold'>The Owner</Text> can also manage roles, edit league settings, and delete the league.
            </Text>
          </View>
          <View className='h-px bg-primary/20' />
          <ScrollView
            className='max-h-40 w-full'
            nestedScrollEnabled>
            <View className='gap-1'>
              {leagueMembers?.members
                .filter(member => !member.loggedIn || member.memberId !== leagueMembers.loggedIn?.memberId)
                .map(member => (
                  <CurrentMember
                    key={member.memberId}
                    member={member}
                    loggedInMember={leagueMembers.loggedIn} />
                ))}
            </View>
          </ScrollView>
        </TabsContent>

        {/* Pending Members Tab */}
        <TabsContent value='pending' className='gap-2 w-full'>
          {leagueSettings?.isProtected ? (
            <>
              <Text className='text-base text-muted-foreground'>
                Since this league is protected, new members must be admitted by an admin.
              </Text>
              <Text className='text-sm text-muted-foreground'>
                Pending members will be removed after 7 days if not admitted.
              </Text>
              <View className='h-px bg-primary/20' />
              <ScrollView
                className='max-h-40 w-full'
                nestedScrollEnabled>
                <View className='gap-1'>
                  {pendingMembers?.members.map(member => (
                    <PendingMember
                      key={member.memberId}
                      member={member}
                      loggedInMember={leagueMembers?.loggedIn} />
                  ))}
                  {!hasPendingMembers && (
                    <Text className='text-base text-center text-muted-foreground py-4'>
                      No pending members
                    </Text>
                  )}
                </View>
              </ScrollView>
            </>
          ) : (
            <Text className='text-base text-muted-foreground'>
              This league is not protected; new members can join freely.
            </Text>
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
