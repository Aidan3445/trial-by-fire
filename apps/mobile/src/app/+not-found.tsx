import { View, StyleSheet, Text } from 'react-native';
import { Link, Stack, usePathname } from 'expo-router';
import { colors } from '~/lib/colors';

export default function NotFoundScreen() {
  const url = usePathname();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <Link
          href='/'
          style={styles.button}>
          Go back to Home screen!
          <Text>{url ? `\n(You tried to open: ${url})` : ''}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },

  button: { fontSize: 20, textDecorationLine: 'underline', color: '#fff' }
});
