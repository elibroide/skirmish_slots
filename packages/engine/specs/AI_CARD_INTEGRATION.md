# AI Card Integration Pipeline

This document defines the procedure for the AI Agent to integrate raw card data into the game engine.

## Input
- **File**: `packages/game/src/data/cards.json` (Raw output from Card Maker)

### 3. Usage
Run the integration script:
```bash
node packages/engine/scripts/integrate.cjs
```

This script:
1.  Reads `packages/engine/src/data/cards.json`.
2.  Iterates through each card.
3.  Checks if a file `packages/engine/src/data/cards/{id}.json` exists.
    -   **If Exists**: Skips (preserves manual edits).
    -   **If New**: Creates the file with Type Parsing applied.
4.  Generates `packages/engine/src/data/cards/index.ts` to export all cards.

### 4. Output
-   **Directory**: `packages/engine/src/data/cards/`
-   **Files**: Individual JSON files (e.g. `squad_leader.json` or by ID).
-   **Index**: `index.ts` imports all JSONs and exports `integratedCards` array.
-   **Structure** (in JSON):
    ```json
    {
      "id": "...",
      "name": "...",
      "cardType": "Unit", // Parsed
      "unitType": "Soldier", // Parsed
      "traits": [...], // Mapped
      "data": { ... } // Original Rich Data
    }
    ```

## Process (Rich Integration)
The goal is to produce a file that serves **both** the Engine and the Card Maker/UI.
1.  **Preserve Original Structure**: Keep `id`, `templateId`, `data`, `artConfig` exactly as is.
2.  **Enrich for Engine**: Add root-level properties required by `UnitCardDefinition`:
    -   `name`: Copy from `data.name`.
    -   `basePower`: Copy from `data.power` (parse as int).
    -   `cost`: Copy from `data.cost` (parse as int).
    -   `traits`: Generate the array of `TraitDefinition` based on `data.text`.
    -   `rarity`: Copy from `data.rarity`.
    -   `color`: Copy from `data.color`.
    -   `cardType`: Parse from `data.type`. If starts with "Unit", set to "Unit". If "Action" or "Command", set to "Command".
    -   `unitType`: Parse from `data.type`. If format is "Category // Subtype", this is the Subtype (e.g. "Criminal").
3.  **Validation**: Ensure `traits` logic is strictly compliant with Engine V7.

## Type Parsing
-   `cardType`: Parse from `data.type`. If starts with "Unit", set to "unit". If "Action" or "Command", set to "action".
-   `unitType`: Parse from `data.type`. If format is "Category // Subtype", this is the Subtype (e.g. "Criminal").

## Trait Mapping Reference (V7)
-   **"Close Ally"** -> `target: { zone: 'CLOSE', relationship: 'ALLY' }`
-   **"Close Enemy"** -> `target: { zone: 'CLOSE', relationship: 'ENEMY' }`
-   **"Opposing Enemy"** -> `target: { zone: 'IN_FRONT', relationship: 'ENEMY' }`
