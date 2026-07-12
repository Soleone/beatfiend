# Beat Fiend Companion

The companion is a headless local audio service for the hosted Beat Fiend web app. It binds only to `127.0.0.1`, extracts or imports audio locally, stores normalized playback files, and serves signed range requests. Beatmaps and song packages remain browser-owned.

## Development startup

Requirements:

- Node.js 24 or newer
- `yt-dlp`, `ffmpeg`, and `ffprobe` on `PATH`

```bash
npm install
npm run dev:companion
```

The companion opens `http://localhost:5173` with a one-time pairing credential in the URL fragment. Beat Fiend consumes and removes that fragment. Start the full legacy-compatible development stack with `npm run dev:all`.

## Configuration

- `BEAT_FIEND_WEB_URL`: web app URL opened for pairing, default `http://localhost:5173/`
- `BEAT_FIEND_ALLOWED_ORIGINS`: comma-separated exact browser origins
- `BEAT_FIEND_COMPANION_PORT`: loopback port, default `47831`
- `BEAT_FIEND_COMPANION_DATA_DIR`: private cache and secret directory
- `BEAT_FIEND_YT_DLP`, `BEAT_FIEND_FFMPEG`, `BEAT_FIEND_FFPROBE`: trusted command paths

Production must set the exact hosted HTTPS origin. Do not use wildcard origins or bind the server to a public interface.

## Maintenance

```bash
npm run dev:companion -- --clear-cache
npm run dev:companion -- --rotate-secret
```

Rotating the secret invalidates paired browsers. Restart normally to pair again. Clearing the cache removes companion audio but does not remove browser-owned beatmaps.

## Tool provisioning

`companion/tools.js` contains the checksum-verified provisioning mechanism. Its production manifest is intentionally empty until Linux and Windows binary URLs and SHA-256 checksums are reviewed. Development uses commands on `PATH` or explicit command-path overrides. A production distribution must populate the reviewed manifest before enabling automatic first-run downloads.

## Security boundary

The API accepts only supported YouTube hosts, invokes tools with argument arrays and no shell, requires the pairing credential for non-status APIs, checks `Host` and `Origin`, limits uploads and concurrent imports, returns opaque IDs, and uses expiring signed playback URLs. It never exposes local filesystem paths.
