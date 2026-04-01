import { type EnrichedCastaway } from './castaways';
import { type TribesTimeline, type Tribe } from './tribes';
import { type Eliminations, type Events } from './events';
import { type KeyEpisodes, type Episode } from './episodes';

export type SeasonInsert = {
  name: string;
  premiereDate: Date;
  finaleDate: Date | null;
}

export type Season = {
  seasonId: number;
  name: string;
  premiereDate: Date;
  finaleDate: Date | null;
}

export type SeasonsDataQuery = {
  season: Season;
  castaways: EnrichedCastaway[];
  tribes: Tribe[];
  baseEvents: Events;
  episodes: Episode[];
  tribesTimeline: TribesTimeline;
  eliminations: Eliminations;
  keyEpisodes: KeyEpisodes;
}
