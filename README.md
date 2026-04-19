# BrainstormFlow

BrainstormFlow is a Gemini-powered ideation workspace for exploring rough ideas, creative directions, and unusual prompts in a persistent chat-style interface.

Instead of a blank note-taking canvas, it gives you a conversation loop: start a brainstorm, keep the session history, trigger quick creative modes, and follow grounded links when Gemini uses web search.

## What it does

- Keeps multiple brainstorm sessions in local storage
- Turns free-form prompts into exploratory conversations
- Includes shortcut modes such as pattern hunt, wild mode, future scan, and mood board prompts
- Renders responses in Markdown
- Shows grounding links when Gemini uses Google Search
- Works as a responsive single-page app with sidebar session history

## Use Cases

- Explore product concepts before writing specs
- Break creative blocks with structured prompt shortcuts
- Stress-test an idea from several angles
- Generate rough directions for design, writing, strategy, or naming

## Quick Start

Prerequisites:
- Node.js
- A Gemini API key exposed as `API_KEY`

Run locally:

```bash
npm install
API_KEY=your_key npm run dev
```

Then open the local Vite URL shown in the terminal.

## How It Works

The app stores sessions in `localStorage`, sends the full session history to Gemini, and uses a system prompt tuned for brainstorming. Responses can include grounding links from Google Search, which are surfaced in the UI alongside the generated text.

## Project Structure

- `App.tsx` — main UI, session management, quick commands
- `services/geminiService.ts` — Gemini API integration
- `components/` — Markdown rendering and UI pieces
- `constants` / `types` — prompt config and shared models

## Status

Experimental prototype. Intended for solo use and fast idea exploration rather than team collaboration or production workflows.
