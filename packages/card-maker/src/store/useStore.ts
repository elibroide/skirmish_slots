import { create } from 'zustand';
import { generateRandomName } from '../utils/nameGenerator';
import { persist } from 'zustand/middleware';
import type { ProjectState, CardSchema, CardTemplate, CardInstance, Zone } from '../types';

interface StoreState extends ProjectState {
  setSchema: (schema: CardSchema) => void;
  
  // UI State
  collapsedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;

  // Template Actions
  addTemplate: (name: string) => void;
  updateTemplate: (id: string, updates: Partial<CardTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  setActiveTemplateId: (id: string | null) => void;
  
  // Template Content Actions (proxy to active template)
  setTemplateFrame: (url: string) => void;
  addZone: (zone: Zone) => void;
  updateZone: (id: string, zone: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  
  // Card Actions
  addCard: (templateId?: string) => string;
  updateCard: (id: string, data: Partial<CardInstance>) => void;
  deleteCard: (id: string) => void;
  duplicateCard: (id: string) => void;
  setActiveCardId: (id: string | null) => void;
  setActiveZoneId: (id: string | null) => void;

  loadProject: (state: ProjectState) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      schema: [],
      collapsedSections: {},
      templates: [],
      cards: [],
      activeCardId: null,
      activeTemplateId: null,
      activeZoneId: null,

      setSchema: (schema) => set({ schema }),
      
      toggleSection: (id) => set(state => ({
        collapsedSections: {
            ...state.collapsedSections,
            [id]: !state.collapsedSections[id]
        }
      })),
      
      addTemplate: (name) => {
          const id = crypto.randomUUID();
          const newTemplate: CardTemplate = {
              id,
              name,
              frameUrl: "",
              zones: []
          };
          set(state => ({
              templates: [...state.templates, newTemplate],
              activeTemplateId: id
          }));
      },

      updateTemplate: (id, updates) => set(state => ({
          templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      deleteTemplate: (id) => set(state => {
          const newTemplates = state.templates.filter(t => t.id !== id);
          return {
              templates: newTemplates,
              activeTemplateId: state.activeTemplateId === id ? (newTemplates[0]?.id || null) : state.activeTemplateId
          };
      }),

      duplicateTemplate: (id) => set(state => {
          const original = state.templates.find(t => t.id === id);
          if (!original) return {};
          
          const newId = crypto.randomUUID();
          const copy: CardTemplate = {
              ...original,
              id: newId,
              name: `${original.name} (Copy)`
          };
          return {
              templates: [...state.templates, copy],
              activeTemplateId: newId
          };
      }),

      setActiveTemplateId: (id) => set({ activeTemplateId: id }),

      // --- Helper Actions for Active Template ---
      
      setTemplateFrame: (url) => set((state) => {
          const tid = state.activeTemplateId;
          if (!tid) return {};
          return {
            templates: state.templates.map(t => t.id === tid ? { ...t, frameUrl: url } : t)
          };
      }),

      addZone: (zone) => set((state) => {
          const tid = state.activeTemplateId;
          if (!tid) return {};
          return {
            templates: state.templates.map(t => t.id === tid ? { ...t, zones: [...t.zones, zone] } : t)
          };
      }),

      updateZone: (zid, updates) => set((state) => {
          const tid = state.activeTemplateId;
          if (!tid) return {};
          return {
            templates: state.templates.map(t => t.id === tid ? { 
                ...t, 
                zones: t.zones.map(z => z.id === zid ? { ...z, ...updates } : z)
            } : t)
          };
      }),
      
      removeZone: (zid) => set((state) => {
          const tid = state.activeTemplateId;
          if (!tid) return {};
          return {
            templates: state.templates.map(t => t.id === tid ? { 
                ...t, 
                zones: t.zones.filter(z => z.id !== zid) 
            } : t),
            activeZoneId: state.activeZoneId === zid ? null : state.activeZoneId
          };
      }),


      addCard: (templateId) => {
        const id = crypto.randomUUID();
        const state = get();
        // Default to active template or first available
        const tid = templateId || state.activeTemplateId || state.templates[0]?.id;
        
        if (!tid) {
            console.warn("Cannot create card without a template");
            return "";
        }

        const initialData: Record<string, any> = {};
        state.schema.forEach(field => {
            if (field.defaultValue !== undefined && field.defaultValue !== "") {
                if (field.type === 'number') {
                    const num = parseFloat(field.defaultValue);
                    initialData[field.key] = isNaN(num) ? 0 : num;
                } else {
                    initialData[field.key] = field.defaultValue;
                }
            } else if (field.key === 'name') {
                initialData[field.key] = generateRandomName();
            }
        });

        set((state) => ({
            cards: [
                ...state.cards,
                {
                    id,
                    templateId: tid,
                    data: initialData,
                    artConfig: { 
                        imageUrl: "", 
                        x: 0, y: 0, scale: 1, 
                        isMask: false, 
                        maskX: 0, maskY: 0, maskWidth: 750, maskHeight: 1050 
                    }
                }
            ]
        }));
        return id;
    },

      updateCard: (id, updates) => set((state) => ({
        cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteCard: (id) => set((state) => ({
        cards: state.cards.filter(c => c.id !== id),
        activeCardId: state.activeCardId === id ? null : state.activeCardId
      })),
      
      duplicateCard: (id) => set(state => {
          const original = state.cards.find(c => c.id === id);
          if (!original) return {};
          
          const newId = crypto.randomUUID();
          const copy = { ...original, id: newId };
          return {
              cards: [...state.cards, copy]
          };
      }),
      
      setActiveCardId: (id) => set({ activeCardId: id }),
      setActiveZoneId: (id) => set({ activeZoneId: id }),

      loadProject: (project: ProjectState) => set(project),
    }),
    {
      name: 'card-maker-storage',
      partialize: (state) => ({ 
          schema: state.schema, 
          templates: state.templates, // Persist everything including frameUrl
          cards: state.cards,
          activeCardId: state.activeCardId,
          activeTemplateId: state.activeTemplateId,

          activeZoneId: state.activeZoneId,
          collapsedSections: state.collapsedSections
      }),
      onRehydrateStorage: () => (state) => {
          if (!state) return;
          
          // Migration: If we have old 'template' (from previous version not typed here but existing in localstorage JSON)
          // we need to move it. However, zustand types won't show it.
          // We can check if templates is empty and we have something else? 
          // Actually, since we changed the key name, 'templates' will be undefined or empty in old storage.
          // But 'template' will exist in the raw JSON.
          // Zustand's persist handles this by merging?
          // If 'templates' is missing, initialize it.
          
          // Since we can't easily access the raw "template" property from typed state here without casting
          // We might rely on the fact that if templates is empty, we create a default one.
          
          if (!state.templates || state.templates.length === 0) {
              // Try to rescue or create default
              // In a real migration we'd inspect the raw storage, but here let's valid state
               const defaultId = crypto.randomUUID();
               state.templates = [{
                   id: defaultId,
                   name: "Default Template",
                   frameUrl: "",
                   zones: []
               }];
               state.activeTemplateId = defaultId;
               
               // If there were cards, they need a templateId
               if (state.cards.length > 0) {
                   state.cards = state.cards.map(c => ({
                       ...c,
                       templateId: c.templateId || defaultId
                   }));
               }
          }
      }
    }
  )
);
