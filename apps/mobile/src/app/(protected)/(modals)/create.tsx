import { View, Text, Platform, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Button from '~/components/common/button';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { LeagueInsertZod } from '~/types/leagues';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { useCreateLeague } from '~/hooks/leagues/mutation/useCreateLeague';
import { cn } from '~/lib/utils';
import { ArrowLeft } from 'lucide-react-native';
import LeagueName from '~/components/leagues/actions/create/leagueName';
import { type ReactNode, useCallback } from 'react';
import DraftDate from '~/components/leagues/actions/create/draftDate';
import LeagueMember from '~/components/leagues/actions/create/leagueMember';
import { colors } from '~/lib/colors';
import CreateLeagueHeader from '~/components/leagues/actions/create/header/view';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CreateLeagueFormProps {
  onSubmit?: () => void;
}

interface PageConfig {
  name: keyof typeof LeagueInsertZod.shape;
  content: ReactNode;
  optional: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function CreateLeagueScreen({ onSubmit }: CreateLeagueFormProps) {
  const { reactForm, handleSubmit, isSubmitting } = useCreateLeague(onSubmit);

  const pages: PageConfig[] = [
    {
      name: 'leagueName' as const,
      content: null, // Will be rendered dynamically
      optional: false,
      isFirst: true,
    },
    {
      name: 'draftDate' as const,
      content: null,
      optional: true,
    },
    {
      name: 'member' as const,
      content: null,
      optional: false,
      isLast: true,
    },
  ];

  const { props, progressProps, ref, container: { width, onLayout } } = useCarousel<PageConfig>(pages);

  const goNext = useCallback(() => {
    Keyboard.dismiss();
    ref.current?.next();
  }, [ref]);

  const goBack = useCallback(
    (fieldName: keyof typeof LeagueInsertZod.shape) => {
      Keyboard.dismiss();
      ref.current?.prev();
      reactForm.resetField(fieldName);
    },
    [ref, reactForm]
  );

  // Render content based on page name
  const renderPageContent = (
    pageName: keyof typeof LeagueInsertZod.shape,
    canGoNext?: boolean
  ) => {
    switch (pageName) {
      case 'leagueName':
        return (
          <LeagueName
            control={reactForm.control}
            onSubmitEditing={goNext}
            canGoNext={canGoNext} />
        );

      case 'draftDate':
        return <DraftDate control={reactForm.control} />;
      case 'member':
        return (
          <LeagueMember control={reactForm.control} formPrefix='member' />
        );
      default:
        return null;
    }
  };


  return (
    <SafeAreaView className='flex-1 bg-background py-16'>
      <CreateLeagueHeader />

      <KeyboardAvoidingView
        behavior='padding'
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View className='flex-1 px-1.5 pt-8' onLayout={onLayout}>
          {/* Carousel */}
          <Carousel
            ref={ref}
            {...props}
            width={width - 12}
            enabled={false}
            renderItem={({ item }) => {
              const fieldValue = reactForm.watch(item.name);
              const isValid = LeagueInsertZod.shape[item.name].safeParse(fieldValue).success;
              const buttonDisabled = !item.optional && !isValid;
              const fieldTouched = reactForm.formState.touchedFields[item.name];

              return (
                <View
                  className='flex-1'
                  onTouchStart={() => Keyboard.dismiss()}>
                  {/* Content */}
                  <View className='flex-1 justify-start'>
                    {renderPageContent(item.name, !buttonDisabled)}
                  </View>

                  {/* Navigation */}
                  <View className='flex-row items-center justify-center gap-4 px-6 pb-4'>
                    {/* Back Button */}
                    {!item.isFirst && (
                      <Button
                        onPress={() => goBack(item.name)}
                        className='h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-card active:bg-primary/10'>
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
                      disabled={buttonDisabled || isSubmitting}
                      className={cn(
                        'rounded-lg bg-primary py-3 active:opacity-80 w-1/2',
                        !item.isFirst && 'mr-16',
                        (buttonDisabled || isSubmitting) && 'opacity-50'
                      )}>
                      <Text className='text-center text-base font-bold text-white'>
                        {isSubmitting
                          ? 'Creating...'
                          : item.isLast
                            ? 'Create League'
                            : !fieldTouched && item.optional
                              ? 'Skip'
                              : 'Next'}
                      </Text>
                    </Button>

                    {/* Placeholder for alignment */}
                  </View>
                </View>
              );
            }} />
        </View>
      </KeyboardAvoidingView>
      {/* Pagination */}
      <Pagination.Basic {...progressProps} />
    </SafeAreaView>
  );
}
