import { Text } from 'react-native';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';

export default function MemberSelector({
  memberOptions,
  selectedMemberId,
  onSelect,
}: {
  memberOptions: { value: number; label: string; color: string }[];
  selectedMemberId: number | undefined;
  onSelect: (_memberId: number) => void;
}) {
  return (
    <SearchableSelect
      className='w-2/3 mx-auto'
      options={memberOptions.map((m) => ({
        value: m.value,
        label: m.label,
        renderLabel: () => (
          <ColorRow color={m.color} className='w-min px-1'>
            <Text className='text-foreground font-medium'>{m.label}</Text>
          </ColorRow>
        ),
      }))}
      selectedValue={selectedMemberId}
      onSelect={onSelect}
      placeholder='Select Member' />
  );
}
