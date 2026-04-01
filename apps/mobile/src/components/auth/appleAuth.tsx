import React, { useCallback, useRef } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSignInWithApple } from '@clerk/expo/apple';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';

interface AppleAuthProps {
  type: 'sign-in' | 'sign-up';
}

export function AppleAuth({ type }: AppleAuthProps) {
  const router = useRouter();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const pendingSignUpRef = useRef<any>(null);

  const buttonType = type === 'sign-in'
    ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
    : AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP;

  const finalize = useCallback(
    async (sessionId: string, setActive: any) => {
      await setActive({
        session: sessionId,
        navigate: async ({ session }: any) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            router.push(type === 'sign-in' ? '/sign-in/tasks' : '/sign-up/tasks');
            return;
          }
          router.replace('/');
        },
      });
    },
    [router, type],
  );

  const promptForUsername = useCallback(() => {
    Alert.prompt(
      'Choose a Username',
      'Pick a username to finish setting up your account.',
      (input) => {
        const alert = async () => {
          const username = input?.trim();
          if (!username) {
            Alert.alert('Error', 'Username is required.', [
              { text: 'Try Again', onPress: promptForUsername },
              { text: 'Cancel', style: 'cancel' },
            ]);
            return;
          }

          try {
            const { signUp, setActive } = pendingSignUpRef.current;
            const result = await signUp.update({ username });

            if (result.status === 'complete' && result.createdSessionId) {
              pendingSignUpRef.current = null;
              await finalize(result.createdSessionId, setActive);
            } else {
              Alert.alert('Error', 'Could not complete sign-up. Please try again.');
            }
          } catch (err: any) {
            const message =
              err?.errors?.[0]?.longMessage ||
              err?.errors?.[0]?.message ||
              'Invalid username. Please try another.';
            Alert.alert('Error', message, [
              { text: 'Try Again', onPress: promptForUsername },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }
        };
        alert();
      },
      'plain-text',
      '',
      'username',
    );
  }, [finalize]);

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive, signUp } =
        await startAppleAuthenticationFlow();

      if (createdSessionId && setActive) {
        await finalize(createdSessionId, setActive);
        return;
      }

      if (signUp && signUp.missingFields?.includes('username')) {
        pendingSignUpRef.current = { signUp, setActive };
        promptForUsername();
        return;
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', 'Something went wrong. Please try again.');
    }
  }, [startAppleAuthenticationFlow, finalize, promptForUsername]);

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={buttonType}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={20}
      style={{ width: '50%', height: 40 }}
      onPress={onPress} />
  );
}

export default AppleAuth;
