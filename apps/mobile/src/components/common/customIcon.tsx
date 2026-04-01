import { type FC, forwardRef } from 'react';
import Svg, { type SvgProps } from 'react-native-svg';
import { PixelRatio } from 'react-native';


export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  allowFontScaling?: boolean;
}

/**
 * Creates a custom icon component with a similar API to lucide-react-native icons.
 * Used by the generate-icons script — not typically called directly.
 */
export function createIcon(
  displayName: string,
  viewBox: string,
  paths: FC<{ color: string; strokeWidth: number; fill: string }>,
) {
  const Paths = paths;

  const Icon = forwardRef<Svg, IconProps>(
    (
      {
        size = 24,
        color = 'none',
        strokeWidth = 0,
        absoluteStrokeWidth = false,
        fill,
        allowFontScaling = true,
        ...rest
      },
      ref,
    ) => {
      const scaledSize = allowFontScaling
        ? size * PixelRatio.getFontScale()
        : size;

      const computedStrokeWidth = absoluteStrokeWidth
        ? strokeWidth
        : strokeWidth * (24 / scaledSize);

      return (
        <Svg
          ref={ref}
          width={scaledSize}
          height={scaledSize}
          viewBox={viewBox}
          fill={fill ?? color ?? 'currentColor'}
          stroke={color}
          strokeWidth={computedStrokeWidth}
          strokeLinecap='round'
          strokeLinejoin='round'
          {...rest}>
          <Paths
            color={color}
            strokeWidth={computedStrokeWidth}
            fill={fill as string} />
        </Svg>
      );
    },
  );

  Icon.displayName = displayName;
  return Icon;
}
