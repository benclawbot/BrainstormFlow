import { describe, expect, it, vi } from 'vitest';
import { BRAINSTORMFLOW_SYSTEM_PROMPT } from '../constants';
import { Message } from '../types';
import { MiniMaxService } from './minimaxService';

const history: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'First idea',
    timestamp: 1,
  },
  {
    id: '2',
    role: 'assistant',
    content: 'First response',
    timestamp: 2,
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('MiniMaxService', () => {
  it('sends the system prompt and conversation history to MiniMax M3', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { role: 'assistant', content: 'Fresh sparks' } }],
      }),
    );
    const service = new MiniMaxService('test-key', fetchMock);

    const result = await service.generateResponse(history);

    expect(result).toEqual({ text: 'Fresh sparks' });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.minimax.io/v1/chat/completions');
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-key',
        'Content-Type': 'application/json',
      },
    });
    expect(JSON.parse(String(init.body))).toEqual({
      model: 'MiniMax-M3',
      thinking: { type: 'disabled' },
      messages: [
        { role: 'system', content: BRAINSTORMFLOW_SYSTEM_PROMPT },
        { role: 'user', content: 'First idea' },
        { role: 'assistant', content: 'First response' },
      ],
    });
  });

  it('rejects requests when MINIMAX_API_KEY is missing', async () => {
    const fetchMock = vi.fn();
    const service = new MiniMaxService('', fetchMock);

    await expect(service.generateResponse(history)).rejects.toThrow(
      'MINIMAX_API_KEY environment variable is not set.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes the HTTP status and provider message when MiniMax rejects a request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { message: 'Invalid API key' } }, 401),
    );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.generateResponse(history)).rejects.toThrow(
      'MiniMax request failed (401): Invalid API key',
    );
  });

  it('preserves the HTTP status when an error response is not JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/html' },
      }),
    );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.generateResponse(history)).rejects.toThrow(
      'MiniMax request failed (502): Bad Gateway',
    );
  });

  it('returns a friendly fallback when MiniMax returns no text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { role: 'assistant', content: '' } }] }),
    );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.generateResponse(history)).resolves.toEqual({
      text: "I'm sorry, I couldn't generate a response.",
    });
  });

  it('removes MiniMax thinking traces from the rendered response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{
          message: {
            role: 'assistant',
            content: '<think>Internal reasoning that users should not see.</think>\nVisible answer',
          },
        }],
      }),
    );
    const service = new MiniMaxService('test-key', fetchMock);

    await expect(service.generateResponse(history)).resolves.toEqual({
      text: 'Visible answer',
    });
  });

  it('calls browser fetch with the global object as its receiver', async () => {
    const browserLikeFetch = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }

      return Promise.resolve(
        jsonResponse({
          choices: [{ message: { role: 'assistant', content: 'Browser-safe' } }],
        }),
      );
    });
    const service = new MiniMaxService('test-key', browserLikeFetch);

    await expect(service.generateResponse(history)).resolves.toEqual({
      text: 'Browser-safe',
    });
  });
});
