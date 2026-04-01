import { View, Text } from 'react-native';
import { useUser } from '@clerk/expo';

interface EmailFieldProps {
  locked: boolean;
}

export default function EmailField({ locked }: EmailFieldProps) {
  const { user } = useUser();

  return (
    <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
      <Text className='text-sm text-muted-foreground'>Email</Text>
      <Text className='text-base font-medium text-foreground'>
        {user?.primaryEmailAddress?.emailAddress ?? 'Not available'}
      </Text>
      {!locked && (
        <Text className='text-sm text-muted-foreground italic'>
          You can only update or remove your email from the website.
        </Text>
      )}
    </View>
  );
}
