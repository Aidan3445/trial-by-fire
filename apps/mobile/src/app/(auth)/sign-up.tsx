import * as React from 'react';
import {
  Platform, Text, TextInput, TouchableOpacity, View, type TextInputEndEditingEvent,
} from 'react-native';
import { useAuth, useSignUp } from '@clerk/expo';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import AuthCard from '~/components/auth/wrapper';
import AppleAuth from '~/components/auth/appleAuth';
import GoogleAuth from '~/components/auth/googleAuth';

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const router = useRouter();

  const [username, setUsername] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const emailRef = React.useRef<TextInput>(null);
  const passwordRef = React.useRef<TextInput>(null);
  const confirmRef = React.useRef<TextInput>(null);

  const isLoading = fetchStatus === 'fetching';

  // iOS autofill bypasses onChangeText — onEndEditing fires with the correct native value
  const makeEndEditingHandler = React.useCallback(
    (currentValue: string, setter: (_v: string) => void) =>
      (e: TextInputEndEditingEvent) => {
        if (Platform.OS === 'ios') {
          const nativeText = e.nativeEvent.text;
          if (nativeText !== currentValue) {
            setter(nativeText);
          }
        }
      },
    [],
  );

  const onSignUpPress = async () => {
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const { error } = await signUp.password({
      emailAddress: emailAddress.trim().toLowerCase(),
      password: password.trim(),
      username: username.trim(),
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    await signUp.verifications.sendEmailCode();
  };

  const onVerifyPress = async () => {
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            router.push('/sign-in/tasks');
            return;
          }
          router.replace((redirectTo ?? '/') as Href);
        },
      });
    } else {
      console.error('Sign-up attempt not complete:', signUp);
    }
  };

  if (signUp.status === 'complete' || isSignedIn) {
    return null;
  }

  // Show verification screen when email needs verifying and no other fields are missing
  const isPendingVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  if (isPendingVerification) {
    return (
      <AuthCard>
        <View className='mb-8 items-center'>
          <Text className='mb-2 text-3xl font-bold text-primary'>
            Check Your Email
          </Text>
          <Text className='text-center text-lg text-secondary'>
            We sent you a verification code
          </Text>
        </View>

        <View className='gap-y-4'>
          <TextInput
            value={code}
            autoFocus
            placeholder='Enter verification code'
            className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
            autoComplete='one-time-code'
            textContentType='oneTimeCode'
            onChangeText={setCode}
            returnKeyType='done'
            onSubmitEditing={onVerifyPress} />

          {errors.fields.code && (
            <Text className='text-center text-sm text-red-600'>
              {errors.fields.code.message}
            </Text>
          )}

          <TouchableOpacity
            onPress={onVerifyPress}
            disabled={isLoading}
            className={`mt-6 rounded-2xl bg-primary py-4 ${isLoading ? 'opacity-50' : ''}`}>
            <Text className='text-center text-lg font-semibold text-white'>
              Verify
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => signUp.verifications.sendEmailCode()}
            disabled={isLoading}
            className='mt-2 rounded-2xl bg-accent/20 py-4'>
            <Text className='text-center text-lg font-semibold text-primary'>
              Resend Code
            </Text>
          </TouchableOpacity>
        </View>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <View className='items-center'>
        <Text className='mb-2 text-3xl font-bold text-primary'>
          Join Us!
        </Text>
        <Text className='text-lg text-secondary'>
          Create your account
        </Text>
      </View>

      <View className='gap-y-2'>
        <TextInput
          autoCapitalize='none'
          value={username}
          placeholder='Enter username'
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          autoComplete='username-new'
          textContentType='username'
          onChangeText={setUsername}
          onEndEditing={makeEndEditingHandler(username, setUsername)}
          returnKeyType='next'
          onSubmitEditing={() => emailRef.current?.focus()} />
        {errors.fields.username && (
          <Text className='text-sm text-red-600'>
            {errors.fields.username.message}
          </Text>
        )}

        <TextInput
          ref={emailRef}
          autoCapitalize='none'
          value={emailAddress}
          placeholder='Enter email'
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          autoComplete='email'
          textContentType='emailAddress'
          importantForAutofill='yes'
          onChangeText={setEmailAddress}
          onEndEditing={makeEndEditingHandler(emailAddress, setEmailAddress)}
          returnKeyType='next'
          onSubmitEditing={() => passwordRef.current?.focus()} />
        {errors.fields.emailAddress && (
          <Text className='text-sm text-red-600'>
            {errors.fields.emailAddress.message}
          </Text>
        )}

        <TextInput
          ref={passwordRef}
          value={password}
          placeholder='Enter password'
          secureTextEntry
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          autoComplete='new-password'
          textContentType='newPassword'
          importantForAutofill='yes'
          passwordRules='minlength: 8;'
          onChangeText={setPassword}
          onEndEditing={makeEndEditingHandler(password, setPassword)}
          returnKeyType='next'
          onSubmitEditing={() => confirmRef.current?.focus()} />
        {errors.fields.password && (
          <Text className='text-sm text-red-600'>
            {errors.fields.password.message}
          </Text>
        )}

        <TextInput
          ref={confirmRef}
          value={confirmPassword}
          placeholder='Confirm password'
          secureTextEntry
          className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
          autoComplete='new-password'
          textContentType='newPassword'
          importantForAutofill='yes'
          onChangeText={setConfirmPassword}
          onEndEditing={makeEndEditingHandler(confirmPassword, setConfirmPassword)}
          returnKeyType='done'
          onSubmitEditing={onSignUpPress} />

        {formError && (
          <Text className='text-sm text-red-600'>{formError}</Text>
        )}

        <TouchableOpacity
          onPress={onSignUpPress}
          disabled={isLoading}
          className={`mt-6 rounded-full bg-primary h-10 justify-center ${isLoading ? 'opacity-50' : ''}`}>
          <Text className='text-center text-lg font-semibold text-white'>
            Continue
          </Text>
        </TouchableOpacity>

        <Text className='text-center text-secondary'>Or</Text>

        <View className='w-full flex-row items-center gap-2'>
          <AppleAuth type='sign-up' />
          <GoogleAuth type='sign-up' />
        </View>
      </View>

      <View className='mt-8 flex-row items-center justify-center'>
        <Text className='text-base text-secondary'>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className='text-base font-semibold text-primary'>
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </AuthCard>
  );
}
