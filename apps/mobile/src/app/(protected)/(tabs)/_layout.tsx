'use client';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Animated, Image, Platform } from 'react-native';
import LoadingScreen from '~/components/auth/loadingScreen';
import { LeaguesIcon, PlaygroundIcon, SeasonsIcon, UserIcon } from '~/components/icons/generated';
import { useNotificationRouting } from '~/hooks/routing/useNotificationRouting';
import useFadeLoading from '~/hooks/ui/useFadeLoading';
import { useLeagues } from '~/hooks/user/useLeagues';
import { colors } from '~/lib/colors';

const HomeImage = require('~/assets/LogoTorch.png');

export default function TabLayout() {
  useNotificationRouting();
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading } = useLeagues();
  const { showLoading, fadeAnim } = useFadeLoading({ isLoading });

  const isLeaguesPath = pathname.startsWith('/leagues');
  const isOnLeaguesIndex = pathname === '/leagues';


  return (
    <>
      <Tabs
        screenOptions={{
          lazy: false,
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.secondary,
          tabBarStyle: {
            backgroundColor: colors.navigation,
            height: Platform.OS === 'android' ? 60 : 80,
            paddingBottom: 0,
            paddingTop: Platform.OS === 'android' ? 4 : 0,
            shadowColor: 'transparent',
          },
          tabBarLabelStyle: { fontSize: 12 },
          tabBarAllowFontScaling: false,
        }}>
        <Tabs.Screen
          name='index'
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <Image
                className='h-9 w-9'
                resizeMode='contain'
                source={HomeImage}
                style={{ tintColor: color }} />
            ),
          }} />
        <Tabs.Screen
          name='leagues'
          listeners={{
            tabPress: (e) => {
              // If we're already on a leagues sub-page (not index), prevent default and navigate to index
              if (isLeaguesPath && !isOnLeaguesIndex) {
                e.preventDefault();
                router.dismissTo('/leagues');
              }
              // Otherwise, let default behavior handle it (preserve stack)
            },
          }}
          options={{
            title: 'Leagues',
            tabBarIcon: ({ color }) => (
              <LeaguesIcon color={isLeaguesPath ? colors!.primary : color} size={32} allowFontScaling={false} />
            ),
            tabBarLabelStyle: {
              fontSize: 12,
              color: isLeaguesPath ? colors!.primary : colors!.secondary,
            }
          }} />
        <Tabs.Screen
          name='seasons'
          options={{
            title: 'Seasons',
            tabBarIcon: ({ color }) => (
              <SeasonsIcon color={color} size={32} allowFontScaling={false} />
            ),
          }} />
        <Tabs.Screen
          name='playground'
          options={{
            title: 'Playground',
            tabBarIcon: ({ color }) => (
              <PlaygroundIcon color={color} size={32} allowFontScaling={false} />
            ),
          }} />
        <Tabs.Screen
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <UserIcon color={color} size={32} strokeWidth={0.5} allowFontScaling={false} />
            ),
          }} />
      </Tabs>

      {showLoading && (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className='absolute inset-0 z-50 bg-background'
          pointerEvents='auto'>
          <LoadingScreen />
        </Animated.View>
      )}
    </>
  );
}
