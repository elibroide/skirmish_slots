import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameEngine } from '@skirmish/engine';
import { PlayerId, GameAction } from '@skirmish/engine';
import { Board } from './components/Board';
import { ConnectedHand } from './components/ConnectedHand';
// import { PhaserLayer } from '../phaser/PhaserLayer'; // Disabled
import { AnimationLayer } from './AnimationLayer';
import { PassButton } from './components/PassButton';
import { GameHUD } from './components/GameHUD';
import { BoardCardTooltip } from './components/BoardCardTooltip';
import { useEventProcessor } from './hooks/useEventProcessor';
import orderData from './Data/order.json'; // Ensure path is correct relative to GameScene
import { setGlobalEngine } from '@skirmish/engine';
import { useAnimationStore } from '../store/animationStore';
import { TunerPanel } from './components/debug/TunerPanel';

interface GameSceneProps {
    engine: GameEngine;
    localPlayerId: PlayerId;
    onBack?: () => void;
    onReady?: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ engine, localPlayerId, onBack, onReady }) => {
    // @ts-ignore
    const setGlobalEngineFromStore = useGameStore(state => state.setGlobalEngine);

    // 0. Set Global Engine and Subscribe to Events
    useEffect(() => {
        if (engine)
        {
            setGlobalEngine(engine);

            const unsubscribe = engine.onEvent((event) => {
                console.log(`[GameScene] Enqueuing Event: ${event.type}`);
                useGameStore.getState().enqueueEvent(event);
            });

            if (onReady)
            {
                // Defer slightly to ensure listeners are registered
                setTimeout(() => onReady(), 100);
            }

            return () => {
                setGlobalEngine(null);
                unsubscribe();
            };
        }
    }, [engine, onReady]);

    // 1. Initialize Event Processor
    useEventProcessor(localPlayerId);

    // 2. Connect to Store Settings using granular selectors to avoid excessive re-renders
    const handSettings = useGameStore(state => state.boardSettings.handSettings);


    const currentTurn = useGameStore(state => state.currentTurn);
    // Use optional chaining carefully - or better, split into two selectors
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
            // Register animation start position
            if (startPosition)
            {
                useAnimationStore.getState().registerPendingDrop(cardId, startPosition);
            }

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
            {/* 1. Phaser Background & Animation Canvas - DISABLED */}
            {/* <PhaserLayer /> */}

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


            {/* Tuner Panel (Debug) */}
            <TunerPanel
                settings={handSettings}
                onUpdate={(key, value) => {
                    useGameStore.getState().updateBoardSettings({
                        handSettings: {
                            ...handSettings,
                            [key]: value
                        }
                    });
                }}
                onReset={() => {
                    useGameStore.getState().resetBoardSettings();
                }}
            />

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
