import { useSignIn } from '@clerk/expo';
import { type Href, Link, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputEndEditingEvent,
} from 'react-native';
import React, { useCallback, useRef } from 'react';
import AuthCard from '~/components/auth/wrapper';
import AppleAuth from '~/components/auth/appleAuth';
import GoogleAuth from '~/components/auth/googleAuth';

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  const passwordRef = useRef<TextInput>(null);
  const isLoading = fetchStatus === 'fetching';

  const handlePasswordEndEditing = useCallback(
    (e: TextInputEndEditingEvent) => {
      if (Platform.OS === 'ios') {
        const nativeText = e.nativeEvent.text;
        if (nativeText !== password) {
          setPassword(nativeText);
        }
      }
    },
    [password],
  );

  const handleEmailEndEditing = useCallback(
    (e: TextInputEndEditingEvent) => {
      if (Platform.OS === 'ios') {
        const nativeText = e.nativeEvent.text;
        if (nativeText !== emailAddress) {
          setEmailAddress(nativeText);
        }
      }
    },
    [emailAddress],
  );

  const destination = (redirectTo ?? '/') as Href;

  const finalize = async () => {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          console.log(session?.currentTask);
          router.push('/sign-in/tasks');
          return;
        }
        router.replace(destination);
      },
    });
  };

  const onSignInPress = async () => {
    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === 'complete') {
      await finalize();
    } else if (signIn.status === 'needs_second_factor') {
      // Handle MFA if you add it later
      console.error('MFA required but not implemented');
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  return (
    <AuthCard>
      <View className='items-center'>
        <Text className='mb-2 text-3xl font-bold text-primary'>Welcome Back!</Text>
        <Text className='text-lg text-secondary'>Sign in to continue</Text>
      </View>

      <View className='gap-y-2'>
        <TextInput
          autoCapitalize='none'
          value={emailAddress}
          placeholder='Enter email'
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          placeholderTextColor='#B58553'
          autoComplete='email'
          textContentType='emailAddress'
          importantForAutofill='yes'
          onChangeText={setEmailAddress}
          onEndEditing={handleEmailEndEditing}
          returnKeyType='next'
          onSubmitEditing={() => passwordRef.current?.focus()} />
        {errors.fields.identifier && (
          <Text className='text-sm text-red-600'>
            {errors.fields.identifier.message}
          </Text>
        )}

        <TextInput
          ref={passwordRef}
          value={password}
          placeholder='Enter password'
          secureTextEntry
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          placeholderTextColor='#B58553'
          autoComplete='password'
          textContentType='password'
          importantForAutofill='yes'
          onChangeText={setPassword}
          onEndEditing={handlePasswordEndEditing}
          returnKeyType='done'
          onSubmitEditing={onSignInPress} />
        {errors.fields.password && (
          <Text className='text-sm text-red-600'>
            {errors.fields.password.message}
          </Text>
        )}

        <View className='w-full flex-row items-center gap-2'>
          <AppleAuth type='sign-in' />
          <GoogleAuth type='sign-in' />
        </View>

        <TouchableOpacity
          onPress={onSignInPress}
          disabled={isLoading}
          className={`mb-8 rounded-full bg-primary h-12 justify-center ${isLoading ? 'opacity-50' : ''}`}>
          <Text className='text-center text-lg font-semibold text-white'>Continue</Text>
        </TouchableOpacity>
      </View>

      <Link href='/forgot-password' className='self-start'>
        <Text className='text-base font-semibold text-primary'>Forgot password?</Text>
      </Link>
      <View className='flex-row items-center justify-start'>
        <Text className='text-base text-secondary'>Don't have an account? </Text>
        <Link href={{ pathname: '/sign-up', params: redirectTo ? { redirectTo } : undefined }}>
          <Text className='text-base font-semibold text-primary'>Sign up</Text>
        </Link>
      </View>
    </AuthCard>
  );
}
