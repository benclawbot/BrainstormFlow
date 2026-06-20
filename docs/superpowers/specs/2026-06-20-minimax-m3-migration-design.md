# MiniMax M3 Migration Design

## Goal

Replace BrainstormFlow's Gemini integration with MiniMax M3 while preserving the existing chat experience, session history, system prompt, Markdown rendering, and user-facing error recovery.

## Architecture

The application remains a client-only React and Vite app. A focused `MiniMaxService` will call MiniMax's OpenAI-compatible Chat Completions endpoint at `https://api.minimax.io/v1/chat/completions` with model `MiniMax-M3`.

The request will send the existing BrainstormFlow system prompt as a `system` message followed by the complete session history as `user` and `assistant` messages. The service will return the first assistant message's text content.

Thinking is disabled for this conversational UI, and any unexpected `<think>` trace is stripped defensively before rendering.

The Vite configuration will expose `MINIMAX_API_KEY` to the browser bundle for local use. This matches the current Gemini architecture, but the README must clearly state that this is suitable only for trusted local testing because browser-delivered API keys are visible to users.

## Scope

The migration will:

- Replace `@google/genai` with a direct `fetch` integration.
- Rename the provider service and all imports from Gemini to MiniMax.
- Use `MINIMAX_API_KEY` and model `MiniMax-M3`.
- Remove Gemini-specific Google Search grounding metadata and links.
- Add deterministic tests for request construction, response parsing, missing credentials, HTTP failures, and empty responses.
- Update metadata and README setup instructions.
- Verify the production build and a live local request using the existing key from `C:\Users\thoma\.hermes\.env` without copying it into tracked files.

## Error Handling

Missing credentials will fail with a clear `MINIMAX_API_KEY` message. Non-success HTTP responses will include the HTTP status and the best available MiniMax error message. Successful responses with no text content will return the existing friendly fallback sentence.

## Testing

Vitest will mock `fetch` at the service boundary. Tests will verify the endpoint, authorization header, model ID, system prompt placement, conversation role mapping, adaptive thinking setting, response parsing, and failure behavior.

The final verification sequence is:

```text
npm test
npm run build
live MiniMax API smoke test
local browser smoke test
```

## Source

MiniMax documents `MiniMax-M3` and the OpenAI-compatible `POST /v1/chat/completions` endpoint at:

https://platform.minimax.io/docs/api-reference/text-chat-openai
