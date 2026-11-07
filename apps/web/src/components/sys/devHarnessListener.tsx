'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { DEV_HARNESS_KEY, useDevHarness } from '~/hooks/helpers/useDevHarness';

/**
 * Dev only: polls the dev harness and, whenever its state changes (override applied,
 * toggled, reset or broadcast switched), throws away every cached query so all data
 * is refetched from the (now overridden or restored) API responses.
 * Loaded from the root layout behind a NODE_ENV check.
 */
export default function DevHarnessListener() {
  const { data } = useDevHarness();
  const queryClient = useQueryClient();
  const router = useRouter();
  const lastVersion = useRef<number | null>(null);

  const version = data?.version;
  useEffect(() => {
    if (version === undefined) return;
    if (lastVersion.current !== null && lastVersion.current !== version) {
      void queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== DEV_HARNESS_KEY[0] });
      router.refresh();
    }
    lastVersion.current = version;
  }, [version, queryClient, router]);

  return null;
}
