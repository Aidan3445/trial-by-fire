import { View, Text, TextInput, ScrollView } from 'react-native';
import { useSearchableSelect, type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import { type ReactNode } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

interface SearchableMultiSelectProps<T extends string | number> {
  options: SearchableOption<T>[];
  selectedValues?: T[];
  onToggleSelect: (_: T[]) => void;
  overrideState?: [boolean, (_open: boolean) => void];
  placeholder?: string;
  emptyMessage?: string;
  footerComponent?: ReactNode;
  children?: ReactNode;
  asChild?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableMultiSelect<T extends string | number>({
  options,
  selectedValues,
  onToggleSelect,
  overrideState,
  placeholder = 'Search...',
  emptyMessage = 'No options found.',
  footerComponent,
  children,
  asChild,
  disabled,
  className,
}: SearchableMultiSelectProps<T>) {
  const { isVisible, searchText, setSearchText, openModal, closeModal, filterOptions } =
    useSearchableSelect<T>(overrideState);

  const isSelected = (value: T) => selectedValues?.includes(value);

  const handleToggleSelect = (value: T) => {
    if (isSelected(value)) {
      onToggleSelect(selectedValues?.filter((v) => v !== value) ?? []);
    } else {
      onToggleSelect([...(selectedValues ?? []), value]);
    }
  };

  const filtered = filterOptions(options);

  const renderTrigger = () => {
    if (asChild && !children)
      throw new Error('SearchableMultiSelect: asChild is true but no children were provided.');
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
          <View className='w-max flex-row items-center gap-1'>
            {selectedValues && selectedValues.length > 0 && (
              <Button
                className='rounded-full p-0.5 active:bg-primary/20'
                disabled={disabled}
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleSelect([]);
                }}>
                <X size={16} color={colors['muted-foreground']} />
              </Button>
            )}
            <ChevronDown size={18} color={colors['muted-foreground']} />
          </View>
        </Button>
      );
    }

    const selectedCount = selectedValues?.length ?? 0;
    const selectedLabels = options
      .filter((opt) => opt.value && selectedValues?.includes(opt.value))
      .map((opt) => opt.label);

    return (
      <Button
        className={cn(
          'w-full flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 h-10 active:bg-primary/10',
          className
        )}
        disabled={disabled}
        onPress={openModal}>
        <Text
          className={
            selectedCount === 0 ? 'text-muted-foreground' : 'font-medium text-foreground'
          }>
          {selectedCount === 0
            ? 'Select...'
            : selectedCount === 1
              ? selectedLabels[0]
              : `${selectedCount} selected`}
        </Text>
        <View className='flex-row items-center gap-1'>
          {selectedCount > 0 && (
            <Button
              className='rounded-full p-0.5 active:bg-primary/20'
              disabled={disabled}
              onPress={(e) => {
                e.stopPropagation();
                onToggleSelect([]);
              }}>
              <X size={16} color={colors['muted-foreground']} />
            </Button>
          )}
          <ChevronDown size={18} color={colors['muted-foreground']} />
        </View>
      </Button>
    );
  };

  return (
    <>
      <Modal visible={isVisible} onClose={closeModal}>
        {/* Header with Search and Done */}
        <View className='flex-row items-center gap-2'>
          <View className='flex-1 flex-row items-center rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-12 text-lg leading-tight overflow-hidden gap-2'>
            <Search size={18} color={colors['muted-foreground']} />
            <TextInput
              className='flex-1 text-lg leading-tight overflow-hidden py-0'
              placeholder={placeholder}
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor={colors['muted-foreground']}
            />
          </View>
          <Button
            className='rounded-lg bg-primary px-4 py-2.5 active:opacity-80'
            onPress={closeModal}>
            <Text className='font-semibold text-white'>Done</Text>
          </Button>
        </View>

        {/* Selected Count */}
        {selectedValues && selectedValues.length > 0 ? (
          <View className='flex-row items-center justify-between'>
            <Text className='text-sm text-muted-foreground'>
              {selectedValues.length} selected
            </Text>
            <Button onPress={() => onToggleSelect([])}>
              <Text className='text-sm font-medium text-primary'>Clear all</Text>
            </Button>
          </View>
        ) : (
          <View>
            <Text className='text-sm text-muted-foreground'>No options selected</Text>
          </View>
        )}

        {/* Options List */}
        <ScrollView className='max-h-64' nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View className='items-center py-8'>
              <Text className='text-muted-foreground'>{emptyMessage}</Text>
            </View>
          ) : (
            filtered.map((item, index) => {
              const key = item.value != null ? String(item.value) : `header-${index}`;

              if (
                !item.value ||
                (typeof item.value === 'string'
                  ? item.value.includes('__null_option_')
                  : (item.value as number) < 0)
              ) {
                return (
                  <View key={key} className='px-3 py-2'>
                    <Text className='text-center font-bold tracking-widest text-primary'>
                      {item.label}
                    </Text>
                  </View>
                );
              }

              const selected = isSelected(item.value);
              return (
                <Button
                  key={key}
                  className={cn(
                    'flex-row items-center rounded-lg px-3 py-2.5 active:bg-primary/10',
                    selected ? 'bg-primary/10' : 'bg-primary/5',
                    item.disabled && 'opacity-50',
                    index > 0 && 'mt-1'
                  )}
                  disabled={item.disabled}
                  onPress={() => {
                    if (item.disabled) return;
                    handleToggleSelect(item.value!);
                  }}>
                  <View
                    className={cn(
                      'mr-3 h-5 w-5 items-center justify-center rounded border-2',
                      selected ? 'border-primary bg-primary' : 'border-primary/30 bg-transparent'
                    )}>
                    {selected && <Check size={14} color='white' />}
                  </View>
                  {item.renderLabel ? (
                    item.renderLabel()
                  ) : (
                    <Text
                      className={cn(
                        'text-base flex-1 text-foreground',
                        selected && 'font-semibold'
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
