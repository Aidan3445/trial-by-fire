'use client';

import { type ComponentPropsWithoutRef } from 'react';
import { Tabs } from '~/components/common/tabs';
import { useAutoEventContext } from '~/context/autoEventContext';

/**
  * The league page tabs, controlled so accepting a draft can switch to the base event tab
  */
export default function LeagueTabs(props: Omit<ComponentPropsWithoutRef<typeof Tabs>, 'value' | 'onValueChange' | 'defaultValue'>) {
  const { tab, setTab } = useAutoEventContext();
  return <Tabs {...props} value={tab} onValueChange={setTab} />;
}
