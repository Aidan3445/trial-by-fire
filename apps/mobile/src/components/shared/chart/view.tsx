import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { type AnimatedProp, Circle, RoundedRect, Text as SkiaText, useFont } from '@shopify/react-native-skia';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import Button from '~/components/common/button';
import { Pointer } from 'lucide-react-native';

const Font = require('~/assets/fonts/segoe-ui-semibold.ttf');

type ChartDataPoint = {
  episode: number;
  [key: string]: number;
};

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  /** Optional flag to highlight in legend (e.g. logged-in user) */
  highlight?: boolean;
  eliminatedEpisode?: number | null;
}

interface ScoreChartProps {
  /** Array of data points with episode + series values */
  chartData: ChartDataPoint[];
  /** Series config: key, display label, color */
  series: ChartSeries[];
  /** Max episode to display */
  maxEpisode: number;
  /** Start episode (default 1) */
  startEpisode?: number;
  /** Chart height (default 260) */
  height?: number;
}

export default function ScoreChart({
  chartData,
  series,
  maxEpisode,
  startEpisode = 1,
  height = 260,
}: ScoreChartProps) {
  const font = useFont(Font, 14);
  const labelFont = useFont(Font, 14);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { yKeys, colorMap, maxY, minY } = useMemo(() => {
    const colorMap: Record<string, string> = {};
    let maxY = 0;
    let minY = 0;

    const yKeys = series.map((s) => {
      colorMap[s.key] = s.color;
      return s.key;
    });

    chartData.forEach((point) => {
      yKeys.forEach((key) => {
        const val = point[key] ?? 0;
        maxY = Math.max(maxY, val);
        minY = Math.min(minY, val);
      });
    });

    return { yKeys, colorMap, maxY, minY };
  }, [chartData, series]);

  const sortedYKeys = useMemo(() =>
    yKeys.slice().sort((a, b) => {
      if (a === selectedKey) return 1;
      if (b === selectedKey) return -1;
      return 0;
    }), [yKeys, selectedKey]);

  const getOpacity = (key: string) => {
    if (!selectedKey) return 0.5;
    return key === selectedKey ? 1 : 0.15;
  };

  const paddedChartData = useMemo(() => {
    // Add 0 for weeks before startEpisode
    const zeroPoint: ChartDataPoint = { episode: 0 };
    yKeys.forEach((key) => (zeroPoint[key] = 0));
    const paddedData: ChartDataPoint[] = [];
    for (let ep = 0; ep < startEpisode; ep++) {
      paddedData.push({ ...zeroPoint, episode: ep });
    }

    return [...paddedData, ...chartData];
  }, [chartData, yKeys, startEpisode]);

  if (chartData.length <= 1) {
    return (
      <View className='w-full h-64 items-center justify-center rounded-lg bg-card'>
        <Text className='text-muted-foreground'>
          No scores available to display the chart.
        </Text>
      </View>
    );
  }

  return (
    <View className='w-full rounded-lg overflow-hidden' style={{ overflow: 'hidden' }}>
      <View className='w-full overflow-hidden' style={{ height, overflow: 'hidden' }}>
        <CartesianChart
          data={paddedChartData}
          xKey='episode'
          yKeys={sortedYKeys}
          domain={{
            y: [minY, maxY],
            x: [startEpisode - 1, maxEpisode],
          }}
          domainPadding={{ top: 25, right: 15 }}
          axisOptions={{
            font,
            tickCount: { x: maxEpisode - startEpisode + 1, y: 6 },
            labelColor: colors.primary,
            lineColor: colors.secondary,
            formatXLabel: (value) => (value === 0 ? '' : String(value)),
          }}>
          {({ points }) => {
            const pointMarkerData = selectedKey && points[selectedKey] ?
              points[selectedKey].map((point, index) => {
                if (index <= startEpisode) return undefined;
                const score = paddedChartData[index]?.[selectedKey];
                const seriesData = series.find((s) => s.key === selectedKey);
                if (
                  score === undefined
                  || (seriesData?.eliminatedEpisode ?? Infinity) < index - 1) {
                  return undefined;
                }

                const text = String(score);
                const textWidth = text.length * 8;
                const textHeight = 14;
                const x = point.x - textWidth / 2;
                const y = (point.y as unknown as number) - 12;
                return {
                  cx: point.x,
                  cy: point.y as AnimatedProp<number>,
                  label: {
                    text,
                    x,
                    y,
                    width: textWidth,
                    height: textHeight,
                  },
                };
              }).filter((d): d is NonNullable<typeof d> => d !== undefined) : [];
            return (
              // Draw circles under the label box under the lines under the label text
              <>
                {sortedYKeys.map((key) => {
                  const pts = points[key];
                  const lastPoint = pts?.[pts.length - 1];
                  if (!lastPoint || lastPoint.x === 0) return null;
                  return (
                    <Circle
                      key={`${key}-marker`}
                      cx={lastPoint.x}
                      cy={lastPoint.y as AnimatedProp<number>}
                      r={selectedKey === key ? 7 : 5}
                      color={colorMap[key]}
                      opacity={getOpacity(key) + 0.5} />
                  );
                })}

                {selectedKey &&
                  labelFont &&
                  pointMarkerData.map((data, index) => {
                    return (
                      <RoundedRect
                        key={`label-box-${index}`}
                        x={data.label.x}
                        y={data.label.y - data.label.height + 2}
                        width={data.label.width}
                        height={data.label.height}
                        r={4}
                        color={colors.card}
                        opacity={0.75} />
                    );
                  })}

                {sortedYKeys.map((key) => (
                  <Line
                    key={key}
                    points={points[key]!}
                    color={colorMap[key]}
                    strokeWidth={selectedKey === key ? 6 : 5}
                    opacity={getOpacity(key)}
                    curveType='bumpX'
                    animate={{ type: 'timing', duration: 200 }} />
                ))}

                {selectedKey &&
                  labelFont &&
                  pointMarkerData.map((data, index) => {
                    return (
                      <SkiaText
                        key={`label-text-${index}`}
                        x={data.label.x}
                        y={data.label.y}
                        text={data.label.text}
                        font={labelFont}
                        color={colors.primary} />
                    );
                  })}
              </>
            );
          }}
        </CartesianChart>
      </View>

      {/* Legend */}
      <View className='flex-row flex-wrap gap-2 px-2 pt-2 items-center tracking-tighter'>
        {series.map((s) => {
          const isSelected = selectedKey === s.key;
          const isOther = selectedKey && !isSelected;

          return (
            <Button
              key={s.key}
              onPress={() => setSelectedKey((prev) => (prev === s.key ? null : s.key))}
              className='h-8 flex-row items-center gap-1 py-1 active:opacity-70'>
              {s.highlight && (
                <View
                  className='-mr-0.5 rotate-90 animate-pulse'>
                  <Pointer size={16} color={colors.primary} />
                </View>
              )}
              <View
                className={cn(
                  'w-4 h-4 rounded-full border border-primary',
                  isOther && 'opacity-30',
                )}
                style={{ backgroundColor: s.color }} />
              <View className={cn('px-0.5', isSelected && 'bg-primary/30 rounded')}>
                <Text
                  allowFontScaling={false}
                  className={cn(
                    'text-base transition-all',
                    isOther ? 'text-muted-foreground' : 'text-primary'
                  )}>
                  {s.label}
                </Text>
              </View>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
