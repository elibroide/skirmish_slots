import React, { useState } from 'react';
import type { GameState, PlayerId, TerrainId } from '../../engine/types';
import { Slot } from './Slot';
import { Hand } from './Hand';
import { useGameStore } from '../store/gameStore';

interface GameBoardProps {
  gameState: GameState;
  localPlayerId: PlayerId;
}

/**
 * GameBoard Component
 * Layout from mockup (GameLayout.png):
 * - Character art panels on left (blue=opponent, pink=player)
 * - 5 terrains in center (vertical stacks, 2 slots each)
 * - Turn indicator arrow between players
 * - Slot bonus panel on right
 * - Tooltip helper area on right
 * - Hand display at bottom (fanned)
 * - Hand display at top (card backs)
 */
export const GameBoard: React.FC<GameBoardProps> = ({ gameState, localPlayerId }) => {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const { pendingInputRequest, pendingInputPlayerId } = useGameStore();

  const opponentId = localPlayerId === 0 ? 1 : 0;
  const localPlayer = gameState.players[localPlayerId];
  const opponentPlayer = gameState.players[opponentId];
  const isLocalPlayerTurn = gameState.currentPlayer === localPlayerId;

  // Check if we're waiting for input from the local player
  const isAwaitingInput = pendingInputRequest !== null && pendingInputPlayerId === localPlayerId;

  const handleCardDragStart = (cardId: string) => {
    const { engine } = useGameStore.getState();
    if (!engine) return;

    // Check if card needs a target before deployment
    const card = localPlayer.hand.find(c => c.id === cardId);
    if (!card) return;

    // If unit card needs target for Deploy ability, we handle it after deployment
    // For now, just allow dragging
    setDraggedCardId(cardId);
  };

  const handleCardDragEnd = () => {
    setDraggedCardId(null);
  };

  const handleSlotDrop = (terrainId: number) => {
    if (!draggedCardId) return;

    const { engine } = useGameStore.getState();
    if (!engine) return;

    const card = localPlayer.hand.find(c => c.id === draggedCardId);
    if (!card) return;

    // Submit action to engine
    // If the card needs targeting (e.g., Archer Deploy ability),
    // the engine will emit INPUT_REQUIRED event after deployment
    engine.submitAction({
      type: 'PLAY_CARD',
      playerId: localPlayerId,
      cardId: draggedCardId,
      terrainId: terrainId as TerrainId,
    });
    setDraggedCardId(null);
  };

  const handleUnitClick = (unitId: string) => {
    // Only handle clicks if we're awaiting input for targeting
    if (!isAwaitingInput) return;
    if (!pendingInputRequest || pendingInputRequest.type !== 'target') return;

    // Check if this unit is a valid target
    if (!pendingInputRequest.validTargetIds.includes(unitId)) return;

    // Submit the target directly to the engine
    const { engine } = useGameStore.getState();
    if (!engine) return;

    engine.submitInput(unitId);
  };

  const handlePass = () => {
    if (!isLocalPlayerTurn) return;

    const { engine } = useGameStore.getState();
    if (!engine) return;

    engine.submitAction({
      type: 'DONE',
      playerId: localPlayerId,
    });
  };

  // Calculate projected SP (how many terrains each player would win if the game ended now)
  const calculateProjectedSP = () => {
    let player0SP = 0;
    let player1SP = 0;

    gameState.terrains.forEach((terrain) => {
      const unit0 = terrain.slots[0].unit;
      const unit1 = terrain.slots[1].unit;
      const power0 = unit0 ? unit0.power + terrain.slots[0].modifier : 0;
      const power1 = unit1 ? unit1.power + terrain.slots[1].modifier : 0;

      if (power0 > power1) {
        player0SP += 1;
      } else if (power1 > power0) {
        player1SP += 1;
      }
      // Ties award no SP
    });

    return { player0SP, player1SP };
  };

  const projectedSP = calculateProjectedSP();
  const localProjectedSP = localPlayerId === 0 ? projectedSP.player0SP : projectedSP.player1SP;
  const opponentProjectedSP = opponentId === 0 ? projectedSP.player0SP : projectedSP.player1SP;

  return (
    <div className="min-h-screen bg-stone-200 p-4 flex gap-4">
      {/* LEFT PANEL - Opponent, Skirmish Tracker, Player */}
      <div className="flex flex-col w-48 h-screen py-4">
        {/* Opponent Character - TOP LEFT CORNER */}
        <div className={`bg-blue-200 border-2 rounded-lg p-4 h-48 flex flex-col ${!isLocalPlayerTurn ? 'border-amber-500 shadow-lg' : 'border-stone-800'}`}>
          <div className="font-hand text-lg text-center mb-2 flex items-center justify-center gap-2">
            <span>Opponent</span>
            {!isLocalPlayerTurn && <span className="text-amber-600">●</span>}
          </div>
          <div className="flex-grow bg-blue-100 rounded border border-stone-600 flex items-center justify-center">
            <span className="font-ui text-xs text-stone-600">Character art</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
              <span>Discard:</span>
              <span>{opponentPlayer.graveyard.length}</span>
            </div>
            <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
              <span>Passed:</span>
              <span>{gameState.isDone[opponentId] ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Spacer to push skirmishes to middle */}
        <div className="flex-grow"></div>

        {/* Skirmish tracking - dual blocks - MIDDLE OF PANEL */}
        <div className="flex gap-2 justify-center">
          {/* Skirmish 1 */}
          <div className="flex flex-col gap-1">
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 1
                ? 'bg-amber-200 border-amber-500'
                : opponentPlayer.skirmishesWon >= 1
                  ? 'bg-blue-300 border-blue-500'
                  : localPlayer.skirmishesWon >= 1
                    ? 'bg-pink-300 border-pink-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 1 ? opponentProjectedSP : opponentPlayer.skirmishesWon >= 1 ? '✓' : localPlayer.skirmishesWon >= 1 ? '' : ''}
            </div>
            <div className="w-14 h-0.5 bg-stone-400 rounded-full"></div>
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 1
                ? 'bg-amber-200 border-amber-500'
                : localPlayer.skirmishesWon >= 1
                  ? 'bg-pink-300 border-pink-500'
                  : opponentPlayer.skirmishesWon >= 1
                    ? 'bg-blue-300 border-blue-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 1 ? localProjectedSP : localPlayer.skirmishesWon >= 1 ? '✓' : opponentPlayer.skirmishesWon >= 1 ? '' : ''}
            </div>
          </div>

          {/* Skirmish 2 */}
          <div className="flex flex-col gap-1">
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 2
                ? 'bg-amber-200 border-amber-500'
                : opponentPlayer.skirmishesWon >= 2
                  ? 'bg-blue-300 border-blue-500'
                  : localPlayer.skirmishesWon >= 2
                    ? 'bg-pink-300 border-pink-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 2 ? opponentProjectedSP : opponentPlayer.skirmishesWon >= 2 ? '✓' : localPlayer.skirmishesWon >= 2 ? '' : ''}
            </div>
            <div className="w-14 h-0.5 bg-stone-400 rounded-full"></div>
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 2
                ? 'bg-amber-200 border-amber-500'
                : localPlayer.skirmishesWon >= 2
                  ? 'bg-pink-300 border-pink-500'
                  : opponentPlayer.skirmishesWon >= 2
                    ? 'bg-blue-300 border-blue-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 2 ? localProjectedSP : localPlayer.skirmishesWon >= 2 ? '✓' : opponentPlayer.skirmishesWon >= 2 ? '' : ''}
            </div>
          </div>

          {/* Skirmish 3 */}
          <div className="flex flex-col gap-1">
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 3
                ? 'bg-amber-200 border-amber-500'
                : opponentPlayer.skirmishesWon >= 3
                  ? 'bg-blue-300 border-blue-500'
                  : localPlayer.skirmishesWon >= 3
                    ? 'bg-pink-300 border-pink-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 3 ? opponentProjectedSP : opponentPlayer.skirmishesWon >= 3 ? '✓' : localPlayer.skirmishesWon >= 3 ? '' : ''}
            </div>
            <div className="w-14 h-0.5 bg-stone-400 rounded-full"></div>
            <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${
              gameState.currentSkirmish === 3
                ? 'bg-amber-200 border-amber-500'
                : localPlayer.skirmishesWon >= 3
                  ? 'bg-pink-300 border-pink-500'
                  : opponentPlayer.skirmishesWon >= 3
                    ? 'bg-blue-300 border-blue-500'
                    : 'bg-stone-300 border-stone-500'
            }`}>
              {gameState.currentSkirmish === 3 ? localProjectedSP : localPlayer.skirmishesWon >= 3 ? '✓' : opponentPlayer.skirmishesWon >= 3 ? '' : ''}
            </div>
          </div>
        </div>

        {/* Spacer to push player to bottom */}
        <div className="flex-grow"></div>

        {/* Player Character - BOTTOM LEFT CORNER */}
        <div className={`bg-pink-200 border-2 rounded-lg p-4 h-48 flex flex-col ${isLocalPlayerTurn ? 'border-amber-500 shadow-lg' : 'border-stone-800'}`}>
          <div className="font-hand text-lg text-center mb-2 flex items-center justify-center gap-2">
            <span>Player</span>
            {isLocalPlayerTurn && <span className="text-amber-600">●</span>}
          </div>
          <div className="flex-grow bg-pink-100 rounded border border-stone-600 flex items-center justify-center">
            <span className="font-ui text-xs text-stone-600">Character art</span>
          </div>
          <div className="mt-2 space-y-1">
            <button
              onClick={handlePass}
              disabled={!isLocalPlayerTurn || gameState.isDone[localPlayerId]}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-stone-400 border-2 border-stone-800 rounded px-2 py-1 font-hand text-sm"
            >
              Pass
            </button>
            <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
              <span>Discard:</span>
              <span>{localPlayer.graveyard.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER - Game Board */}
      <div className="flex-grow flex flex-col h-screen relative">
        {/* Opponent Hand (card backs) - positioned at top, slightly occluded */}
        <div className="absolute top-0 left-0 right-0 -translate-y-20">
          <Hand cards={opponentPlayer.hand} isLocalPlayer={false} />
        </div>

        {/* 5 Terrains (horizontal layout) - centered exactly */}
        <div className="flex gap-6 justify-center items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {gameState.terrains.map((terrain, terrainId) => {
            const opponentSlot = terrain.slots[opponentId];
            const playerSlot = terrain.slots[localPlayerId];

            // Calculate current control (who would win if game ended now)
            const opponentPower = opponentSlot.unit ? opponentSlot.unit.power + opponentSlot.modifier : 0;
            const playerPower = playerSlot.unit ? playerSlot.unit.power + playerSlot.modifier : 0;
            const controllingPlayer = opponentPower > playerPower ? 'opponent' : playerPower > opponentPower ? 'player' : 'tie';

            return (
              <div key={terrainId} className="flex flex-col gap-4 relative">
                {/* Opponent's slot */}
                <Slot
                  unit={opponentSlot.unit}
                  slotModifier={opponentSlot.modifier}
                  playerId={opponentId}
                  terrainId={terrainId}
                  isPlayerSlot={false}
                  winner={terrain.winner}
                  isTargetable={isAwaitingInput && pendingInputRequest?.type === 'target' && opponentSlot.unit !== null && pendingInputRequest.validTargetIds.includes(opponentSlot.unit.id)}
                  onUnitClick={handleUnitClick}
                />

                {/* Divider with control indicator */}
                <div className="relative h-3 flex items-center">
                  {/* Base divider line */}
                  <div className="absolute inset-0 h-0.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-stone-500 to-transparent rounded-full"></div>

                  {/* Control indicator arrow */}
                  {controllingPlayer !== 'tie' && (
                    <div className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ${
                      controllingPlayer === 'opponent' ? 'bottom-2' : 'top-2'
                    }`}>
                      {/* Triangle arrow pointing up (opponent) or down (player) */}
                      <div className={`w-0 h-0 ${
                        controllingPlayer === 'opponent'
                          ? 'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-blue-500'
                          : 'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-500'
                      }`}></div>
                    </div>
                  )}
                </div>

                {/* Player's slot */}
                <Slot
                  unit={playerSlot.unit}
                  slotModifier={playerSlot.modifier}
                  playerId={localPlayerId}
                  terrainId={terrainId}
                  isPlayerSlot={true}
                  isHighlighted={isLocalPlayerTurn && !!draggedCardId}
                  onDrop={handleSlotDrop}
                  winner={terrain.winner}
                  isTargetable={isAwaitingInput && pendingInputRequest?.type === 'target' && playerSlot.unit !== null && pendingInputRequest.validTargetIds.includes(playerSlot.unit.id)}
                  onUnitClick={handleUnitClick}
                />
              </div>
            );
          })}
        </div>

        {/* Player Hand (fanned) - positioned at bottom, slightly occluded */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-10">
          <Hand
            cards={localPlayer.hand}
            isLocalPlayer={true}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
          />
        </div>
      </div>
    </div>
  );
};
