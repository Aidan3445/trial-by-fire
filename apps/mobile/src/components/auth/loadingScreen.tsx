import { type ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '~/lib/utils';
import Logo from '~/components/shared/logo';

interface LoadingScreenProps {
  noBounce?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function LoadingScreen({ noBounce, className, children }: LoadingScreenProps) {
  return (
    <SafeAreaView className='flex-1 justify-around bg-background p-6'>
      <Logo className={cn(!noBounce && 'animate-bounce', className)} />
      {children}
    </SafeAreaView>
  );
}
