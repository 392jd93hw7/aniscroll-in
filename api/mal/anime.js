const FIELDS = "alternative_titles,synopsis,mean,rank,popularity,num_episodes,average_episode_duration,media_type,status,start_date,end_date,genres";

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Method not allowed" });
  }

  const clientId = process.env.MAL_CLIENT_ID;
  if (!clientId) {
    return send(res, 503, { error: "MAL_CLIENT_ID is not configured in the Vercel project environment." });
  }

  const url = new URL(req.url || "/", "https://aniscroll.in");
  const pathMatch = url.pathname.match(/^\/api\/mal\/anime\/(\d+)\/?$/);
  const query = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 24));
  if (!pathMatch && !query) return send(res, 200, { data: [] });

  const upstreamUrl = pathMatch
    ? new URL("https://api.myanimelist.net/v2/anime/" + pathMatch[1])
    : new URL("https://api.myanimelist.net/v2/anime");
  if (!pathMatch) {
    upstreamUrl.searchParams.set("q", query);
    upstreamUrl.searchParams.set("limit", String(limit));
  }
  upstreamUrl.searchParams.set("fields", FIELDS);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { "X-MAL-CLIENT-ID": clientId, Accept: "application/json" },
      signal: controller.signal
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      const status = upstream.status === 401 || upstream.status === 403 ? 502 :
        upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502;
      return send(res, status, {
        error: upstream.status === 401 || upstream.status === 403
          ? "MyAnimeList rejected the API client ID. Check MAL_CLIENT_ID in Vercel."
          : upstream.status === 429
            ? "MyAnimeList rate limit reached. Please retry shortly."
            : "MyAnimeList API request failed.",
        upstreamStatus: upstream.status
      });
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.end(body);
  } catch (error) {
    return send(res, 502, { error: error.name === "AbortError" ? "MyAnimeList API timed out." : "Could not connect to MyAnimeList." });
  } finally {
    clearTimeout(timer);
  }
}
