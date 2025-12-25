import React, { useState } from 'react';
import { FullScreenToggle } from './FullScreenToggle';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { TerrainId, PlayerId, GameState, SlotCoord } from '../../engine/types';
import { DroppableSlot } from './DroppableSlot';
import { Hand } from './Hand';
import { Card } from './Card';
import { GameOverModal } from './GameOverModal';
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '../../engine/GameEngine';
import { getLeader } from '../../engine/leaders';

interface GameBoardProps {
  gameState: GameState;
  engine: GameEngine;
  localPlayerId: PlayerId;
  onPlayAgain: () => void;
  onMainMenu: () => void;
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
export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  engine,
  localPlayerId,
  onPlayAgain,
  onMainMenu
}) => {
  const [activeCard, setActiveCard] = useState<any>(null);
  const [validTargets, setValidTargets] = useState<{
    type: string;
    validSlots?: SlotCoord[];
    validUnitIds?: string[];
    validTerrainIds?: TerrainId[];
  } | null>(null);
  const { pendingInputRequest, pendingInputPlayerId, gameMode, downloadGameLog, isAIThinking, aiThinkingPlayerId } = useGameStore();

  const isGodMode = gameMode === 'god-mode';
  const isNetworkMode = gameMode === 'network';
  const opponentId = localPlayerId === 0 ? 1 : 0;
  const localPlayer = gameState.players[localPlayerId];
  const opponentPlayer = gameState.players[opponentId];
  const isLocalPlayerTurn = gameState.currentPlayer === localPlayerId;

  // Debug logging for network perspective
  if (isNetworkMode)
  {
    console.log(`[Perspective] You are Player ${localPlayerId}, Opponent is Player ${opponentId}`);
  }

  // Check if we're waiting for interaction
  const isAwaitingInput = pendingInputRequest !== null && (pendingInputPlayerId === localPlayerId || isGodMode);

  // Store Actions
  const { setDragState, setHoveredSlot, setSlotStatus, resetSlotStatus, slots: boardSlots } = useGameStore();

  const handleDragStart = (event: DragStartEvent) => {
    const card = engine.getCardById(event.active.id as string);
    if (!card) return;

    setDragState(true, card.id);
    setActiveCard(card);

    // Calculate and HIGHLIGHT valid targets
    const targets = card.getValidTargets(gameState);
    setValidTargets(targets as any);

    if (targets && targets.type === 'slots' && targets.validSlots)
    {
      // Find visible slot IDs that match valid targets
      const validSlotIds: number[] = [];

      targets.validSlots.forEach(target => {
        // Find slot ID for this terrain/player combo
        // Logic must match BoardScene mapping:
        // Enemy (Opponent, usually ID 1) -> Indices 0-4
        // Player (Local, usually ID 0) -> Indices 5-9
        // BUT opponentId changes based on localPlayerId.
        // Index logic:
        // Terrain 0: Opponent=0, Player=5
        // ...
        // Terrain i: Opponent=i, Player=i+5

        // Wait, opponentId is variable. 
        // In BoardScene:
        // Enemy Row (0-4) -> owner='enemy'
        // Player Row (5-9) -> owner='player'

        // We need to map (terrainId, playerId) -> slotId
        // If validTarget.playerId === localPlayerId -> it's a Player Slot (5 + terrainId)
        // If validTarget.playerId === opponentId -> it's an Enemy Slot (0 + terrainId)

        let slotId = -1;
        if (target.playerId === localPlayerId)
        {
          slotId = 5 + target.terrainId;
        } else if (target.playerId === opponentId)
        {
          slotId = target.terrainId;
        }

        if (slotId !== -1) validSlotIds.push(slotId);
      });

      if (validSlotIds.length > 0)
      {
        setSlotStatus(validSlotIds, 'showDrop');
      }
    }
  };

  const handleDragOver = (event: any) => {
    const over = event.over;

    // Reset any 'showTarget' back to 'showDrop' if it was droppable, or 'idle'
    // Actually, logic is tricky if we don't know previous state.
    // Simplest approach: Re-apply 'showDrop' to all valid targets, then apply 'showTarget' to current.
    // BUT re-applying 'showDrop' to everything every frame is expensive?
    // GameStore 'setSlotStatus' is relatively cheap (local state).
    // Let's optimize: Only if changed.

    // For now, let's trust "resetSlotStatus" is for dragEnd.
    // During drag, we want to maintain the "Valid Drops" glow, but highlight the "Current Hover".
    // If I hover Slot A, it becomes 'showTarget'.
    // If I move to Slot B, Slot A should go back to 'showDrop' (if it was valid) or 'idle' (if invalid).
    // Slot B becomes 'showTarget'.

    // Better strategy:
    // 1. Get List of Valid Slot IDs (memoized from dragStart? or stored in component state 'validTargets')
    // 2. Determine Current Hover Slot ID.
    // 3. For every slot:
    //    - If ID == HoverID -> 'showTarget'
    //    - Else If ID in ValidIDs -> 'showDrop'
    //    - Else -> 'idle'

    // This is clean but O(N) where N=10. Very fast.

    const currentHoverId = over?.data?.current?.slotId;

    // We need access to the valid slot IDs here.
    // We have `validTargets`.
    let validIds: number[] = [];
    if (validTargets && validTargets.type === 'slots' && validTargets.validSlots)
    {
      validTargets.validSlots.forEach(target => {
        if (target.playerId === localPlayerId) validIds.push(5 + target.terrainId);
        else if (target.playerId === opponentId) validIds.push(target.terrainId);
      });
    }

    if (currentHoverId !== undefined && currentHoverId !== null)
    {
      setHoveredSlot(currentHoverId);

      // Batch update status:
      // We can't update ALL slots status every frame efficiently via `setSlotStatus` if it accepts array.
      // We probably want to minimize flux.
      // BUT, for correctness:
      // Identify IDs that shout be showDrop (Valid - Hover)
      // Identify ID that should be showTarget (Hover)

      const idsToShowDrop = validIds.filter(id => id !== currentHoverId);
      const idsToShowTarget = [currentHoverId]; // Even if not valid? Usually yes, to show selection.

      // Dispatch
      setSlotStatus(idsToShowDrop, 'showDrop');
      setSlotStatus(idsToShowTarget, 'showTarget');
    } else
    {
      setHoveredSlot(null);
      // Reset to showDrop for all valid
      if (validIds.length > 0)
      {
        setSlotStatus(validIds, 'showDrop');
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragState(false);
    setHoveredSlot(null);
    resetSlotStatus(); // Reset visuals

    const { active, over } = event;

    if (!over || !activeCard)
    {
      setActiveCard(null);
      setValidTargets(null);
      return;
    }

    const dropData = over.data.current;
    if (dropData && dropData.slotCoord)
    {
      const { terrainId, playerId } = dropData.slotCoord;
      handleSlotDrop(terrainId, playerId, active.id as string);
    }

    setActiveCard(null);
    setValidTargets(null);
  };

  const handleSlotDrop = (terrainId: number, slotPlayerId: PlayerId, cardId: string) => {
    let card = engine.getCardById(cardId);
    let ownerId = card?.owner ?? localPlayerId;

    if (!card) return;

    const tId = terrainId as TerrainId;

    if (card.getType() === 'unit')
    {
      if (validTargets && validTargets.type === 'slots' && validTargets.validSlots)
      {
        const isValid = validTargets.validSlots.some(
          s => s.terrainId === tId && s.playerId === slotPlayerId
        );

        if (isValid)
        {
          const action = {
            type: 'PLAY_CARD' as const,
            playerId: ownerId,
            cardId: cardId,
            targetSlot: { terrainId: tId, playerId: slotPlayerId },
          };
          console.log(`[Action] ${ownerId === localPlayerId ? 'YOU' : 'OPPONENT'} playing card to terrain ${tId}, slot player ${slotPlayerId}`);
          engine.submitAction(action);
        }
      }
    } else
    {
      if (!validTargets || validTargets.type === 'none')
      {
        engine.submitAction({
          type: 'PLAY_CARD',
          playerId: ownerId,
          cardId: cardId,
        });
      } else if (validTargets.type === 'slots' && validTargets.validSlots)
      {
        const isValid = validTargets.validSlots.some(
          s => s.terrainId === tId && s.playerId === slotPlayerId
        );
        if (isValid)
        {
          engine.submitAction({
            type: 'PLAY_CARD',
            playerId: ownerId,
            cardId: cardId,
            targetSlot: { terrainId: tId, playerId: slotPlayerId }
          });
        }
      }
    }
  };

  const handleUnitClick = (unitId: string) => {
    console.log('[UI] handleUnitClick called with unitId:', unitId);
    console.log('[UI] isAwaitingInput:', isAwaitingInput, 'pendingInputRequest:', pendingInputRequest);

    // Only handle clicks if we're awaiting input for targeting
    if (!isAwaitingInput) return;
    if (!pendingInputRequest || pendingInputRequest.type !== 'target') return;

    // Check if we're targeting by unit ID (e.g., Warlord ability)
    if (pendingInputRequest.validTargetIds)
    {
      const isValid = pendingInputRequest.validTargetIds.includes(unitId);
      console.log('[UI] Checking validTargetIds:', pendingInputRequest.validTargetIds, 'isValid:', isValid);
      if (!isValid) return;
      // Submit the unit ID directly
      console.log('[UI] Submitting unit ID:', unitId);
      engine.submitInput(unitId);
      return;
    }

    // Otherwise, find the unit's slot for slot-based targeting
    let targetSlot: { terrainId: TerrainId; playerId: PlayerId } | null = null;

    // Search for unit in terrains
    for (let i = 0; i < gameState.terrains.length; i++)
    {
      const terrain = gameState.terrains[i];
      if (terrain.slots[0].unit?.id === unitId)
      {
        targetSlot = { terrainId: i as TerrainId, playerId: 0 };
        break;
      }
      if (terrain.slots[1].unit?.id === unitId)
      {
        targetSlot = { terrainId: i as TerrainId, playerId: 1 };
        break;
      }
    }

    if (!targetSlot) return;

    // Check if this slot is a valid target
    if (pendingInputRequest.validSlots)
    {
      const isValid = pendingInputRequest.validSlots.some(
        s => s.terrainId === targetSlot!.terrainId && s.playerId === targetSlot!.playerId
      );
      if (!isValid) return;
    }

    // Submit the target slot directly to the engine
    engine.submitInput(targetSlot);
  };

  const handleSlotClick = (terrainId: number, slotPlayerId: PlayerId) => {
    // Only handle clicks if we're awaiting input
    if (!isAwaitingInput) return;

    // Check if we have a request
    if (!pendingInputRequest) return;

    // Check if this slot is valid
    if (pendingInputRequest.type === 'target' && pendingInputRequest.validSlots)
    {
      const isValid = pendingInputRequest.validSlots.some(
        (s: { terrainId: number; playerId: PlayerId }) => s.terrainId === terrainId && s.playerId === slotPlayerId
      );
      if (!isValid) return;
    }

    // Submit input
    engine.submitInput({ terrainId: terrainId as TerrainId, playerId: slotPlayerId });
  };

  const handlePass = (playerId: PlayerId) => {
    // Validate turn
    if (gameState.currentPlayer !== playerId) return;

    console.log(`[Action] ${playerId === localPlayerId ? 'YOU' : 'OPPONENT'} passing turn (Player ${playerId})`);
    engine.submitAction({
      type: 'PASS',
      playerId,
    });
  };

  const handleActivateLeader = (playerId: PlayerId) => {
    // Validate turn
    if (gameState.currentPlayer !== playerId) return;

    const leaderState = gameState.leaders[playerId];
    if (!leaderState || leaderState.currentCharges <= 0) return;

    const leader = getLeader(leaderState.leaderId, engine, playerId);
    if (!leader.ability) return;

    console.log(`[Action] ${playerId === localPlayerId ? 'YOU' : 'OPPONENT'} activating leader ability (Player ${playerId})`);
    engine.submitAction({
      type: 'ACTIVATE_LEADER',
      playerId,
    });
  };

  // Get leader info for both players
  const localLeaderState = gameState.leaders[localPlayerId];
  const opponentLeaderState = gameState.leaders[opponentId];
  const localLeader = getLeader(localLeaderState.leaderId, engine, localPlayerId);
  const opponentLeader = getLeader(opponentLeaderState.leaderId, engine, opponentId);

  // Check if leader ability can be activated
  const canActivateLocalLeader = localLeader.ability !== null &&
    localLeaderState.currentCharges > 0 &&
    !localLeaderState.isExhausted &&
    isLocalPlayerTurn &&
    localLeader.ability.canActivate();

  const canActivateOpponentLeader = opponentLeader.ability !== null &&
    opponentLeaderState.currentCharges > 0 &&
    !opponentLeaderState.isExhausted &&
    !isLocalPlayerTurn &&
    opponentLeader.ability.canActivate();

  // Calculate projected SP using Engine logic
  const calculateProjectedSP = () => {
    let player0SP = 0;
    let player1SP = 0;

    gameState.terrains.forEach((_, index) => {
      // Use the new engine method to get the correct winner (including Rogue logic)
      const winner = engine.calculateTerrainWinner(index as TerrainId);

      if (winner === 0)
      {
        player0SP += 1;
      } else if (winner === 1)
      {
        player1SP += 1;
      }
    });

    return { player0SP, player1SP };
  };

  const projectedSP = calculateProjectedSP();
  const localProjectedSP = localPlayerId === 0 ? projectedSP.player0SP : projectedSP.player1SP;
  const opponentProjectedSP = opponentId === 0 ? projectedSP.player0SP : projectedSP.player1SP;

  // Helper to determine if a specific slot/unit is a valid target for the current drag
  const isSlotValidTarget = (terrainId: number, slotPlayerId: PlayerId, unitId?: string) => {
    if (!validTargets || validTargets.type !== 'slots' || !validTargets.validSlots) return false;

    return validTargets.validSlots.some(
      (slot) => slot.terrainId === terrainId && slot.playerId === slotPlayerId
    );
  };

  return (
    <>
      <FullScreenToggle className="absolute top-4 right-4 z-50" />
      <GameOverModal
        gameState={gameState}
        localPlayerId={localPlayerId}
        onPlayAgain={onPlayAgain}
        onMainMenu={onMainMenu}
      />

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="min-h-screen bg-stone-200 p-4 flex gap-4">
          {/* LEFT PANEL - Opponent, Skirmish Tracker, Player */}
          <div className="flex flex-col w-48 h-screen py-4">
            {/* ... (Left Panel Content same as before) ... */}
            {/* Opponent Character - TOP LEFT CORNER */}
            <div className={`bg-blue-200 border-2 rounded-lg p-4 h-48 flex flex-col ${!isLocalPlayerTurn ? 'border-amber-500 shadow-lg' : 'border-stone-800'}`}>
              <div className="font-hand text-lg text-center mb-2 flex items-center justify-center gap-2">
                <span>Opponent</span>
                {!isLocalPlayerTurn && <span className="text-amber-600">●</span>}
              </div>
              <div className="flex-grow bg-blue-100 rounded border border-stone-600 flex items-center justify-center relative">
                {isAIThinking && aiThinkingPlayerId === opponentId ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
                    <span className="font-ui text-xs text-stone-600">Thinking...</span>
                  </div>
                ) : (
                  <span className="font-ui text-xs text-stone-600">Character art</span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {isGodMode ? (
                  <button
                    onClick={() => handlePass(opponentId)}
                    disabled={gameState.currentPlayer !== opponentId || gameState.isDone[opponentId]}
                    className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-stone-400 border-2 border-stone-800 rounded px-2 py-1 font-hand text-sm"
                  >
                    Pass
                  </button>
                ) : (
                  <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
                    <span>Passed:</span>
                    <span>{gameState.isDone[opponentId] ? 'Yes' : 'No'}</span>
                  </div>
                )}
                <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
                  <span>Discard:</span>
                  <span>{opponentPlayer.graveyard.length}</span>
                </div>
                {!isGodMode && (
                  <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
                    <span>Hand:</span>
                    <span>{opponentPlayer.hand.length}</span>
                  </div>
                )}
                {/* Leader Display */}
                {opponentLeader.definition.maxCharges > 0 && (
                  <div className="bg-purple-100 px-2 py-1 rounded text-xs font-ui">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{opponentLeader.definition.name}</span>
                      <span className="text-purple-600">
                        {opponentLeaderState.currentCharges}/{opponentLeader.definition.maxCharges}
                      </span>
                    </div>
                    <div className="text-stone-500 text-[10px] mt-0.5">
                      {opponentLeader.definition.abilityDescription}
                    </div>
                    {isGodMode && (
                      <button
                        onClick={() => handleActivateLeader(opponentId)}
                        disabled={!canActivateOpponentLeader}
                        className="w-full mt-1 bg-purple-400 hover:bg-purple-500 disabled:bg-stone-400 border border-stone-800 rounded px-1 py-0.5 text-[10px]"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Spacer to push skirmishes to middle */}
            <div className="flex-grow"></div>

            {/* Skirmish tracking */}
            <div className="flex gap-2 justify-center">
              {/* Skirmish 1 */}
              <div className="flex flex-col gap-1">
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 1
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
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 1
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
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 2
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
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 2
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
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 3
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
                <div className={`w-14 h-10 border-2 rounded flex items-center justify-center font-bold text-base ${gameState.currentSkirmish === 3
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
                  onClick={() => handlePass(localPlayerId)}
                  disabled={!isLocalPlayerTurn || gameState.isDone[localPlayerId]}
                  className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-stone-400 border-2 border-stone-800 rounded px-2 py-1 font-hand text-sm"
                >
                  Pass
                </button>
                <button
                  onClick={downloadGameLog}
                  className="w-full bg-green-400 hover:bg-green-500 border-2 border-stone-800 rounded px-2 py-1 font-hand text-xs"
                  title="Download game log as JSON"
                >
                  📥 Log
                </button>
                <div className="bg-white px-2 py-1 rounded text-xs font-ui flex justify-between">
                  <span>Discard:</span>
                  <span>{localPlayer.graveyard.length}</span>
                </div>
                {/* Leader Display */}
                {localLeader.definition.maxCharges > 0 && (
                  <div className="bg-purple-100 px-2 py-1 rounded text-xs font-ui">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{localLeader.definition.name}</span>
                      <span className="text-purple-600">
                        {localLeaderState.currentCharges}/{localLeader.definition.maxCharges}
                      </span>
                    </div>
                    <div className="text-stone-500 text-[10px] mt-0.5">
                      {localLeader.definition.abilityDescription}
                    </div>
                    <button
                      onClick={() => handleActivateLeader(localPlayerId)}
                      disabled={!canActivateLocalLeader}
                      className="w-full mt-1 bg-purple-400 hover:bg-purple-500 disabled:bg-stone-400 border border-stone-800 rounded px-1 py-0.5 text-[10px]"
                    >
                      Activate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CENTER - Game Board */}
          <div className="flex-grow flex flex-col h-screen relative">
            {/* Opponent Hand (card backs) - positioned at top, slightly occluded */}
            <div className={`absolute top-0 left-0 right-0 ${isGodMode ? '' : '-translate-y-20'}`}>
              {isNetworkMode && (
                <div className="text-center mb-2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-ui text-sm">
                    Opponent (Player {opponentId})
                  </span>
                </div>
              )}
              <Hand
                cards={opponentPlayer.hand}
                isLocalPlayer={false}
                isOpen={isGodMode}
                isTop={isGodMode}
              />
            </div>

            {/* 5 Terrains (Absolute Positioned via Store) */}
            <div className="absolute inset-0 pointer-events-none">
              {gameState.terrains.map((terrain, index) => {
                const terrainId = index as TerrainId;
                const opponentSlot = terrain.slots[opponentId];
                const playerSlot = terrain.slots[localPlayerId];

                // Determine Numeric Slot IDs for Layout
                // Enemy: 0-4, Player: 5-9
                const opponentSlotId = index;
                const playerSlotId = index + 5;

                const opponentLayout = boardSlots[opponentSlotId];
                const playerLayout = boardSlots[playerSlotId];

                // Use engine to calculate current projected winner (respects Rogue and other rules)
                const projectedWinner = engine.calculateTerrainWinner(terrainId);
                const controllingPlayer = projectedWinner === opponentId ? 'opponent' : projectedWinner === localPlayerId ? 'player' : 'tie';

                // Highlighting Logic using generic isSlotValidTarget
                const isOpponentSlotValid = isSlotValidTarget(terrainId, opponentId, opponentSlot.unit?.id);
                const isPlayerSlotValid = isSlotValidTarget(terrainId, localPlayerId, playerSlot.unit?.id);

                // Input Request Targeting (e.g. Archer deploy ability, Warlord leader ability)
                const isOpponentSlotTargetable = isAwaitingInput && pendingInputRequest?.type === 'target' && (
                  pendingInputRequest.validSlots?.some(s => s.terrainId === terrainId && s.playerId === opponentId) ||
                  (pendingInputRequest.validTargetIds && opponentSlot.unit && pendingInputRequest.validTargetIds.includes(opponentSlot.unit.id))
                );

                const isPlayerSlotTargetable = isAwaitingInput && pendingInputRequest?.type === 'target' && (
                  pendingInputRequest.validSlots?.some(s => s.terrainId === terrainId && s.playerId === localPlayerId) ||
                  (pendingInputRequest.validTargetIds && playerSlot.unit && pendingInputRequest.validTargetIds.includes(playerSlot.unit.id))
                );

                return (
                  <React.Fragment key={terrainId}>
                    {/* Opponent's slot */}
                    {opponentLayout && (
                      <div
                        className="absolute pointer-events-auto"
                        style={{
                          left: opponentLayout.x,
                          top: opponentLayout.y,
                          width: opponentLayout.width,
                          height: opponentLayout.height,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <DroppableSlot
                          unit={opponentSlot.unit}
                          slotModifier={opponentSlot.modifier}
                          playerId={opponentId}
                          terrainId={terrainId}
                          isPlayerSlot={false}
                          winner={terrain.winner}
                          isTargetable={isOpponentSlotTargetable || isOpponentSlotValid}
                          onUnitClick={handleUnitClick}
                          onSlotClick={handleSlotClick}
                          isHighlighted={isOpponentSlotValid}
                          // Pass ID for tracking
                          slotId={opponentSlotId}
                        />
                      </div>
                    )}

                    {/* Player's slot */}
                    {playerLayout && (
                      <div
                        className="absolute pointer-events-auto"
                        style={{
                          left: playerLayout.x,
                          top: playerLayout.y,
                          width: playerLayout.width,
                          height: playerLayout.height,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <DroppableSlot
                          unit={playerSlot.unit}
                          slotModifier={playerSlot.modifier}
                          playerId={localPlayerId}
                          terrainId={terrainId}
                          isPlayerSlot={true}
                          isHighlighted={isPlayerSlotValid}
                          winner={terrain.winner}
                          isTargetable={isPlayerSlotTargetable || isPlayerSlotValid}
                          onUnitClick={handleUnitClick}
                          onSlotClick={handleSlotClick}
                          // Pass ID for tracking
                          slotId={playerSlotId}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Player Hand (fanned) - positioned at bottom, slightly occluded */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-10">
              {isNetworkMode && (
                <div className="text-center mb-2">
                  <span className="bg-pink-600 text-white px-4 py-1 rounded-full font-ui text-sm">
                    You (Player {localPlayerId})
                  </span>
                </div>
              )}
              <Hand
                cards={localPlayer.hand}
                isLocalPlayer={true}
              />
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <Card card={activeCard} isInHand={false} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};
