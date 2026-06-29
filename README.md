# Flow Fight

Flow Fight is a local-first rhythm/parry prototype. Projectiles travel down five colored lanes and should hit their pads on musical events. The current focus is fast iteration on game feel: timing windows, pad/cannon feedback, imported songs, generated/manual beatmaps, and rhythm-game scoring feedback.

## Current controls

- `Space` — kick lane
- `W` — snare lane
- `Left Arrow` — low melody lane
- `Up Arrow` — mid melody lane
- `Right Arrow` — high melody lane

## Quickstart

Install dependencies:

```bash
npm install
```

Run the full local tool, including the React app and local import/save server:

```bash
npm run dev:all
```

Open the Vite URL, usually:

```txt
http://localhost:5173
```

## Local YouTube import

YouTube import is local/dev-only. It shells out to:

- `yt-dlp`
- `ffmpeg`
- `ffprobe`

Install them first, for example:

```bash
sudo apt install ffmpeg yt-dlp
```

Then use the **Import** tab to paste a YouTube URL. Imported songs are cached under:

```txt
public/imports/<songId>/
  audio.mp3
  source.webm
  meta.json
  beatmap.json
  beatmaps/
```

Re-importing the same URL reuses the cached song instead of downloading it again.

## App tabs

- **Play** — player controls, stats, and minimal options.
- **Edit** — shared player, beatmap selector/saver, jam recorder, timeline.
- **Import** — YouTube import.
- **Debug** — raw timing/debug controls.

## Build

```bash
npm run build
```

The current bundle is large because React Three Fiber / Drei / Three.js are bundled together. That is acceptable for this prototype.
