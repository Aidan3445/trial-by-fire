import { View, Text, TextInput, ScrollView } from 'react-native';
import { useSearchableSelect, type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import { type ReactNode } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

interface SearchableSelectProps<T extends string | number> {
  options: SearchableOption<T>[];
  selectedValue?: T;
  onSelect: (_: T) => void;
  overrideState?: [boolean, (_open: boolean) => void];
  placeholder?: string;
  emptyMessage?: string;
  footerComponent?: ReactNode;
  children?: ReactNode;
  asChild?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  overrideState,
  placeholder = 'Search...',
  emptyMessage = 'No options found.',
  footerComponent,
  children,
  asChild,
  disabled,
  className,
}: SearchableSelectProps<T>) {
  const { isVisible, searchText, setSearchText, openModal, closeModal, filterOptions } =
    useSearchableSelect<T>(overrideState);

  const filtered = filterOptions(options);

  const renderTrigger = () => {
    if (asChild && !children)
      throw new Error('SearchableSelect: asChild is true but no children were provided.');
    if (asChild && children) return children;

    if (children) {
      return (
        <Button
          className={cn(
            'w-full flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 h-10 active:bg-primary/10',
            className
          )}
          disabled={disabled}
          onPress={openModal}>
          {children}
          <ChevronDown size={18} color={colors['muted-foreground']} />
        </Button>
      );
    }

    const selectedOption = options.find((option) => option.value === selectedValue);
    return (
      <Button
        className={cn(
          'w-full flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 h-10 active:bg-primary/10',
          className
        )}
        disabled={disabled}
        onPress={openModal}>
        {selectedOption ? (
          selectedOption.renderLabel ? (
            selectedOption.renderLabel()
          ) : (
            <Text className='font-medium text-foreground'>{selectedOption.label}</Text>
          )
        ) : (
          <Text className='text-muted-foreground'>Select...</Text>
        )}
        <ChevronDown size={18} color={colors['muted-foreground']} />
      </Button>
    );
  };

  return (
    <>
      <Modal visible={isVisible} onClose={closeModal}>
        {/* Search Input */}
        <View className='w-full flex-row items-center rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-12 text-lg leading-tight overflow-hidden gap-2'>
          <Search size={18} color={colors['muted-foreground']} />
          <TextInput
            className='flex-1 text-lg leading-tight overflow-hidden py-0'
            placeholder={placeholder}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={colors['muted-foreground']}
          />
        </View>

        {/* Options List */}
        <ScrollView
          className='mt-2 max-h-64'
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View className='items-center py-8'>
              <Text className='text-muted-foreground'>{emptyMessage}</Text>
            </View>
          ) : (
            filtered.map((item, index) => {
              const key = item.value != null ? String(item.value) : `header-${index}`;

              if (!item.value) {
                return (
                  <View key={key} className='px-3 py-2'>
                    <Text className='text-center font-bold tracking-widest text-primary'>
                      {item.label}
                    </Text>
                  </View>
                );
              }

              const isSelected = selectedValue === item.value;
              return (
                <Button
                  key={key}
                  className={cn(
                    'flex-row items-center rounded-lg px-3 py-2.5 active:bg-primary/10',
                    isSelected ? 'bg-primary/10' : 'bg-primary/5',
                    item.disabled && 'opacity-50',
                    index > 0 && 'mt-1'
                  )}
                  disabled={item.disabled}
                  onPress={() => {
                    if (item.disabled) return;
                    onSelect(item.value!);
                    closeModal();
                  }}>
                  <View className='w-6'>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </View>
                  {item.renderLabel ? (
                    item.renderLabel()
                  ) : (
                    <Text
                      className={cn(
                        'text-base flex-1',
                        isSelected ? 'font-semibold text-primary' : 'text-foreground'
                      )}>
                      {item.label}
                    </Text>
                  )}
                </Button>
              );
            })
          )}
          {footerComponent}
        </ScrollView>
      </Modal>
      {renderTrigger()}
    </>
  );
}
