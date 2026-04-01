import { View, Image } from 'react-native';
import React from 'react';
import { cn } from '~/lib/utils';
const LogoImage = require('~/assets/LogoFull.png');

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <View className={cn('items-center', className)}>
      <Image source={LogoImage} className='h-32 w-72' resizeMode='contain' />
    </View>
  );
}
