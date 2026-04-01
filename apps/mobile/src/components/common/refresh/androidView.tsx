import { Fragment, type ReactNode } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, RefreshControl } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { colors } from '~/lib/colors';

interface AndroidRefreshViewProps {
  disableScroll?: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  handleScroll?: (_event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  header?: ReactNode;
  children: ReactNode;
}

export function AndroidRefreshView({
  disableScroll,
  refreshing,
  onRefresh,
  handleScroll,
  header,
  children,
}: AndroidRefreshViewProps) {
  return (
    <Fragment>
      {header}
      <KeyboardAwareScrollView
        scrollEnabled={!disableScroll}
        className='w-full'
        showsVerticalScrollIndicator={false}
        bottomOffset={80}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary!]}
            progressBackgroundColor={colors.background} />
        }>
        {children}
      </KeyboardAwareScrollView>
    </Fragment>
  );
}
