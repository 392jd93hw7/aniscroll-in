# Aniscroll v2

Vanilla HTML, CSS and JavaScript anime discovery site using AniList GraphQL, with configured ZokoAnime and MegaPlay embed links.

## Run in GitHub Codespaces

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open forwarded port **8443**.

## Validate the project

```bash
npm run build
npm run preview
```

A GitHub Actions workflow also runs the production build for pushes and pull requests.

## Deploy to Cloudflare Workers Static Assets

```bash
npx wrangler login
npm run deploy
```

The Wrangler config serves `dist/` as static assets and runs the Worker for `/api/*`. After deployment, connect `aniscroll.in` in the Cloudflare dashboard and follow the shown DNS instructions.

## Streaming routes configured

ZokoAnime base: `https://zokoanime.video`

- Subtitles: `/stream/ani/{anilist_id}/{episode}/sub`
- Dubbed: `/stream/ani/{anilist_id}/{episode}/dub`
- Hard-subbed: `/stream/ani/{anilist_id}/{episode}/hsub`

MegaPlay base: `https://megaplay.buzz`

- Subtitles: `/stream/ani/{anilist_id}/{episode}/sub`
- Dubbed: `/stream/ani/{anilist_id}/{episode}/dub`

These are external embed route patterns, not guarantees of title availability or permission to embed. Use only content you are authorized to access and embed. AniList supplies metadata, not video files.

## Current scope

- AniList trending/popular/current-season shelves
- Search, format/status/genre filters, pagination
- Anime details, related titles and recommendations
- ZokoAnime/MegaPlay provider and mode selector
- Local browser watchlist with statuses and watch history
- Genre discovery and airing schedule view
- Responsive dark UI
- Cloudflare Worker health endpoint at `/api/health`

Watchlist and history are stored in browser local storage and do not sync across devices.


## Official MyAnimeList API v2 fallback\n\nAniList remains the primary source. If a title search has no AniList matches, Aniscroll falls back to the official MyAnimeList API v2 search endpoint. MAL-only results and detail pages are requested through the server-side `/api/mal/anime` routes, which send the `X-MAL-CLIENT-ID` header without exposing the credential in browser JavaScript. The public metadata/search endpoints require a Client ID; OAuth and a Client Secret are not needed unless you add private user-list features.\n\nFor local development, copy `.dev.vars.example` to `.dev.vars` and set `MAL_CLIENT_ID` from your MyAnimeList API application. For Cloudflare Workers, run `npx wrangler secret put MAL_CLIENT_ID` and enter the Client ID when prompted. Do not commit `.dev.vars` or real credentials. Restart `npm run dev` after changing local variables.\n\nMAL-only watch links use the provider route pattern `/stream/mal/{mal_id}/{episode}/{sub|dub}`. This URL pattern depends on the streaming provider supporting MAL IDs; metadata availability does not guarantee stream availability.\n