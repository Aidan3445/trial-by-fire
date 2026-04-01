import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { usePendingMembers } from '~/hooks/leagues/query/usePendingMembers';
import Modal from '~/components/common/modal';
import ColorRow from '~/components/shared/colorRow';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';

interface ManagePendingMembersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManagePendingMembers({ isOpen, onClose }: ManagePendingMembersProps) {
  const { data: pendingMembers, admitMember, isAdmitting } = usePendingMembers();
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());

  const members = pendingMembers?.members ?? [];
  const allSelected = members.length > 0 && selectedMembers.size === members.length;

  if (members.length === 0) return null;

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.memberId)));
    }
  };

  const handleSubmit = () => {
    if (selectedMembers.size === 0) return;

    void (async () => {
      await Promise.all(Array.from(selectedMembers).map((id) => admitMember(id)));
      setSelectedMembers(new Set());
      onClose();
    })();
  };

  return (
    <Modal visible={isOpen} onClose={onClose}>
      <View className='gap-4'>
        {/* Header */}
        <View className='gap-2'>
          <View className='flex-row items-center gap-3'>
            <View className='h-6 w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              Pending Members
            </Text>
          </View>
          <Text className='text-base text-muted-foreground'>
            Select which pending members to admit to the league:
          </Text>
        </View>

        {/* Select All */}
        <Pressable
          className='rounded-lg border-2 border-primary/20 bg-card px-3 py-2 active:opacity-80'
          onPress={toggleAll}>
          <Text className='text-center text-sm font-semibold text-foreground'>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </Pressable>

        {/* Members List */}
        <View className='gap-2'>
          {members.map((member) => {
            const isSelected = selectedMembers.has(member.memberId);

            return (
              <Pressable key={member.memberId} onPress={() => toggleMember(member.memberId)}>
                <ColorRow
                  className={cn(
                    'flex-row items-center rounded-lg px-3 py-2',
                    isSelected && 'border-2 border-primary/30'
                  )}
                  color={member.color}>
                  <Text className='flex-1 text-base font-semibold'>{member.displayName}</Text>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </ColorRow>
              </Pressable>
            );
          })}
        </View>

        {/* Actions */}
        <View className='flex-row gap-2'>
          <Pressable
            className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'
            onPress={onClose}>
            <Text className='text-center font-semibold text-foreground'>Admit Later</Text>
          </Pressable>
          <Pressable
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              (selectedMembers.size === 0 || isAdmitting) && 'opacity-50'
            )}
            disabled={selectedMembers.size === 0 || isAdmitting}
            onPress={handleSubmit}>
            <Text className='text-center font-semibold text-primary-foreground'>
              {isAdmitting ? 'Admitting...' : `Admit (${selectedMembers.size})`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
