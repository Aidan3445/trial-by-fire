import { View, Text } from 'react-native';
import ColorRow from '~/components/shared/colorRow';
import { type LeagueMember } from '~/types/leagueMembers';
import AdminToggle from '~/components/leagues/customization/settings/league/manageMembers/adminToggle';
import OwnerToggle from '~/components/leagues/customization/settings/league/manageMembers/ownerToggle';
import RemoveMember from '~/components/leagues/customization/settings/league/manageMembers/remove';

export interface CurrentMemberProps {
  member: LeagueMember;
  loggedInMember?: LeagueMember;
}

export default function CurrentMember({ member, loggedInMember }: CurrentMemberProps) {
  return (
    <ColorRow color={member.color} className='w-full'>
      <View className='flex-1 flex-row items-center justify-between'>
        <Text className='text-base flex-shrink' numberOfLines={1}>
          {member.displayName}
        </Text>
        <View className='flex-row items-center gap-2'>
          <AdminToggle member={member} loggedInMember={loggedInMember} />
          <OwnerToggle member={member} loggedInMember={loggedInMember} />
          <RemoveMember member={member} loggedInMember={loggedInMember} />
        </View>
      </View>
    </ColorRow>
  );
}
