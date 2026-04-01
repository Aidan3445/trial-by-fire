import { View, Text } from 'react-native';
import { type LeagueMember } from '~/types/leagueMembers';
import ColorRow from '~/components/shared/colorRow';
import SkipMember from '~/components/leagues/draft/order/skipMember';
import { cn } from '~/lib/utils';

interface DraftOrderTrackerProps {
  hash: string;
  leagueMembers?: { loggedIn?: LeagueMember; members: LeagueMember[] };
  onTheClockMemberId?: number;
  membersWithPicks?: { member: LeagueMember; castawayFullName: string }[];
  className?: string;
}

export default function DraftOrder({
  hash,
  leagueMembers,
  onTheClockMemberId,
  membersWithPicks,
  className,
}: DraftOrderTrackerProps) {
  const isAdmin = leagueMembers?.loggedIn?.role !== 'Member';
  const members = leagueMembers?.members ?? [];

  const renderSkipControls = () => {
    if (!isAdmin || !onTheClockMemberId) return null;

    const onTheClock = members.find((m) => m.memberId === onTheClockMemberId);
    if (!onTheClock || onTheClock.draftOrder >= members.length - 1) return null;

    return (
      <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-2'>
        <Text className='text-sm font-semibold text-foreground'>
          Skip {onTheClock.displayName}?
        </Text>
        <SkipMember hash={hash} member={onTheClock} leagueMembers={members} />
      </View>
    );
  };

  return (
    <View className={cn('w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2', className)}>
      {/* Header */}
      <View className='flex-row items-center gap-1'>
        <View className='h-6 w-1 bg-primary rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight'>Draft Order</Text>
      </View>

      {/* Members List */}
      <View className='gap-2'>
        {members.map((item, index) => {
          const isOnTheClock = item.memberId === onTheClockMemberId;
          const pick = membersWithPicks?.find((m) => m.member.memberId === item.memberId);

          return (
            <ColorRow
              key={item.memberId}
              className={cn(
                'flex-row items-center rounded-lg px-3 py-2',
                isOnTheClock && 'border-2 border-primary/30'
              )}
              color={item.color}>
              {/* Position Number */}
              <View
                className='h-8 w-8 items-center justify-center rounded-md'
                style={{
                  backgroundColor: `${item.color}40`,
                  borderWidth: 2,
                  borderColor: `${item.color}66`,
                }}>
                <Text className='text-sm font-black'>{index + 1}</Text>
              </View>

              {/* Member Name */}
              <Text
                className={cn(
                  'ml-3 flex-1 text-xl font-bold',
                  item.loggedIn && 'text-primary'
                )}>
                {item.displayName}
              </Text>

              {/* On The Clock Indicator or Pick */}
              {isOnTheClock && (
                <Text className='text-sm font-bold uppercase tracking-wider text-primary animate-pulse'>
                  Picking...
                </Text>
              )}

              {!isOnTheClock && pick && (
                <Text className='text-sm font-medium text-muted-foreground'>{pick.castawayFullName}</Text>
              )}
            </ColorRow>
          );
        })}
      </View>

      {/* Admin Skip Controls */}
      {renderSkipControls()}
    </View>
  );
}
