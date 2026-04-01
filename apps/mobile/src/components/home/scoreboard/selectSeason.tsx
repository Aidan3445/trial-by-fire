import { Text } from 'react-native';
import Button from '~/components/common/button';
import { Ellipsis } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SearchableSelect from '~/components/common/searchableSelect';
import { type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { useState } from 'react';

interface SelectSeasonProps {
  seasons: SearchableOption<string>[];
  value: string;
  setValue: (_: string) => void;
  someHidden?: boolean;
  className?: string;
}

export default function SelectSeason({ seasons, value, setValue, someHidden, className }: SelectSeasonProps) {
  const router = useRouter();
  const modalState = useState(false);
  const [, openModal] = modalState;

  const footerComponent =
    someHidden !== undefined ? (
      <Button
        className='mb-4 mt-2 rounded bg-muted px-2 py-3'
        onPress={() => {
          router.push('/playground');
          openModal(false);
        }}>
        <Text className='text-center text-xs'>
          {someHidden ? 'See all seasons' : 'Try scoring playground'}
        </Text>
      </Button>
    ) : undefined;

  return (
    <SearchableSelect<string>
      overrideState={modalState}
      options={seasons}
      selectedValue={value}
      onSelect={setValue}
      placeholder='Search seasons...'
      emptyMessage='No seasons found.'
      footerComponent={footerComponent}
      asChild>
      <Button
        className={cn('absolute right-3 top-1', className)}
        onPress={() => openModal(true)}>
        <Ellipsis size={32} color={colors.primary} />
      </Button>
    </SearchableSelect>
  );
}
