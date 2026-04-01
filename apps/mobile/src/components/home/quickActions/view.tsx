import { Text, View } from 'react-native';
import { ListPlus, Users, ChevronRight, Recycle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ResponsiveGrid } from 'react-native-flexible-grid';
import Button from '~/components/common/button';
import PendingLeagues from '~/components/home/quickActions/pendingLeagues';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { type PublicLeague } from '~/types/leagues';
import { type ReactNode } from 'react';

interface QuickActionsProps {
  showClone?: boolean;
  pendingLeagues?: PublicLeague[];
  className?: string;
}

export default function QuickActions({ showClone, pendingLeagues, className }: QuickActionsProps) {
  const router = useRouter();
  const hasPending = pendingLeagues && pendingLeagues.length > 0;

  const buttonClass =
    'flex-1 flex-row items-center rounded-lg border-2 border-primary/30 bg-accent p-2 active:bg-primary/20';

  type GridItem = {
    id: string;
    widthRatio: number;
    heightRatio: number;
  } & (
      | { type: 'button'; icon: ReactNode; label: string; subtitle: string; onPress: () => void }
      | { type: 'pending'; pendingLeagues: PublicLeague[] }
    );

  const items: GridItem[] = [
    {
      id: 'create',
      type: 'button',
      widthRatio: 1,
      heightRatio: 1,
      icon: <ListPlus size={20} color={colors.primary} />,
      label: 'Create League',
      subtitle: 'Start a new league',
      onPress: () => router.push('/(modals)/create'),
    },
    {
      id: 'join',
      type: 'button',
      widthRatio: 1,
      heightRatio: 1,
      icon: <Users size={20} color={colors.primary} />,
      label: 'Join League',
      subtitle: 'Enter an invite code',
      onPress: () => router.push('/(modals)/join'),
    },
    ...(showClone
      ? [{
        id: 'clone',
        type: 'button' as const,
        widthRatio: hasPending ? 1 : 2,
        heightRatio: 1,
        icon: <Recycle size={20} color={colors.primary} />,
        label: 'Clone League',
        subtitle: 'Run it back',
        onPress: () => router.push('/(modals)/recreate'),
      }]
      : []),
    ...(hasPending
      ? [{
        id: 'pending',
        type: 'pending' as const,
        widthRatio: showClone ? 1 : 2,
        heightRatio: 1,
        pendingLeagues: pendingLeagues!,
      }]
      : []),
  ];

  return (
    <View className={cn('w-full p-1', className)}>
      <ResponsiveGrid
        maxItemsPerColumn={2}
        itemUnitHeight={60}
        data={items}
        showScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: GridItem }) => {
          if (item.type === 'pending') {
            return (
              <View className='flex-1 p-0.5'>
                <PendingLeagues
                  className={buttonClass}
                  pendingLeagues={item.pendingLeagues} />
              </View>
            );
          }
          return (
            <View className='flex-1 p-0.5'>
              <Button
                className={buttonClass}
                onPress={item.onPress}>
                <View className='mr-1 h-10 w-10 items-center justify-center rounded-full bg-primary/20'>
                  {item.icon}
                </View>
                <View className='flex-1'>
                  <Text allowFontScaling={false} className='font-bold text-foreground'>
                    {item.label}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className='text-xs text-muted-foreground'>
                    {item.subtitle}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.primary} />
              </Button>
            </View>
          );
        }} />
    </View>
  );
}
