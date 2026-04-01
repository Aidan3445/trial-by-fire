import { useCallback, useState } from 'react';
import { type ReactNode } from 'react';

export interface SearchableOption<T extends string | number> {
  value: T | null;
  label: string;
  disabled?: boolean;
  renderLabel?: () => ReactNode;
}

export function useSearchableSelect<T extends string | number>(
  overrideState?: [boolean, (_state: boolean) => void]
) {
  const state = useState(false);
  const [isVisible, setIsVisible] = overrideState ?? state;
  const [searchText, setSearchText] = useState('');

  const openModal = useCallback(() => {
    setIsVisible(true);
  }, [setIsVisible]);

  const closeModal = useCallback(() => {
    setIsVisible(false);
    // eslint-disable-next-line no-undef
    setTimeout(() => {
      // Delay clearing search text to allow modal close animation to finish
      setSearchText('');
    }, 100);
  }, [setIsVisible]);

  const getValueForNull = (sampleValue: T, index: number): T => {
    if (typeof sampleValue === 'number') {
      return -1 * (index + 1) as T; // Return negative numbers for null values
    } else {
      return `__null_option_${index}__` as T; // Return unique string for null values
    }
  };

  const filterOptions = (options: SearchableOption<T>[]) => {
    const sampleValue = options.find(option => option.value !== null)?.value;

    return options.filter(option =>
      option.value === null ||
      option.label.toLowerCase().includes(searchText.toLowerCase()))
      .map((option, index) => {
        if (option.value === null) {
          return {
            ...option,
            value: getValueForNull(sampleValue as T, index)
          };
        }
        return option;
      });
  };


  return { isVisible, searchText, setSearchText, openModal, closeModal, filterOptions };
}
