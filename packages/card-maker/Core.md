# Project Specification: Generic Card Smithing Tool

## 1. System Role & Context
**Role:** Expert Senior Frontend Architect specializing in React, TypeScript, and Game Development tooling.
**Objective:** Architect and write the core code for a generic, schema-driven web application for designing and rendering game cards.

## 2. Project Goals
1.  **Define Schema:** Create a flexible system where card data fields (Power, Cost, Text) are defined by configuration, not hard-coded.
2.  **Visual Template Builder:** A UI to upload a card frame and visually layout data zones using drag-and-drop.
3.  **Content Creation:** A form-based input to create specific card instances based on the template.
4.  **Reusable Renderer:** The core `<CardRenderer />` component must be isolated and pure, suitable for extraction as an NPM package for the game engine.
5.  **Persistence:** The tool must automatically save progress (Schema, Templates, Cards) to LocalStorage and support Import/Export of the entire project state.
6.  **Presets:** Allow selecting frame images from a curated list of presets in `public/templates`.
7.  **Multi-Template:** Support multiple templates per project. Cards can be assigned to specific templates.
8.  **Duplication:** Enable easy duplication of Cards and Templates to streamline workflow.

## 3. Technology Stack
* **Build Tool:** Vite
*   **Framework:** React (Functional Components + Hooks)
    *   *Optimization:* Use conditional rendering for Tabs to avoid background DOM overhead.
*   **Language:** TypeScript (Strict typing is mandatory)
* **Styling:** Tailwind CSS
* **State Management:** Zustand (w/ `persist` middleware for LocalStorage)
* **UI Libraries:**
    * `react-draggable` & `react-resizable` (For the Editor UI)
    * `fitty` or `textfit` (For auto-scaling text)

## 4. Architecture & Data Models

### A. Core Interfaces
Define strict TypeScript interfaces for the following:

1.  **`CardSchema`**
    * Defines the data structure of a card type.
    * *Example:* `[{ key: "power", type: "number" }, { key: "description", type: "richtext" }]`
2.  **`CardTemplate`**
    * The visual configuration.
    * Contains the base Frame Image URL (DataURI or URL).
    * Contains a list of **Zones**.
    *   *Zone Definition:* Links a `Schema` key to a visual rectangle. Must store coordinates as **Percentages (%)** (x, y, width, height) to ensure responsiveness. Stores style props (font-family, size, color, align-h, align-v).
3.  **`CardInstance`**
    * The content for a specific card.
    * Key-Value pairs matching the Schema.
    * **Art Configuration:** Specific properties for the card illustration: `{ imageUrl: string, panX: number, panY: number, scale: number }`.
4.  **`ProjectState`**
    * The wrapper interface for the Export/Import file: `{ schema: CardSchema, template: CardTemplate, cards: CardInstance[] }`.

## 5. Component Specifications

### 1. `CardRenderer.tsx` (The "Engine")
* **Purpose:** A pure component that renders a card based on props.
* **Props:** `{ template: CardTemplate, data: CardInstance }`
* **Structure:**
    * **Container:** Relative positioning, hidden overflow.
    * **Layer 0 (Art):** An `<img>` element. Must apply CSS `transform: translate(x, y) scale(s)` based on the Art Configuration.
    * **Layer 1 (Frame):** The static frame image overlay (`pointer-events: none`).
    * **Layer 2 (Content):** Iterates through Template Zones. Renders data at absolute positions (using % values). Applies styles. Wraps text in a `Fitty` component to prevent overflow.

### 2. `TemplateEditor.tsx` (The "Designer")
* **Purpose:** The UI for creating the Layout.
* **Features:**
    * Canvas displaying the card frame.
    * **"Add Zone"** button to spawn new text/image areas.
    * **Interactables:** Zones must be wrapped in `react-draggable` and `react-resizable`.
    * **Math Logic:** Must convert pixel-based dragging into Percentage-based storage on save.
    *   **Sidebar:** 
        *   **Field Selection:** Toggle visibility of Schema Fields (one zone per field).
        *   **Properties:** Edit styling (Font, Size, Color, Align H/V).
        *   **Positioning:** Sliders + Number Inputs for X, Y, Width, Height.
        *   **Visual Previes:** Zones in the designer must reflect their assigned styles.

### 3. `CardSmith.tsx` (The "Content Entry")
* **Purpose:** The UI for creating actual cards.
* **Layout:** Split View (Form Left, Live Preview Right).
* **Dynamic Form:** Generates inputs based on the defined `CardSchema`.
*   **Art Tools:** A specialized control group for the illustration. Includes Sliders+Inputs for **Pan X**, **Pan Y**, and **Zoom**.
*   **Export:** Ability to export individual or multiple cards as PNG images.
*   **Rich Text:** "Richtext" fields must use a WYSIWYG editor (colors, formatting) and render as HTML.
*   **UX:** Auto-select newly created cards.

## 6. Data Persistence & I/O

**1. LocalStorage (`useStore.ts`)**
* Implement the `persist` middleware in Zustand.
*   The store should automatically save the current Project State (Schema, Template, Cards) to LocalStorage whenever a change is made.
*   **Manual Controls:** Add "Save Project" and "Clear Project" (with confirmation) buttons. Supports `Cmd/Ctrl+S` hotkey.
*   **Feedback:** Use non-blocking "Toasts" for save notifications instead of alerts.
* On page load, check for saved state and hydrate the store.

**2. Project Export/Import**
* **Export:** Create a function to dump the entire `ProjectState` store into a `.json` file and trigger a browser download.
* **Import:** Create a file input handler that parses an uploaded `.json` file, validates the schema types, and replaces the current store state.

## 7. Implementation Strategy
Please generate the initial codebase including:

1.  **`types.ts`**: The complete TypeScript definitions.
2.  **`useStore.ts`**: The Zustand store with Persistence logic and Export/Import actions.
3.  **`CardRenderer.tsx`**: The implementation of the reusable renderer.
4.  **`ZoneWrapper.tsx`**: A helper component for the Editor that handles the Drag/Resize logic and coordinate conversion (Pixels <-> Percentages).

**Crucial Constraints:**
* Ensure the `CardRenderer` has zero dependencies on the Editor logic.
* The Art layer must stay strictly within the card bounds (masked).
* Frame/Art images should handle DataURIs so that imported projects work offline.