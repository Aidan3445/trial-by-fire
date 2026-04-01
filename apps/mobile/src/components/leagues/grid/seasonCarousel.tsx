import { View } from 'react-native';
import { useEffect } from 'react';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { useCarousel } from '~/hooks/ui/useCarousel';
import LeagueCard from '~/components/leagues/grid/leagueCard';
import { type CurrentSelection, type LeagueMember } from '~/types/leagueMembers';
import { type League } from '~/types/leagues';

const CARD_HEIGHT = 140;
const CARD_HEIGHT_WITH_REFRESH = 185;

interface LeagueSeasonCarouselProps {
  leagues: { league: League; member: LeagueMember; currentSelection: CurrentSelection }[];
  refresh?: boolean;
}

export default function LeagueSeasonCarousel({ leagues, refresh }: LeagueSeasonCarouselProps) {
  const { ref, setCarouselData, props, progressProps } = useCarousel<
    { league: League; member: LeagueMember; currentSelection: CurrentSelection }
  >([]);

  useEffect(() => {
    setCarouselData(leagues);
  }, [leagues, setCarouselData]);

  if (!props.data || props.data.length === 0) return null;

  return (
    <View>
      <Carousel
        ref={ref}
        {...props}
        loop={true}
        height={refresh ? CARD_HEIGHT_WITH_REFRESH : CARD_HEIGHT}
        renderItem={({ item }) => (
          <View className='flex-1'>
            <LeagueCard
              league={item.league}
              member={item.member}
              currentSelection={item.currentSelection}
              refresh={refresh} />
          </View>
        )} />
      {props.data.length > 1 && (
        <View className='items-center'>
          <Pagination.Basic {...progressProps} containerStyle={{ marginTop: 8 }} />
        </View>
      )}
    </View>
  );
}
