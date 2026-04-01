import { useState, useCallback, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { cn } from '~/lib/utils';

interface ScrollContainerProps {
  children: (
    _onSectionLayout: (_label: string, _y: number) => void,
    _onRowLayout: (_id: string, _y: number, _height: number, _node: ReactNode) => void,
  ) => ReactNode;
  edit?: boolean;
  hideAll?: boolean;
  filteredRowIds: Set<string>;
}

export default function EpisodeScrollContainer({ children, edit, hideAll, filteredRowIds }: ScrollContainerProps) {
  const [labels, setLabels] = useState<Record<string, number>>({});
  const [rowOverlays, setRowOverlays] = useState<Record<string, { y: number; height: number; node: ReactNode }>>({});

  const onSectionLayout = useCallback((label: string, y: number) => {
    setLabels((prev) => (prev[label] === y ? prev : { ...prev, [label]: y }));
  }, []);

  const onRowLayout = useCallback((id: string, y: number, height: number, node: ReactNode) => {
    setRowOverlays((prev) => {
      const ex = prev[id];
      if (ex?.y === y && ex?.height === height) return prev;
      return { ...prev, [id]: { y, height, node } };
    });
  }, []);

  return (
    <View style={{ position: 'relative' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}>
        <View className='min-w-full'>
          {children(onSectionLayout, onRowLayout)}
        </View>
      </ScrollView>

      {/* Sticky event name overlays — zIndex 5 so section labels (10) appear on top */}
      {!hideAll && (
        <>
          {Object.entries(rowOverlays)
            .filter(([id]) => filteredRowIds.has(id))
            .map(([id, { y, height, node }]) => (
              <View key={id} style={{ position: 'absolute', top: y, left: 0, height, zIndex: 5 }}>
                {node}
              </View>
            ))}

          {/* Floating section labels */}
          {Object.entries(labels).map(([label, y]) => (
            <View
              key={label}
              className={cn('bg-white pl-4 justify-center border-b-2 border-primary/20',
                edit ? 'w-56' : 'w-44')}
              style={{ position: 'absolute', top: y, left: 0, right: 0, height: 29, zIndex: 10 }}
              pointerEvents='none'>
              <View className={cn('h-full justify-center Streaks border-r border-secondary',
                edit ? 'w-52' : 'w-40'
              )}>
                <Text
                  allowFontScaling={false}
                  className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  {label}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

