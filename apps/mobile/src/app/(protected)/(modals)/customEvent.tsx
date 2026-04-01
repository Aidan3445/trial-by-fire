import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '~/components/common/button';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import CreateCustomEvents from '~/components/leagues/actions/events/custom/create';
import CustomEventHeader from '~/components/leagues/actions/events/header/view';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { cn } from '~/lib/utils';


export default function CustomEventScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: leagueRules, isLoading, isError } = useLeagueRules(hash);
  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh(
    [['rules', hash], ['league', hash]]
  );
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background py-16 justify-center items-center'>
        <CustomEventHeader />
        <Text className='text-lg text-center'>Loading League Rules...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !leagueRules) {
    return (
      <SafeAreaView className='flex-1 bg-background py-16 justify-center items-center'>
        <Text className='text-lg text-center'>Something went wrong.</Text>
        <Button className='mt-4' onPress={() => router.dismiss()}>
          <Text className='text-white'>
            Go Back to League
          </Text>
        </Button>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaRefreshView
      className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
      header={
        <CustomEventHeader />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View className={cn('page justify-start gap-y-4 px-1.5 pb-12',
        Platform.OS === 'ios' && 'pt-12')}>
        <CreateCustomEvents />
      </View>
    </SafeAreaRefreshView>
  );
}
