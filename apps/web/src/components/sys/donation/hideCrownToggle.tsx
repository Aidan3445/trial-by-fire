'use client';

import { Switch } from '~/components/common/switch';
import { useDonationStatus, useHideBadge } from '~/hooks/user/useFunding';
import { cn } from '~/lib/utils';

/**
  * Lets a donor hide their crown from everyone, themselves included
  */
export default function HideCrownToggle({ className }: { className?: string }) {
  const { data: status } = useDonationStatus();
  const { mutate: setHidden } = useHideBadge();

  return (
    <label className={cn('flex items-center justify-between gap-3 text-sm text-primary cursor-pointer', className)}>
      Hide my crown
      <Switch
        checked={status?.hideBadge ?? false}
        disabled={!status}
        onCheckedChange={(hidden) => setHidden(hidden)} />
    </label>
  );
}
