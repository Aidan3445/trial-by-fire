import { type ReactNode } from 'react';
import DonorCrown from '~/components/sys/donation/donorCrown';
import { cn } from '~/lib/utils';

export interface ColorRowProps {
  color?: string;
  loggedIn?: boolean;
  opaque?: boolean;
  // Shows the donor crown in the corner
  donor?: boolean;
  className?: string;
  children: ReactNode;
}

export default function ColorRow({ color, loggedIn, opaque, donor, className, children }: ColorRowProps) {
  return (
    <span
      className={cn(
        'w-full inline-flex p-0.5 gap-4 text-nowrap items-center rounded-md border-t border-b border-r border-transparent',
        loggedIn && 'text-primary',
        donor && 'relative',
        className
      )}
      style={{
        backgroundColor: `${color ?? '#AAAAAA'}${opaque ? '80' : '40'}`,
        borderLeft: `0.25rem solid ${color ?? '#000000'}`,
      }}>
      {children}
      {donor && <DonorCrown self={loggedIn} />}
    </span>
  );
}
