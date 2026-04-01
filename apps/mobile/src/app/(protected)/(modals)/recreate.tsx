import { Text, View, Platform, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState, useMemo } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import Button from '~/components/common/button';
import RecreateLeagueHeader from '~/components/leagues/actions/create/recreate/header/view';
import { useLeagues } from '~/hooks/user/useLeagues';
import { useRecreateLeague } from '~/hooks/leagues/mutation/useRecreateLeague';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import ChooseLeague from '~/components/leagues/actions/create/recreate/chooseLeague';
import ChooseMembers from '~/components/leagues/actions/create/recreate/chooseMembers';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PageConfig {
  name: 'selectLeague' | 'selectMembers';
  optional: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function RecreateLeagueScreen() {
  const { data: leagues } = useLeagues();

  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  const {
    sortedMemberScores,
    selectedMembers,
    toggleMember,
    handleSubmit,
    isSubmitting,
  } = useRecreateLeague(selectedHash ?? '');

  const pages: PageConfig[] = [
    { name: 'selectLeague', optional: false, isFirst: true },
    { name: 'selectMembers', optional: false, isLast: true },
  ];

  const { props, ref, progress, container: { width, onLayout } } = useCarousel<PageConfig>(pages);

  const leagueSelected = selectedHash !== null;
  const membersSelected = selectedMembers.size > 0;

  const goNext = useCallback(() => {
    Keyboard.dismiss();
    if (leagueSelected) {
      ref.current?.next();
    }
  }, [ref, leagueSelected]);

  const goBack = useCallback(() => {
    Keyboard.dismiss();
    ref.current?.prev();
  }, [ref]);

  const selectedLeague = useMemo(() => {
    if (!selectedHash || !leagues) return null;
    return leagues.find((l) => l.league.hash === selectedHash);
  }, [selectedHash, leagues]);

  const renderPageContent = (pageName: 'selectLeague' | 'selectMembers') => {
    switch (pageName) {
      case 'selectLeague':
        return <ChooseLeague selectedHash={selectedHash} onSelect={setSelectedHash} />;
      case 'selectMembers':
        return (
          <ChooseMembers
            sortedMemberScores={sortedMemberScores}
            selectedMembers={selectedMembers}
            toggleMember={toggleMember} />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-background pt-10'>
      <RecreateLeagueHeader leagueName={selectedLeague?.league.name} />

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
              const isSelectPage = item.name === 'selectLeague';
              const buttonDisabled = isSelectPage
                ? !leagueSelected
                : !membersSelected || isSubmitting;

              return (
                <View className='flex-1' onTouchStart={() => Keyboard.dismiss()}>
                  {/* Content */}
                  <View className='flex-1 justify-start'>{renderPageContent(item.name)}</View>

                  {/* Navigation */}
                  <View className='flex-row items-center justify-center gap-4 px-6 py-2'>
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
                        {isSubmitting ? 'Cloning...' : item.isLast ? 'Clone League' : 'Next'}
                      </Text>
                    </Button>
                  </View>
                </View>
              );
            }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
