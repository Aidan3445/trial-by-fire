import React, { useRef, useState, useCallback } from 'react';
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputEndEditingEvent,
} from 'react-native';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import AuthCard from '~/components/auth/wrapper';

type Step = 'email' | 'code' | 'reset';

export default function ForgotPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const confirmRef = useRef<TextInput>(null);
  const isLoading = fetchStatus === 'fetching';

  const handleEndEditing = useCallback(
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

  const onRequestReset = async () => {
    setFormError('');

    const { error: createError } = await signIn.create({
      identifier: email.trim().toLowerCase(),
    });

    if (createError) {
      console.error(JSON.stringify(createError, null, 2));
      return;
    }

    const { error: sendCodeError } = await signIn.resetPasswordEmailCode.sendCode();

    if (sendCodeError) {
      console.error(JSON.stringify(sendCodeError, null, 2));
      return;
    }

    Keyboard.dismiss();
    setStep('code');
  };

  const onVerifyCode = () => {
    if (!code.trim()) {
      setFormError('Please enter the reset code.');
      return;
    }
    setFormError('');
    setStep('reset');
  };

  const onResetPassword = async () => {
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({
      code,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          router.replace('/');
        },
      });
    } else {
      console.error('Password reset not complete:', signIn);
    }
  };

  const goBack = () => {
    setFormError('');
    if (step === 'reset') {
      setPassword('');
      setConfirmPassword('');
      setStep('code');
    } else if (step === 'code') {
      setCode('');
      setStep('email');
    } else {
      router.back();
    }
  };

  return (
    <AuthCard>
      {step === 'email' && (
        <>
          <View className='items-center'>
            <Text className='mb-2 text-3xl font-bold text-primary'>
              Forgot Password?
            </Text>
            <Text className='text-lg text-secondary'>
              Enter your email to reset
            </Text>
          </View>

          <View className='gap-y-2'>
            <TextInput
              autoCapitalize='none'
              value={email}
              placeholder='Enter email'
              className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
              placeholderTextColor='#B58553'
              autoComplete='email'
              textContentType='emailAddress'
              importantForAutofill='yes'
              onChangeText={setEmail}
              onEndEditing={handleEndEditing(email, setEmail)}
              returnKeyType='done'
              onSubmitEditing={onRequestReset} />

            {errors.fields.identifier && (
              <Text className='text-sm text-red-600'>
                {errors.fields.identifier.message}
              </Text>
            )}

            {formError ? (
              <Text className='text-sm text-red-600'>{formError}</Text>
            ) : null}

            <TouchableOpacity
              onPress={onRequestReset}
              disabled={isLoading}
              className={`mb-2 rounded-full bg-primary h-12 justify-center ${isLoading ? 'opacity-50' : ''}`}>
              <Text className='text-center text-lg font-semibold text-white'>
                Send Reset Code
              </Text>
            </TouchableOpacity>
          </View>

          <View className='flex-row items-center justify-center'>
            <Text className='text-base text-secondary'>Remember your password? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className='text-base font-semibold text-primary'>Sign in</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'code' && (
        <>
          <View className='items-center'>
            <Text className='mb-2 text-3xl font-bold text-primary'>
              Check Your Email
            </Text>
            <Text className='text-center text-lg text-secondary'>
              We sent a reset code to your email
            </Text>
          </View>

          <View className='gap-y-2'>
            <TextInput
              value={code}
              autoFocus
              placeholder='Enter reset code'
              className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
              placeholderTextColor='#B58553'
              autoComplete='one-time-code'
              textContentType='oneTimeCode'
              onChangeText={setCode}
              returnKeyType='done'
              onSubmitEditing={onVerifyCode} />

            {errors.fields.code && (
              <Text className='text-sm text-red-600'>
                {errors.fields.code.message}
              </Text>
            )}

            {formError ? (
              <Text className='text-sm text-red-600'>{formError}</Text>
            ) : null}

            <TouchableOpacity
              onPress={onVerifyCode}
              disabled={isLoading}
              className={`mb-2 rounded-full bg-primary h-12 justify-center ${isLoading ? 'opacity-50' : ''}`}>
              <Text className='text-center text-lg font-semibold text-white'>
                Continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goBack}
              className='rounded-full border border-accent bg-accent/20 h-12 justify-center'>
              <Text className='text-center text-lg font-semibold text-primary'>
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'reset' && (
        <>
          <View className='items-center'>
            <Text className='mb-2 text-3xl font-bold text-primary'>
              New Password
            </Text>
            <Text className='text-lg text-secondary'>
              Choose a new password
            </Text>
          </View>

          <View className='gap-y-2'>
            <TextInput
              value={password}
              autoFocus
              placeholder='New password'
              secureTextEntry
              className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
              placeholderTextColor='#B58553'
              autoComplete='new-password'
              textContentType='newPassword'
              importantForAutofill='yes'
              passwordRules='minlength: 8;'
              onChangeText={setPassword}
              onEndEditing={handleEndEditing(password, setPassword)}
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
              placeholder='Confirm new password'
              secureTextEntry
              className='rounded-2xl border border-accent bg-accent/20 px-4 py-0 h-10 text-lg placeholder:text-secondary leading-tight overflow-hidden'
              placeholderTextColor='#B58553'
              autoComplete='new-password'
              textContentType='newPassword'
              importantForAutofill='yes'
              onChangeText={setConfirmPassword}
              onEndEditing={handleEndEditing(confirmPassword, setConfirmPassword)}
              returnKeyType='done'
              onSubmitEditing={onResetPassword} />

            {formError ? (
              <Text className='text-sm text-red-600'>{formError}</Text>
            ) : null}

            <TouchableOpacity
              onPress={onResetPassword}
              disabled={isLoading}
              className={`mb-2 rounded-full bg-primary h-12 justify-center ${isLoading ? 'opacity-50' : ''}`}>
              <Text className='text-center text-lg font-semibold text-white'>
                Reset Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goBack}
              className='rounded-full border border-accent bg-accent/20 h-12 justify-center'>
              <Text className='text-center text-lg font-semibold text-primary'>
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </AuthCard>
  );
}
