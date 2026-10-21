'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { type AutoEvent } from '~/types/events';

export const BASE_EVENT_TAB = 'Base';

type AutoEventContextValue = {
  /** The league page's open tab */
  tab: string;
  setTab: (_tab: string) => void;
  /** The auto event the base event form is filled from */
  activeAutoEvent: AutoEvent | null;
  /** Open the base event form filled from an auto event */
  applyAutoEvent: (_autoEvent: AutoEvent) => void;
  clearAutoEvent: () => void;
};

const AutoEventContext = createContext<AutoEventContextValue>({
  tab: 'scores',
  setTab: () => undefined,
  activeAutoEvent: null,
  applyAutoEvent: () => undefined,
  clearAutoEvent: () => undefined,
});

/**
  * Shares the league page's tab and the auto event being accepted, so the auto events
  * panel can open the base event form already filled in.
  */
export function AutoEventProvider({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [tab, setTab] = useState(defaultTab);
  const [activeAutoEvent, setActiveAutoEvent] = useState<AutoEvent | null>(null);

  const applyAutoEvent = useCallback((autoEvent: AutoEvent) => {
    setActiveAutoEvent(autoEvent);
    setTab(BASE_EVENT_TAB);
  }, []);
  const clearAutoEvent = useCallback(() => setActiveAutoEvent(null), []);

  const value = useMemo(
    () => ({ tab, setTab, activeAutoEvent, applyAutoEvent, clearAutoEvent }),
    [tab, activeAutoEvent, applyAutoEvent, clearAutoEvent]
  );

  return <AutoEventContext.Provider value={value}>{children}</AutoEventContext.Provider>;
}

export function useAutoEventContext() {
  return useContext(AutoEventContext);
}
