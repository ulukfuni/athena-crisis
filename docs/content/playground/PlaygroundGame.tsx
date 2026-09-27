'use client';

import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import { prepareSprites } from '@deities/art/Sprites.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  LevelUpEvent,
  ProgressionStore,
  processAttackUnitProgression,
  setActiveProgressionStore,
} from '@deities/athena/progression/index.tsx';
import GameMap from '@deities/hera/GameMap.tsx';
import useClientGame from '@deities/hera/hooks/useClientGame.tsx';
import useClientGameAction from '@deities/hera/hooks/useClientGameAction.tsx';
import useClientGamePlayerDetails from '@deities/hera/hooks/useClientGamePlayerDetails.tsx';
import GameActions from '@deities/hera/ui/GameActions.tsx';
import DemoViewer from '@deities/hera/ui/lib/DemoViewer.tsx';
import MapInfo from '@deities/hera/ui/MapInfo.tsx';
import { UndoType } from '@deities/hermes/game/undo.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import { useInView } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProgressionToast, { ProgressionToastItem } from './ProgressionToast.tsx';

const startAction = {
  type: 'Start',
} as const;

let toastSeq = 0;

export default function PlaygroundGame({
  map,
  metadata,
}: {
  map: MapData;
  metadata?: MapMetadata;
}) {
  useEffect(() => {
    prepareSprites().catch(() => {});
  }, []);

  const [renderKey, setRenderKey] = useState(0);
  const zoom = useScale();
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px 6% 0px' });

  const storeRef = useRef<ProgressionStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = ProgressionStore.seedFromMap(map);
  }

  useEffect(() => {
    setActiveProgressionStore(storeRef.current);
    return () => setActiveProgressionStore(null);
  }, []);

  const [toasts, setToasts] = useState<ReadonlyArray<ProgressionToastItem>>([]);
  const pushToasts = useCallback((levelUps: ReadonlyArray<LevelUpEvent>, xpGained: number) => {
    const next: ProgressionToastItem[] = [];
    if (xpGained > 0 && !levelUps.length) {
      next.push({ id: `xp-${++toastSeq}`, text: `+${xpGained} XP` });
    }
    for (const event of levelUps) {
      const label = event.displayName || event.characterId;
      next.push({
        id: `lv-${++toastSeq}`,
        text: `${label} reached Lv ${event.toLevel}! (+${event.growth.hp} HP)`,
      });
    }
    if (next.length) {
      setToasts((prev) => [...prev, ...next]);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const [game, setGame, undo] = useClientGame(
    map,
    DemoViewer.id,
    metadata?.effects || new Map(),
    startAction,
  );

  // Re-seed when the map instance resets (undo / remount).
  useEffect(() => {
    if (renderKey > 0) {
      storeRef.current = ProgressionStore.seedFromMap(map);
      setActiveProgressionStore(storeRef.current);
    }
  }, [map, renderKey]);

  const onGameAction = useCallback(
    async (
      gameState: GameState | null,
      _activeMap: MapData,
      _actionResponse: ActionResponse,
    ): Promise<GameState | null> => {
      const store = storeRef.current;
      if (!store || !gameState?.length) {
        return gameState;
      }

      let mapBefore = game.state;
      const nextState: GameState = [];

      for (const [action, mapAfter] of gameState) {
        if (action.type === 'Move') {
          store.moveUnit(action.from, action.to);
          nextState.push([action, mapAfter]);
          mapBefore = mapAfter;
          continue;
        }

        if (action.type === 'CreateUnit') {
          store.addUnit(action.to, action.unit);
          nextState.push([action, mapAfter]);
          mapBefore = mapAfter;
          continue;
        }

        if (action.type === 'AttackUnit') {
          const outcome = processAttackUnitProgression(
            mapBefore,
            mapAfter,
            {
              from: action.from,
              to: action.to,
              defenderHealthAfter: action.unitB?.health ?? null,
            },
            store,
          );
          pushToasts(outcome.levelUps, outcome.xpGained);
          nextState.push([action, outcome.map]);
          mapBefore = outcome.map;
          continue;
        }

        nextState.push([action, mapAfter]);
        mapBefore = mapAfter;
      }

      return nextState;
    },
    [game.state, pushToasts],
  );

  const onAction = useClientGameAction(game, setGame, onGameAction);
  const playerDetails = useClientGamePlayerDetails(game.state, DemoViewer);
  const onUndo = useCallback(
    (type: UndoType) => {
      undo(type);
      setRenderKey((renderKey) => renderKey + 1);
    },
    [undo],
  );
  const fade = renderKey === 0;

  return (
    <div ref={ref}>
      <GameMap
        autoPanning
        currentUserId={DemoViewer.id}
        fogStyle="soft"
        key={`play-demo-map-${renderKey}`}
        lastActionResponse={game.lastAction}
        map={game.state}
        margin="minimal"
        onAction={onAction}
        pan
        paused={!isInView}
        playerDetails={playerDetails}
        scale={zoom}
        scroll={false}
        style="floating"
        tilted
      >
        {(props, actions) => {
          const hide = !isInView || props.lastActionResponse?.type === 'GameEnd';

          return (
            <>
              <MapInfo hide={hide} {...props} />
              <GameActions
                actions={actions}
                canUndoAction
                fade={fade}
                hide={hide}
                state={{ ...props, inlineUI: true }}
                undo={onUndo}
                zoom={zoom}
              />
            </>
          );
        }}
      </GameMap>
      <ProgressionToast items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
