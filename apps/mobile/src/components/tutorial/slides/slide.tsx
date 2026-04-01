import { Text, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import type { IconProps } from '~/components/icons/generated';
import { type ReactNode } from 'react';

export interface SlideConfig {
  icon: (_props: IconProps) => ReactNode;
  iconStrokeWidth?: number;
  accentIcon: LucideIcon;
  color?: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  badgeBorderClass: string;
  title: string;
  subtitle: string;
  body: string;
  customizable?: string;
  tag?: string;
  detail?: { label: string; value: string }[];
  cta?: boolean;
}

interface SlideProps {
  slide: SlideConfig;
  showCustomization?: boolean;
}

export default function Slide({ slide, showCustomization = true }: SlideProps) {
  const SlideIcon = slide.icon;
  const AccentIcon = slide.accentIcon;

  return (
    <View className='flex-1 items-center px-6 pt-6 gap-4'>
      {/* Icon cluster */}
      <View className='w-20 h-20 rounded-2xl bg-card/80'>
        <View className={cn(
          'relative items-center justify-center w-20 h-20 rounded-2xl border-2 bg-card!',
          slide.bgClass, slide.borderClass
        )}>
          <SlideIcon
            size={40}
            color={slide.color}
            strokeWidth={slide.iconStrokeWidth} />
          <View className={cn(
            'absolute -bottom-2 -right-2 items-center justify-center',
            'w-7 h-7 rounded-full border-2 bg-card',
            slide.borderClass
          )}>
            <AccentIcon size={14} color={slide.color} />
          </View>
        </View>
      </View>

      {/* Tag badge */}
      {slide.tag && (
        <View className='rounded-full bg-card'>
          <View className={cn(
            'rounded-full px-3 py-1 border',
            slide.badgeClass, slide.badgeBorderClass
          )}>
            <Text
              className='text-base font-bold uppercase tracking-wider'
              style={{ color: slide.color }}>
              {slide.tag}
            </Text>
          </View>
        </View>
      )}

      {/* Title + subtitle */}
      <View className='items-center gap-1 bg-card border-2 border-primary/20 rounded-lg px-4 py-3 w-full'>
        <Text className='text-xl font-black uppercase tracking-tight text-foreground text-center'>
          {slide.title}
        </Text>
        <Text
          className='text-base font-semibold text-center'
          style={{ color: slide.color }}>
          {slide.subtitle}
        </Text>
      </View>

      {/* Body */}
      <View className='items-center gap-1 bg-card border-2 border-primary/20 rounded-lg px-4 py-3 w-full'>
        <Text className='text-lg text-muted-foreground leading-relaxed text-center max-w-sm'>
          {slide.body}
        </Text>
      </View>

      {/* Customizable callout */}
      {showCustomization && slide.customizable && (
        <View className={cn(
          'flex-row items-start gap-2.5 rounded-md border-2 border-dashed p-3 bg-card',
          slide.borderClass
        )}>
          <Settings size={16} color={slide.color} className='mt-0.5' />
          <Text className='flex-1 text-base text-muted-foreground leading-snug'>
            {slide.customizable}
          </Text>
        </View>
      )}

      {/* Detail chips */}
      {slide.detail && (
        <View className={cn(
          'w-full rounded-lg border-2 p-2 bg-card',
          slide.borderClass
        )}>
          {slide.detail.map((d, j) => (
            <View
              key={j}
              className={cn(
                'flex-row items-center justify-between py-1.5 px-1',
                j > 0 && 'border-t',
                slide.borderClass
              )}>
              <Text className='text-base text-muted-foreground'>{d.label}</Text>
              <Text
                className='text-base font-bold'
                style={{ color: slide.color }}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
