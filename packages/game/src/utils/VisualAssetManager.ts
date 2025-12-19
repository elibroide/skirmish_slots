import projectData from '../config/card-maker-project.json';

// Types from the JSON schema
interface CardMakerProject {
  cards: Array<{
    id: string;
    templateId: string;
    data: {
      name: string;
      [key: string]: any;
    };
    artConfig?: any;
    frameVariantId?: string;
  }>;
  templates: any[];
  schema: any[];
}

interface VisualData {
  cardId: string;
  templateId: string;
  data: any;
  artConfig: any;
  frameVariantId?: string;
}

class VisualAssetManager {
  private static instance: VisualAssetManager;
  private cardIndex: Map<string, VisualData>;

  private constructor() {
    this.cardIndex = new Map();
    this.indexCards();
  }

  public static getInstance(): VisualAssetManager {
    if (!VisualAssetManager.instance) {
      VisualAssetManager.instance = new VisualAssetManager();
    }
    return VisualAssetManager.instance;
  }

  private indexCards() {
    // Index by sanitized name for flexible matching
    (projectData as CardMakerProject).cards.forEach(card => {
      if (card.data.name) {
        const key = this.sanitizeName(card.data.name);
        this.cardIndex.set(key, {
          cardId: card.id,
          templateId: card.templateId,
          data: card.data,
          artConfig: card.artConfig,
          frameVariantId: card.frameVariantId
        });
      }
    });

    console.log(`[VisualAssetManager] Indexed ${this.cardIndex.size} cards from project.`);
  }

  private sanitizeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  }

  public getVisuals(cardName: string): VisualData | null {
    const key = this.sanitizeName(cardName);
    return this.cardIndex.get(key) || null;
  }
  
  public getTemplate(templateId: string): any {
     return (projectData as CardMakerProject).templates.find(t => t.id === templateId);
  }

  public getSchema(): any {
    return (projectData as CardMakerProject).schema;
  }
}

export const visualAssetManager = VisualAssetManager.getInstance();
