// ~/components/leagues/hub/chart/view.tsx
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import ScoreChart, { type ChartSeries } from '~/components/shared/chart/view';

export default function Chart() {
  const { sortedMemberScores, league } = useLeagueData();
  const startWeek = league?.startWeek ?? 1;

  const { chartData, series, maxEpisode } = useMemo(() => {
    const series: ChartSeries[] = sortedMemberScores.map(({ member }) => ({
      key: member.displayName,
      label: member.displayName.split(' ')[0] ?? member.displayName,
      color: member.color,
      highlight: member.loggedIn,
    }));

    let maxEpisode = startWeek;
    sortedMemberScores.forEach(({ scores }) => {
      scores.forEach((_, ep) => {
        if (ep >= startWeek) maxEpisode = Math.max(maxEpisode, ep);
      });
    });

    type ChartDataPoint = { episode: number;[key: string]: number };
    const chartData: ChartDataPoint[] = [];

    const episode0: ChartDataPoint = { episode: 0 };
    series.forEach((s) => (episode0[s.key] = 0));
    chartData.push(episode0);

    for (let ep = startWeek; ep <= maxEpisode; ep++) {
      const point: ChartDataPoint = { episode: ep };
      sortedMemberScores.forEach(({ member, scores }) => {
        point[member.displayName] = scores[ep] ?? 0;
      });
      chartData.push(point);
    }

    return { chartData, series, maxEpisode };
  }, [sortedMemberScores, startWeek]);

  if (sortedMemberScores[0]?.scores?.[startWeek] === undefined) {
    return (
      <View className='w-full h-64 items-center justify-center rounded-lg bg-card'>
        <Text className='text-muted-foreground'>
          No scores available to display the chart.
        </Text>
      </View>
    );
  }

  return (
    <ScoreChart
      chartData={chartData}
      series={series}
      startEpisode={startWeek}
      maxEpisode={maxEpisode} />
  );
}
