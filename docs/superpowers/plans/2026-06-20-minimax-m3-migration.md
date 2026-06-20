# MiniMax M3 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace BrainstormFlow's Gemini provider with a tested MiniMax M3 integration and make the updated app runnable locally with the user's existing MiniMax key.

**Architecture:** Keep the current client-only React/Vite architecture. Replace the Gemini SDK service with a dependency-injectable `fetch` service calling MiniMax's OpenAI-compatible Chat Completions endpoint, while preserving the existing system prompt and full-session message flow.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest, MiniMax OpenAI-compatible Chat Completions API.

## Global Constraints

- Use the exact model ID `MiniMax-M3`.
- Use `https://api.minimax.io/v1/chat/completions`.
- Read the credential from `MINIMAX_API_KEY`.
- Never commit, print, or copy the user's secret into tracked files.
- Preserve the current brainstorming system prompt and chat/session behavior.
- Remove Gemini-only Google Search grounding behavior instead of simulating equivalent links.
- Document that client-side key injection is intended for trusted local testing only.

---

### Task 1: Establish the Service Contract with Failing Tests

**Files:**
- Create: `services/minimaxService.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `Message[]` and `BRAINSTORMFLOW_SYSTEM_PROMPT`
- Produces: required behavior for `MiniMaxService.generateResponse(history): Promise<{ text: string }>`

- [ ] **Step 1: Install Vitest and add the test script**

Run:

```text
npm install
npm install --save-dev vitest
```

Add `"test": "vitest run"` to `package.json`.

- [ ] **Step 2: Write failing service tests**

Create tests that instantiate `MiniMaxService` with a fake key and mocked `fetch`. Assert that it sends:

```json
{
  "model": "MiniMax-M3",
  "thinking": { "type": "adaptive" },
  "messages": [
    { "role": "system", "content": "<BrainstormFlow system prompt>" },
    { "role": "user", "content": "First idea" },
    { "role": "assistant", "content": "First response" }
  ]
}
```

Also assert:

- `Authorization: Bearer test-key`
- `Content-Type: application/json`
- assistant text is read from `choices[0].message.content`
- a missing key throws a `MINIMAX_API_KEY` error
- non-2xx responses include their status and provider message
- empty content returns `I'm sorry, I couldn't generate a response.`

- [ ] **Step 3: Run the test and verify RED**

Run:

```text
npm test
```

Expected: failure because `services/minimaxService.ts` does not exist.

### Task 2: Implement MiniMax M3 and Remove Gemini Coupling

**Files:**
- Create: `services/minimaxService.ts`
- Delete: `services/geminiService.ts`
- Modify: `App.tsx`
- Modify: `types.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `new MiniMaxService(apiKey?, fetchImpl?)`
- Produces: `generateResponse(history: Message[]): Promise<{ text: string }>`

- [ ] **Step 1: Implement the minimal MiniMax service**

The service must call the documented endpoint with the contract defined in Task 1. It must parse the first assistant text, provide the fallback for empty content, and throw useful errors for missing credentials or failed HTTP responses.

- [ ] **Step 2: Replace the application integration**

Import `minimaxService`, call `minimaxService.generateResponse`, and create assistant messages from the returned `text`. Remove `groundingLinks` from message types and remove the Gemini-specific link rendering block.

- [ ] **Step 3: Remove the Gemini package**

Run:

```text
npm uninstall @google/genai
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```text
npm test
```

Expected: all MiniMax service tests pass.

### Task 3: Update Configuration and Documentation

**Files:**
- Modify: `vite.config.ts`
- Modify: `metadata.json`
- Modify: `README.md`
- Verify: `.gitignore`

**Interfaces:**
- Consumes: local `MINIMAX_API_KEY`
- Produces: browser-visible `process.env.MINIMAX_API_KEY`

- [ ] **Step 1: Update Vite configuration**

Define only:

```ts
'process.env.MINIMAX_API_KEY': JSON.stringify(
  env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY
)
```

- [ ] **Step 2: Update product metadata and README**

Replace Gemini branding and setup instructions with MiniMax M3. Remove Google Search grounding claims. Add PowerShell and POSIX local-run examples using `MINIMAX_API_KEY`, and include a warning that a browser-only app exposes injected keys.

- [ ] **Step 3: Confirm local environment files are ignored**

Run:

```text
git check-ignore .env .env.local
```

Expected: both paths are ignored.

### Task 4: Verify Locally and Publish

**Files:**
- No additional tracked files expected

**Interfaces:**
- Consumes: `MINIMAX_API_KEY` from `C:\Users\thoma\.hermes\.env`
- Produces: verified local app and published GitHub branch/PR

- [ ] **Step 1: Run automated verification**

Run:

```text
npm test
npm run build
```

Expected: zero failed tests and successful Vite production build.

- [ ] **Step 2: Run a live API smoke test**

Read `MINIMAX_API_KEY` from the existing Hermes environment file inside the test process, make one short request to `MiniMax-M3`, and print only the HTTP result and a short response confirmation. Never print the credential.

- [ ] **Step 3: Launch and verify the local app**

Start Vite with the key injected into the process environment, open the app, send one short brainstorm prompt, and confirm a MiniMax response renders with no browser console or network errors.

- [ ] **Step 4: Review and publish**

Inspect the full diff, run the final checks, commit the scoped files, push `codex/minimax-m3`, and open a draft pull request into `main`.
