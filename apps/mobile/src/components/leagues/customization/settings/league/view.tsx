import EditMember from '~/components/leagues/predraft/settings/editMember';
import LeagueDetails from '~/components/leagues/customization/settings/league/details';
import ManageMembers from '~/components/leagues/customization/settings/league/manageMembers/view';
import DeleteLeague from '~/components/leagues/customization/settings/league/delete';

interface LeagueSettingsProps {
  isAdmin: boolean;
  isOwner: boolean;
}

export default function LeagueSettings({ isAdmin, isOwner }: LeagueSettingsProps) {
  return (
    <>
      <EditMember />
      {isOwner && <LeagueDetails />}
      {(isAdmin || isOwner) && <ManageMembers />}
      {isOwner && <DeleteLeague />}
    </>
  );
}
