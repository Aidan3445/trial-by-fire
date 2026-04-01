import { Platform, RefreshControl, View } from 'react-native';
import { type SafeAreaRefreshViewProps } from '~/components/common/refresh/safeAreaRefreshView';
import IOSRefreshIndicator from '~/components/common/refresh/iosIndicator';
import { Fragment } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function IOSRefreshView({
  disableScroll,
  refreshing,
  onRefresh,
  handleScroll,
  scrollY,
  header,
  extraHeight,
  alreadySafe,
  children,
}: SafeAreaRefreshViewProps) {
  return (
    <Fragment>
      {header}
      {scrollY && (
        <IOSRefreshIndicator
          alreadySafe={alreadySafe}
          refreshing={refreshing}
          scrollY={scrollY}
          extraHeight={extraHeight} />
      )}
      <KeyboardAwareScrollView
        scrollEnabled={!disableScroll}
        className='w-full'
        showsVerticalScrollIndicator={false}
        bottomOffset={80}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ top: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF00'
            colors={['#FFFFFF00']}
            progressBackgroundColor='#FFFFFF00'
            progressViewOffset={-1000} />
        }>
        {Platform.OS === 'ios' && (
          <View className='absolute left-1/2 translate-x-[-40%] w-20 h-96 -top-96 bg-background' />
        )}
        {children}
      </KeyboardAwareScrollView>
    </Fragment>
  );
}
