import React, { useCallback, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/expo';
import { View, Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useFonts } from '@expo-google-fonts/roboto/useFonts';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import Button from '~/components/common/button';

interface GoogleAuthProps {
  type: 'sign-in' | 'sign-up';
}

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuth({ type }: GoogleAuthProps) {
  const router = useRouter();
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();

  const taskRoute = type === 'sign-in' ? '/sign-in/tasks' : '/sign-up/tasks';

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'trialbyfire', path: 'callback' }),
      });

      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              router.push(taskRoute);
              return;
            }
            router.replace('/');
          },
        });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [router, startSSOFlow, taskRoute]);

  return <GoogleButton onPress={onPress} type={type} />;
}

interface GoogleButtonProps {
  type: 'sign-in' | 'sign-up';
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

function GoogleButton({
  type,
  onPress,
  disabled = false,
  className = 'w-1/2',
}: GoogleButtonProps) {
  useFonts({ Roboto_500Medium });
  const buttonText = type === 'sign-in' ? 'Sign in with Google' : 'Sign up with Google';
  return (
    <Button
      className={`${className} bg-[#F2F2F2] active:bg-[#EDD9BF] transition-all h-[40px] items-center justify-center rounded-full`}
      onPress={onPress}
      disabled={disabled}>
      <View className='flex-row items-center'>
        <View className='mr-[4px]'>
          <GoogleLogo />
        </View>
        <Text
          className='font-semibold tracking-tight'
          allowFontScaling={false}
          style={{ fontSize: 13 }}>
          {buttonText}
        </Text>
      </View>
    </Button>
  );
}

function GoogleLogo() {
  return (
    <Svg width={10} height={10} viewBox='0 0 48 48'>
      <Path
        fill='#EA4335'
        d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z' />
      <Path
        fill='#4285F4'
        d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z' />
      <Path
        fill='#FBBC05'
        d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z' />
      <Path
        fill='#34A853'
        d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z' />
      <Path fill='none' d='M0 0h48v48H0z' />
    </Svg>
  );
}

export default GoogleAuth;
