
export type ItemType = 'character' | 'bubble' | 'sticker';
export type AspectRatio = '9:16' | '16:9' | '1:1';
export type SceneFilter = 'none' | 'dreamy' | 'vintage' | 'night' | 'warm';

export interface BubbleData {
  text: string;
  name: string;
  color: string;
  isThought: boolean;
  tailPosition: 'left' | 'center' | 'right';
}

export interface SceneItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
  visible?: boolean;
  locked?: boolean;
  
  // Character/Sticker/Bubble Image Source
  src?: string; 
  
  // Character specific
  flipX?: boolean; 
  
  // Bubble specific (Data for re-editing)
  bubbleData?: BubbleData;

  // Sticker specific
  emoji?: string; 
}

export interface BackgroundImage {
  url: string;
  source: string;
}

export interface StoredScene {
  id: string;
  thumbnail: string; 
  timestamp: number;
}