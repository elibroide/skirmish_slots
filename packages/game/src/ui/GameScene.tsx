import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '@skirmish/engine';
import { PlayerId, GameAction } from '@skirmish/engine';
import { Board } from './components/Board';
import { ConnectedHand } from './components/ConnectedHand';
import { PhaserLayer } from '../phaser/PhaserLayer';
import { AnimationLayer } from './AnimationLayer';
import { PassButton } from './components/PassButton';
import { GameHUD } from './components/GameHUD';
import { BoardCardTooltip } from './components/BoardCardTooltip';
import { useEventProcessor } from './hooks/useEventProcessor';
import orderData from './Data/order.json'; // Ensure path is correct relative to GameScene
import { setGlobalEngine } from '@skirmish/engine';

interface GameSceneProps {
    engine: GameEngine;
    localPlayerId: PlayerId;
    onBack?: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ engine, localPlayerId, onBack }) => {
    // 1. Initialize Event Processor
    useEventProcessor(localPlayerId);

    // 2. Connect to Store Settings
    const boardSettings = useGameStore(state => state.boardSettings);
    const handSettings = boardSettings.handSettings;
    const currentTurn = useGameStore(state => state.currentTurn);
    const turnStatus = useGameStore(state => state.players[localPlayerId]?.turnStatus || 'none');

    // Pass Button State
    // Logic: 
    // - Show if it's MY turn (currentTurn match) AND I haven't passed (turnStatus !== 'done')
    // - Hide otherwise

    const isMyTurn = (currentTurn === 'player' && localPlayerId === 0) || (currentTurn === 'opponent' && localPlayerId === 1);
    const canPass = isMyTurn && turnStatus !== 'done';

    const [passStatus, setPassStatus] = useState<'normal' | 'disabled' | 'clicked'>('normal');

    const handlePass = async () => {
        if (!canPass) return;
        setPassStatus('clicked');
        try
        {
            await engine.submitAction({ type: 'PASS', playerId: localPlayerId });
        } catch (e)
        {
            console.error("Pass Failed", e);
        }
        setPassStatus('normal');
    };

    const handleCardDrop = async (
        cardId: string,
        targetSlot: { playerId: PlayerId, terrainId: any },
        dropPosition: any,
        startPosition: any
    ) => {
        // Submit Action
        try
        {
            await engine.submitAction({
                type: 'PLAY_CARD',
                playerId: localPlayerId,
                cardId,
                targetSlot
            });
            // Optimization: We could trigger animation here specifically for USER to reduce latency perception
            // But relying on EventProcessor ensures consistency.
        } catch (e)
        {
            console.error("Play Card Failed", e);
            // Ideally unhide the card in ConnectedHand (needs ref refactor or global event?)
            // For now, console error.
        }
    };

    // Set global engine reference for non-reactive access (avoids freezing)
    useEffect(() => {
        setGlobalEngine(engine);
    }, [engine]);

    // Sub to Engine Events (to feed Store Queue)
    useEffect(() => {
        console.log('[GameScene] Subscribing to GameEngine events');
        // Enqueuing is done by listener.
        const enqueueEvent = useGameStore.getState().enqueueEvent;
        const unsub = engine.onEvent((e) => {
            console.log('[GameScene] Received Engine Event:', e.type);
            enqueueEvent(e);
        });
        return () => {
            console.log('[GameScene] Unsubscribing from GameEngine events');
            unsub();
        };
    }, [engine]);

    // Initial Engine Start (if not started)
    useEffect(() => {
        const init = async () => {
            // If engine needs start?
            // engine.start();
        };
        init();
    }, [engine]);


    return (
        <div className="min-h-screen bg-stone-950 overflow-hidden relative flex flex-col items-center justify-end pb-12">
            {/* 1. Phaser Background & Animation Canvas */}
            <PhaserLayer />

            {/* 2. Board Layer */}
            <div className="z-0">
                <Board />
            </div>

            {/* 3. HUD Layer */}
            <GameHUD />

            {/* 4. Animation Layer (React Overlay for flying cards) */}
            <AnimationLayer
                settings={handSettings}
                templates={orderData.templates as any}
                schema={orderData.schema as any}
            />

            {/* 5. Hands */}
            {/* Local Player */}
            <ConnectedHand
                playerId={localPlayerId}
                isFacedown={false}
                onCardDrop={handleCardDrop}
            />

            {/* Opponent (Player 1 if local is 0, else 0) */}
            <ConnectedHand
                playerId={localPlayerId === 0 ? 1 : 0}
                isFacedown={true}
            // No onCardDrop for opponent - they play via engine events
            />

            {/* 5. UI Overlay */}
            <PassButton
                mode={canPass ? 'pass' : 'none'}
                status={passStatus}
                onClick={handlePass}
                onMouseDown={() => setPassStatus('clicked')}
                onMouseUp={() => setPassStatus('normal')}
            />

            <BoardCardTooltip />


            {/* Back Button (Debug/Dev) */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 text-white bg-red-900 px-4 py-2 rounded hover:bg-red-700"
            >
                Exit
            </button>
        </div>
    );
};
