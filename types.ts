
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  groundingLinks?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
