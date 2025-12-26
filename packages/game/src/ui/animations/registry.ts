import { AnimatedCardPlay } from '../components/AnimatedCardPlay';
import React from 'react';

// Registry mapping animation types (string) to React Components
export const ANIMATION_COMPONENTS: Record<string, React.FC<any>> = {
    'card_play': AnimatedCardPlay,
    // Add new animations here:
    // 'unit_death': AnimatedUnitDeath,
};
