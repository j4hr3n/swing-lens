# Swing Lens

Swing Lens is a local-only golf swing analyzer. It records or imports video on device, stores clips in browser Origin Private File System storage, and lets users inspect swings frame by frame with line annotations.

## Core Flows

- Library: view locally stored recordings grouped by capture/import date.
- Import: pick video from the camera roll and navigate to the analyzer as soon as metadata is available.
- Capture: record directly from the browser when `MediaRecorder` and camera access are available.
- Analyze: scrub, step one frame at a time, control playback speed, and add/edit line annotations.
- Settings: inspect local storage usage and clear all local data.

## Browser And Storage Notes

Swing Lens uses IndexedDB for recording metadata and annotations, and OPFS for video and thumbnail blobs. Nothing is uploaded to a server.

The app requires a browser with `navigator.storage.getDirectory()` support for durable local video storage. Current Safari, Chrome, and Edge versions are the main targets. iOS Safari has camera and video quirks:

- `getUserMedia` does not expose iPhone high-speed Slo-Mo modes, so the in-app camera usually records around standard device/browser limits.
- For 120/240 fps iPhone clips, record in the system Camera app using Slo-Mo, then import the clip.
- Some iOS videos report infinite duration at metadata load; the app probes duration with a Safari-compatible seek workaround.

## Local Development

Install dependencies:

```sh
pnpm install
```

Start the Vite dev server:

```sh
pnpm dev
```

Build production assets:

```sh
pnpm build
```

## Validation

Run the full local validation suite before shipping changes:

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Available scripts:

- `pnpm lint`: ESLint with type-aware TypeScript rules.
- `pnpm typecheck`: TypeScript project build check.
- `pnpm test`: Vitest unit/component tests.
- `pnpm test:watch`: Vitest watch mode.
- `pnpm build`: TypeScript check plus Vite/PWA production build.

## Architecture

- `src/components`: routed screens and shared UI primitives.
- `src/hooks`: React hooks for recordings, video state, frame stepping, object URLs, and thumbnail URL loading.
- `src/lib`: persistence, OPFS access, video metadata probing, MP4 FPS parsing, URL caching, and small utilities.
- `src/store`: app-wide UI state currently limited to annotation color.
- `src/types`: shared recording and annotation types.
- `src/test`: test setup and browser API stubs.

The recording service in `src/lib/recordings.ts` owns IndexedDB mutations. UI components should use those service functions instead of writing to Dexie directly.

Object URLs are retained through `src/lib/objectUrlCache.ts` so repeated thumbnail/video consumers share OPFS reads and revoke URLs when the last consumer releases them.
