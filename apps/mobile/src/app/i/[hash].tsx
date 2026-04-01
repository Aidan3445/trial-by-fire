import { Redirect, useLocalSearchParams } from 'expo-router';

export default function JoinRedirect() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  console.log('Redirecting to join league with hash:', hash);
  return <Redirect href={`/(protected)/(modals)/join?hash=${hash}`} />;
}
