import { Text, View, Platform, Keyboard, Alert } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Redirect } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import LeagueMember from '~/components/leagues/actions/create/leagueMember';
import EnterHash from '~/components/leagues/actions/join/enterHash';
import ErrorHash from '~/components/leagues/actions/join/errorHash';
import JoinLeagueHeader from '~/components/leagues/actions/join/header/view';
import { useJoinLeague } from '~/hooks/leagues/mutation/useJoinLeague';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PageConfig {
  name: 'hash' | 'member';
  optional: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function JoinLeagueScreen() {
  const {
    reactForm,
    inputValue,
    handleInputChange,
    submitHash,
    resetHash,
    hasSubmittedHash,
    getPublicLeague,
    handleSubmit,
    isSubmitting,
  } = useJoinLeague();

  const [errorModalVisible, setErrorModalVisible] = useState(false);

  const pages: PageConfig[] = [
    { name: 'hash', optional: false, isFirst: true },
    { name: 'member', optional: false, isLast: true },
  ];

  const { props, ref, progress, container: { width, onLayout } } = useCarousel<PageConfig>(pages);

  const codeValid = inputValue.trim().length > 0;

  const goNext = useCallback(() => {
    Keyboard.dismiss();
    if (codeValid) {
      submitHash();
      ref.current?.next();
    }
  }, [ref, codeValid, submitHash]);

  const goBack = useCallback(() => {
    Keyboard.dismiss();
    resetHash();
    ref.current?.prev();
  }, [ref, resetHash]);

  // If hash provided via URL and query succeeded, auto-advance
  useEffect(() => {
    if (hasSubmittedHash && getPublicLeague.isSuccess && progress === 0) {
      ref.current?.scrollTo({ index: 1, animated: false });
    }
  }, [hasSubmittedHash, getPublicLeague.isSuccess, progress, ref]);

  // Show error modal when league fetch fails
  useEffect(() => {
    if (getPublicLeague.isError && progress === 1) {
      setErrorModalVisible(true);
    }
  }, [getPublicLeague.isError, progress]);

  const handleErrorDismiss = () => {
    setErrorModalVisible(false);
    goBack();
  };

  const renderPageContent = (pageName: 'hash' | 'member') => {
    switch (pageName) {
      case 'hash':
        return <EnterHash value={inputValue} onChangeText={handleInputChange} />;
      case 'member':
        return (
          <LeagueMember
            control={reactForm.control}
            usedColors={getPublicLeague?.data?.usedColors} />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (getPublicLeague?.data?.isPending) {
      Alert.alert(
        'Pending Invitation',
        'You already tried to join this league. Please wait for the league admin to approve your request.',
      );
    }
  }, [getPublicLeague?.data?.isPending]);

  if (getPublicLeague?.data?.isMember) {
    return <Redirect href={`/leagues/${getPublicLeague.data.hash}`} />;
  }

  // Then just the redirect in render:
  if (getPublicLeague?.data?.isPending) {
    return <Redirect href='/' />;
  }

  return (
    <SafeAreaView className='flex-1 bg-background py-16'>
      <JoinLeagueHeader
        leagueName={getPublicLeague.isError
          ? undefined
          : getPublicLeague.isLoading
            ? 'Loading...'
            : getPublicLeague.data?.name} />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={progress === 1 ? undefined : Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View className='flex-1 px-1.5 pt-8' onLayout={onLayout}>
          {/* Carousel */}
          <Carousel
            ref={ref}
            {...props}
            width={width - 12}
            enabled={false}
            renderItem={({ item }) => {
              const isHashPage = item.name === 'hash';
              const isValid = isHashPage ? codeValid : reactForm.formState.isValid;
              const buttonDisabled = !isValid || (item.isLast && (isSubmitting || getPublicLeague.isLoading));

              return (
                <View className='flex-1' onTouchStart={() => Keyboard.dismiss()}>
                  {/* Content */}
                  <View className='flex-1 justify-start'>
                    {renderPageContent(item.name)}
                  </View>

                  {/* Navigation */}
                  <View className='flex-row items-center justify-center gap-4 px-6 pb-24'>
                    {/* Back Button */}
                    {!item.isFirst && (
                      <Button
                        onPress={goBack}
                        className='h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-transparent active:bg-primary/10'>
                        <ArrowLeft size={20} color={colors.primary} />
                      </Button>
                    )}

                    {/* Main Action Button */}
                    <Button
                      onPress={() => {
                        Keyboard.dismiss();
                        if (item.isLast) {
                          handleSubmit();
                        } else {
                          goNext();
                        }
                      }}
                      disabled={buttonDisabled}
                      className={cn(
                        'w-1/2 rounded-lg bg-primary py-3 active:opacity-80',
                        !item.isFirst && 'mr-16',
                        buttonDisabled && 'opacity-50'
                      )}>
                      <Text className='text-center text-base font-bold text-white'>
                        {isSubmitting ? 'Joining...' : item.isLast ? 'Join League' : 'Next'}
                      </Text>
                    </Button>
                  </View>
                </View>
              );
            }} />
        </View>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <Modal visible={errorModalVisible} onClose={handleErrorDismiss}>
        <ErrorHash onBack={handleErrorDismiss} />
      </Modal>
    </SafeAreaView>
  );
}
