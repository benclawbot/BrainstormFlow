import { BRAINSTORMFLOW_SYSTEM_PROMPT } from '../constants';
import { Message } from '../types';

const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/chat/completions';
const MINIMAX_MODEL = 'MiniMax-M3';
const EMPTY_RESPONSE_FALLBACK = "I'm sorry, I couldn't generate a response.";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface MiniMaxResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
  base_resp?: {
    status_msg?: string;
  };
}

function removeThinkingTrace(content: string): string {
  return content.replace(/<think>[\s\S]*?(?:<\/think>|$)\s*/gi, '').trim();
}

export class MiniMaxService {
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: FetchLike;

  constructor(
    apiKey = process.env.MINIMAX_API_KEY,
    fetchImpl: FetchLike = globalThis.fetch,
  ) {
    this.apiKey = apiKey;
    this.fetchImpl = fetchImpl.bind(globalThis);
  }

  async generateResponse(history: Message[]): Promise<{ text: string }> {
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is not set.');
    }

    const response = await this.fetchImpl(MINIMAX_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        thinking: { type: 'disabled' },
        messages: [
          { role: 'system', content: BRAINSTORMFLOW_SYSTEM_PROMPT },
          ...history.map(({ role, content }) => ({ role, content })),
        ],
      }),
    });

    let data: MiniMaxResponse = {};
    try {
      data = (await response.json()) as MiniMaxResponse;
    } catch {
      // Some gateways return HTML or plain text for upstream failures.
    }

    if (!response.ok) {
      const detail =
        data.error?.message ||
        data.base_resp?.status_msg ||
        response.statusText ||
        'Unknown error';
      throw new Error(`MiniMax request failed (${response.status}): ${detail}`);
    }

    return {
      text:
        removeThinkingTrace(data.choices?.[0]?.message?.content || '') ||
        EMPTY_RESPONSE_FALLBACK,
    };
  }
}

export const minimaxService = new MiniMaxService();
