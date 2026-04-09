import { type EnrichedEvent } from '@survivor/types';
import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { cn } from '~/lib/utils';
import StickyCell from '~/components/shared/eventTimeline/table/row/stickyCell';

interface ScrollContainerProps {
  children: (
    _onSectionLayout: (_label: string, _y: number) => void,
    _onRowLayout: (
      _id: string, _y: number, _height: number, _event: EnrichedEvent, _seasonId?: number
    ) => void
  ) => ReactNode;
  edit?: boolean;
  hideAll?: boolean;
  filteredRowIds: Set<string>;
}

type RowOverlay = { y: number; height: number; event: EnrichedEvent; seasonId?: number };

export default function EpisodeScrollContainer({ children, edit, hideAll, filteredRowIds }: ScrollContainerProps) {
  const [labels, setLabels] = useState<Record<string, number>>({});
  const [rowOverlays, setRowOverlays] = useState<Record<string, RowOverlay>>({});
  const [generation, setGeneration] = useState(0);

  // Snapshot refs — hold old overlays to display during remount transition
  const snapshotRowsRef = useRef<Record<string, RowOverlay>>({});
  const snapshotLabelsRef = useRef<Record<string, number>>({});
  const isTransitioningRef = useRef(false);

  // When filteredRowIds changes: snapshot current overlays, clear state, force remount
  const prevFilteredRef = useRef(filteredRowIds);
  useEffect(() => {
    if (prevFilteredRef.current !== filteredRowIds) {
      prevFilteredRef.current = filteredRowIds;
      // Snapshot current overlays to keep displaying during transition
      setRowOverlays((prev) => {
        snapshotRowsRef.current = prev;
        return {};
      });
      setLabels((prev) => {
        snapshotLabelsRef.current = prev;
        return {};
      });
      isTransitioningRef.current = true;
      // Changing generation key forces full remount → all onLayout callbacks fire
      setGeneration((g) => g + 1);
    }
  }, [filteredRowIds]);

  // Batch onLayout updates — accumulate in refs, flush once per frame
  const pendingRowUpdatesRef = useRef<Record<string, RowOverlay>>({});
  const pendingLabelUpdatesRef = useRef<Record<string, number>>({});
  // eslint-disable-next-line no-undef
  const rafIdRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  const flushUpdates = useCallback(() => {
    const rowUpdates = pendingRowUpdatesRef.current;
    const labelUpdates = pendingLabelUpdatesRef.current;
    pendingRowUpdatesRef.current = {};
    pendingLabelUpdatesRef.current = {};
    rafIdRef.current = null;

    // End transition — next render will use real state instead of snapshot
    isTransitioningRef.current = false;
    snapshotRowsRef.current = {};
    snapshotLabelsRef.current = {};

    if (Object.keys(rowUpdates).length > 0) {
      setRowOverlays((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [id, entry] of Object.entries(rowUpdates)) {
          if (!prev[id] || prev[id].y !== entry.y || prev[id].height !== entry.height) {
            next[id] = entry;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }

    if (Object.keys(labelUpdates).length > 0) {
      setLabels((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [label, y] of Object.entries(labelUpdates)) {
          if (prev[label] !== y) {
            next[label] = y;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line no-undef
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const scheduleFlush = useCallback(() => {
    if (!rafIdRef.current) {
      // eslint-disable-next-line no-undef
      rafIdRef.current = requestAnimationFrame(flushUpdates);
    }
  }, [flushUpdates]);

  const onSectionLayout = useCallback((label: string, y: number) => {
    pendingLabelUpdatesRef.current[label] = y;
    scheduleFlush();
  }, [scheduleFlush]);

  const onRowLayout = useCallback(
    (id: string, y: number, height: number, event: EnrichedEvent, seasonId?: number) => {
      pendingRowUpdatesRef.current[id] = { y, height, event, seasonId };
      scheduleFlush();
    }, [scheduleFlush]);

  // During transition, display snapshot overlays; otherwise display current state
  const displayOverlays = isTransitioningRef.current ? snapshotRowsRef.current : rowOverlays;
  const displayLabels = isTransitioningRef.current ? snapshotLabelsRef.current : labels;

  return (
    <View style={{ position: 'relative' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}>
        <View key={generation} className='min-w-full'>
          {children(onSectionLayout, onRowLayout)}
        </View>
      </ScrollView>

      {/* Sticky event name overlays — zIndex 5 so section labels (10) appear on top */}
      {!hideAll && (
        <>
          {Object.entries(displayOverlays)
            .filter(([id]) => filteredRowIds.has(id))
            .map(([id, { y, height, event, seasonId }]) => (
              <View key={id} style={{ position: 'absolute', top: y, left: 0, height, zIndex: 5 }}>
                <StickyCell
                  event={event}
                  seasonId={seasonId}
                  edit={edit}
                  isMock={event.eventId === undefined} />
              </View>
            ))}

          {/* Floating section labels */}
          {Object.entries(displayLabels).map(([label, y]) => (
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
