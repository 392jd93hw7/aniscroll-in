# Aniscroll

**Your anime universe.** Aniscroll is a responsive anime discovery and streaming interface built with HTML, CSS, and vanilla JavaScript. It uses AniList for anime discovery and metadata, with MyAnimeList (MAL) support for fallback metadata and stream IDs where configured.

> **Important:** Aniscroll does not host anime video files. Playback is provided through third-party embeds, and availability depends on those providers. Use only streams and media you are authorized to access.

## Features

- **Discover anime:** Trending, popular, and currently airing titles.
- **Search and filter:** Find titles and narrow results by format, status, genre, season, and year.
- **Anime details:** View artwork, synopsis, ratings, genres, episode information, and related titles.
- **Streaming player:** Choose between configured ZokoAnime and MegaPlay embeds.
- **AniList-to-MAL fallback:** Retry supported streams using a title's MAL ID.
- **MAL-only titles:** Use a MAL ID for supported metadata and provider routes.
- **Episode navigation:** Select episodes, move between episodes, and search long episode lists.
- **Schedule:** Browse episode-airing information available from AniList.
- **Watchlist and history:** Save titles and track watched episodes in your browser.
- **Responsive interface:** Dark-themed layout for desktop and mobile.

Watchlist and history use browser `localStorage`; they are local to the current browser and do not sync between devices.

## Tech stack

- HTML5, CSS3, and vanilla JavaScript ES modules
- [Vite](https://vite.dev/) for development and builds
- [AniList GraphQL API](https://docs.anilist.co/) for discovery and metadata
- [MyAnimeList API v2](https://myanimelist.net/apiconfig/references/api/v2) for optional fallback requests
- [Vercel](https://vercel.com/docs) for static hosting and serverless API routes

## Run locally in GitHub Codespaces

Requirements: Node.js 20+ and npm.

```bash
git clone https://github.com/piyushbalam2009/aniscroll-in.git
cd aniscroll-in
npm install
npm run dev
```

Open the forwarded port **8443** in Codespaces.

### Optional MyAnimeList fallback

AniList discovery does not require a MAL API key. MAL fallback routes require a **MyAnimeList Client ID**.

Create a MyAnimeList API application and add the following to a local `.env` file in the project root:

```dotenv
MAL_CLIENT_ID=your_myanimelist_client_id
```

Keep credentials private and never commit `.env`. Restart the development server after changing environment variables.

## Build and preview

```bash
npm run build
npm run preview
```

Vite writes the production site to `dist/`.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and select **Add New → Project**.
3. Import `piyushbalam2009/aniscroll-in`.
4. Keep the detected project settings from `vercel.json`: build command `npm run build` and output directory `dist`.
5. If you use MAL fallback, open **Project Settings → Environment Variables**, add `MAL_CLIENT_ID`, and enable it for Production (and Preview/Development if needed). Do not add the key to frontend JavaScript or commit it.
6. Deploy. Vercel automatically builds new deployments when you push commits to GitHub.
7. To use `aniscroll.in`, open **Project → Settings → Domains**, add `aniscroll.in` and optionally `www.aniscroll.in`, then follow the DNS records Vercel shows. Do not guess DNS values; use the values displayed in your Vercel project.

### API health check

After deployment, open `https://your-domain/api/health`. A working API responds with JSON containing `ok: true`.

The serverless API routes are implemented in `api/[...path].js` and include provider availability checks plus optional MAL search, genre, and title-detail endpoints.

## Streaming provider routes

The player uses these third-party embed URL patterns:

**ZokoAnime**
- AniList ID: `/stream/ani/{anilist_id}/{episode}/{sub|dub|hsub}`
- MAL ID: `/stream/mal/{mal_id}/{episode}/{sub|dub|hsub}`

**MegaPlay**
- AniList ID: `/stream/ani/{anilist_id}/{episode}/{sub|dub}`
- MAL ID: `/stream/mal/{mal_id}/{episode}/{sub|dub}`

These are integration URL patterns, not a guarantee that a title or episode is available. Providers can change routes, remove content, or restrict embedding. Browser-based availability checks are best-effort.

## Project structure

```text
.
├── api/
│   └── [...path].js      # Vercel serverless API routes
├── index.html            # Home page
├── search.html           # Anime discovery and search
├── anime.html             # Anime details
├── watch.html             # Streaming player
├── schedule.html          # Airing schedule
├── watchlist.html         # Saved anime
├── history.html           # Watch history
├── 404.html               # Not-found page
├── css/main.css           # Site styling
├── js/                    # UI and API modules
├── vite.config.js         # Vite dev server and build configuration
├── vercel.json            # Vercel build and function configuration
└── package.json           # Scripts and dependencies
```

## Troubleshooting

- **MAL fallback says Client ID is missing:** Set `MAL_CLIENT_ID` in Vercel Project Settings → Environment Variables, then redeploy. For local development, put it in `.env` and restart Vite.
- **An episode does not play:** Try another episode or provider. A fallback only works when a MAL ID exists and the provider supports that route.
- **Anime metadata does not load:** Check your internet connection and the status/availability of AniList or MyAnimeList.
- **Changes do not appear in Codespaces:** Save files and hard-refresh with `Ctrl+Shift+R`.

## Credits and third-party services

- [AniList](https://anilist.co/) — anime metadata and discovery.
- [MyAnimeList](https://myanimelist.net/) — optional metadata fallback.
- [ZokoAnime](https://zokoanime.video/) and [MegaPlay](https://megaplay.buzz/) — external embed providers.

Aniscroll is an independent project and is not affiliated with or endorsed by these services. Their names, APIs, artwork, and media remain subject to their respective terms and rights.

## Contributing

Before submitting changes, run:

```bash
npm run build
```

Never commit API credentials, private tokens, or other secrets.

## License

See the `LICENSE` file for the project license. Third-party services, artwork, and media are not relicensed by the project license.
