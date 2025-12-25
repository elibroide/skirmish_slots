export interface SchemaField {
  key: string;
  type: 'text' | 'number' | 'image' | 'richtext' | 'tags';
  label: string;
  example?: string;
  options?: string[]; // Enum values (comma separated in UI)
  scope?: 'both' | 'template_only' | 'card_only'; // Default 'both' if undefined
  defaultValue?: any;
}

export interface CardSchema extends Array<SchemaField> {}

export interface Zone {
  id: string;
  schemaKey: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
  // Image properties
  src?: string; // Default image URL
  variants?: { id: string; name: string; src: string }[];
  style?: React.CSSProperties & {
    fontFamily?: string;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    wordWrap?: 'normal' | 'break-word';
    textStrokeWidth?: string;
    textStrokeColor?: string;
    backgroundColor?: string;
  };
  visible?: boolean;
}

export interface AutomationCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';
  value: string | number | boolean;
}

export interface AutomationEffect {
  id: string;
  target: string; // zone schemaKey OR "FRAME"
  property: 'visible' | 'src' | 'frameVariant' | 'style';
  value: any;
  fromField?: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  conditions: AutomationCondition[];
  effects: AutomationEffect[];
}

export interface CardTemplate {
  id: string;
  name: string;
  frameUrl: string;
  frameVariants?: { id: string; name: string; url: string }[];
  width?: number; // Default 750
  height?: number; // Default 1050
  frameConfig?: {
    mode: 'simple' | '9slice';
    slice?: number; // Single value for uniform slicing for simplicity first
    borderOutset?: number; // To extend frame outside the content box if needed
  };
  zones: Zone[];
  automations?: AutomationRule[];
}

export interface CardInstance {
  id: string;
  templateId: string;
  frameVariantId?: string;
  data: Record<string, any>;
  artConfig: {
    imageUrl: string; // Base64 or URL
    x: number;
    y: number;
    scale: number;
    isMask: boolean;
    maskX: number;
    maskY: number;
    maskWidth: number;
    maskHeight: number;
  };
}

export interface ProjectState {
  schema: CardSchema;
  templates: CardTemplate[];
  cards: CardInstance[];
  activeCardId?: string | null;
  activeTemplateId?: string | null;
  activeZoneId?: string | null;
}
