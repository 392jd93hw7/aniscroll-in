# Aniscroll

**Your anime universe.** Aniscroll is a responsive anime discovery and streaming interface built with HTML, CSS, and vanilla JavaScript. It uses AniList for anime discovery and metadata, with MyAnimeList (MAL) support for fallback metadata and stream IDs where configured.

> **Important:** Aniscroll does not host anime video files. Playback is provided through third-party embeds, and availability depends on those providers. Use only streams and media you are authorized to access.

## Features

- **Discover anime:** Trending, popular, and currently airing titles.
- **Search and filter:** Find titles and narrow results by available filters such as format, status, genre, season, and year.
- **Anime details:** View artwork, synopsis, ratings, genres, episode information, and related titles when the metadata source provides them.
- **Streaming player:** Choose between the configured ZokoAnime and MegaPlay embed providers and supported audio/subtitle modes.
- **AniList-to-MAL fallback:** When the AniList stream cannot be found, the player can retry with the title's MAL ID when one is available.
- **MAL-only titles:** Use a MAL ID for supported metadata and provider routes.
- **Episode navigation:** Select episodes, move to the previous/next episode, and use the episode search for long series.
- **Schedule:** Browse upcoming episode-airing information available from AniList.
- **Watchlist and history:** Save titles and keep track of watched episodes in your browser.
- **Responsive interface:** Dark-themed layout for desktop and mobile screens.

Watchlist and history use browser `localStorage`; they are local to the current browser and do not sync between devices.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- [Vite](https://vite.dev/) for local development and production builds
- [AniList GraphQL API](https://docs.anilist.co/) for anime discovery and metadata
- [MyAnimeList API v2](https://myanimelist.net/apiconfig/references/api/v2) for configured MAL fallback requests
- Cloudflare Workers and Static Assets for deployment

## Run locally

### Requirements

- Node.js 20 or newer
- npm

### 1. Clone the repository

```bash
git clone https://github.com/piyushbalam2009/aniscroll.in-v2.git
cd aniscroll.in-v2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure MyAnimeList (optional)

AniList-powered discovery does not require a MAL API key. The MAL API fallback requires a **MyAnimeList Client ID**.

Create a MyAnimeList API application, then create a local `.env` file in the project root:

```dotenv
MAL_CLIENT_ID=your_myanimelist_client_id
```

Do not commit real credentials. The repository's `.gitignore` excludes `.env` and `.dev.vars`.

For Cloudflare Worker local development with Wrangler, you can instead copy the example file:

```bash
cp .dev.vars.example .dev.vars
```

Then replace the placeholder value with your Client ID. Keep `.dev.vars` private.

### 4. Start the development server

```bash
npm run dev
```

Open the forwarded **port 8443** in GitHub Codespaces.

## Build and preview

Create the production build:

```bash
npm run build
```

Preview the built site locally:

```bash
npm run preview
```

The generated static site is written to `dist/`.

## Deploy to Cloudflare Workers

The repository includes a Wrangler configuration for static assets and the Worker API routes.

1. Install dependencies with `npm install`.
2. Sign in to Cloudflare:

   ```bash
   npx wrangler login
   ```

3. Add the MAL Client ID as a Worker secret if you want the MAL API fallback:

   ```bash
   npx wrangler secret put MAL_CLIENT_ID
   ```

   Paste the Client ID when prompted. Do not place credentials in client-side JavaScript or commit them to Git.

4. Build and deploy:

   ```bash
   npm run deploy
   ```

5. After deployment, use the Cloudflare dashboard to configure your custom domain and follow the DNS instructions shown there.

The Worker exposes `/api/health` for a basic health response. MAL fallback routes require `MAL_CLIENT_ID` to be configured.

## Streaming provider routes

The player is configured to request third-party embed pages using these URL patterns:

**ZokoAnime**
- AniList ID: `/stream/ani/{anilist_id}/{episode}/{sub|dub|hsub}`
- MAL ID: `/stream/mal/{mal_id}/{episode}/{sub|dub|hsub}`

**MegaPlay**
- AniList ID: `/stream/ani/{anilist_id}/{episode}/{sub|dub}`
- MAL ID: `/stream/mal/{mal_id}/{episode}/{sub|dub}`

These are integration URL patterns, not a guarantee that a particular title or episode is available. Providers can change their routes, remove content, or restrict embedding. The player’s availability check is best-effort; some cross-origin provider errors cannot be detected reliably by a browser.

## Project structure

```text
.
├── index.html          # Home page
├── search.html         # Anime discovery and search
├── anime.html          # Anime details page
├── watch.html          # Streaming player page
├── schedule.html       # Airing schedule
├── watchlist.html      # Saved anime
├── history.html        # Watch history
├── 404.html            # Not-found page
├── css/
│   └── main.css        # Site styling
├── js/
│   ├── app.js          # Page rendering and player behavior
│   └── ...             # API and supporting modules
├── worker/
│   └── index.js        # Cloudflare Worker API routes
├── vite.config.js      # Vite dev server, proxy, and build configuration
├── wrangler.jsonc      # Cloudflare deployment configuration
└── package.json        # Scripts and dependencies
```

## Troubleshooting

- **MAL fallback reports that the Client ID is missing:** Confirm `MAL_CLIENT_ID` is in the local `.env` file for Vite development or configured as a Cloudflare Worker secret for deployment. Restart the dev server after changing environment variables.
- **A title does not play:** Try another episode or provider. A fallback can only work when a MAL ID exists and the provider supports that title and route.
- **Anime details or search do not load:** Check your internet connection and the status/availability of AniList or MyAnimeList.
- **Changes do not appear in Codespaces:** Save your files, check the active Git branch, and hard-refresh the browser with `Ctrl+Shift+R`.

## Credits and third-party services

- [AniList](https://anilist.co/) — anime metadata and discovery.
- [MyAnimeList](https://myanimelist.net/) — optional MAL metadata fallback.
- [ZokoAnime](https://zokoanime.video/) and [MegaPlay](https://megaplay.buzz/) — external embed providers configured by the player.

Aniscroll is an independent project and is not affiliated with or endorsed by these services. Their names, APIs, websites, artwork, and media remain subject to their respective terms and rights. API metadata is not owned by Aniscroll.

## Contributing

Issues and pull requests are welcome. Before submitting a change, run:

```bash
npm run build
```

Please do not include API credentials, private tokens, or other secrets in commits.

## License

Check the repository's `LICENSE` file for the terms that apply to this project. Third-party services, artwork, and media are not relicensed by the project license.
