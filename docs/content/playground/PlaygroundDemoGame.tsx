import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import { Infantry, Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import PlaygroundGame from './PlaygroundGame.tsx';

const metadata: MapMetadata = {
  name: 'MVP Grassland',
  tags: ['demo', 'mvp'],
  teamPlay: false,
};

// Small grassland map: plain tiles + mountain, infantry/pioneer/tank only.
const map = withModifiers(
  MapData.createMap({
    config: {
      biome: Biome.Grassland,
      fog: Fog.None,
      seedCapital: 500,
    },
    map: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 3, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
    size: { height: 6, width: 8 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'Bot' }],
      },
    ],
    units: [
      [2, 2, { g: 40, h: 100, i: Infantry.id, p: 1 }],
      [3, 2, { g: 40, h: 100, i: Pioneer.id, p: 1 }],
      [2, 5, { g: 30, h: 100, i: SmallTank.id, p: 1 }],
      [7, 2, { g: 40, h: 100, i: Infantry.id, p: 2 }],
      [6, 5, { g: 30, h: 100, i: SmallTank.id, p: 2 }],
      [7, 4, { g: 40, h: 100, i: Pioneer.id, p: 2 }],
    ],
  }),
);

export default function PlaygroundDemoGame() {
  return <PlaygroundGame map={map} metadata={metadata} />;
}
