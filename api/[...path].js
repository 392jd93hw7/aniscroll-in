const validGenres = new Set(["action","adventure","cars","comedy","dementia","demons","drama","ecchi","fantasy","game","harem","historical","horror","josei","kids","magic","martial arts","mecha","military","music","mystery","parody","police","psychological","romance","samurai","school","sci-fi","seinen","shoujo","shoujo ai","shounen","shounen ai","slice of life","space","sports","super power","supernatural","thriller","vampire","yaoi","yuri"]);
const noStore = { "Cache-Control": "no-store" };
const fields = "alternative_titles,synopsis,mean,rank,popularity,num_episodes,average_episode_duration,media_type,status,start_date,end_date,genres";

function send(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}
function malKey(res) {
  if (!process.env.MAL_CLIENT_ID) {
    send(res, 503, { error: "MAL_CLIENT_ID is not configured. Add it in Vercel Project Settings → Environment Variables." }, noStore);
    return false;
  }
  return true;
}
async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Method not allowed" }, noStore);
  }
  const url = new URL(req.url || "/", "https://aniscroll.vercel.app");
  const path = url.pathname;

  if (path === "/api/health") {
    return send(res, 200, { ok: true, app: "Aniscroll", timestamp: new Date().toISOString() }, noStore);
  }

  if (path === "/api/provider-availability") {
    const id = Number(url.searchParams.get("id"));
    const mal = Number(url.searchParams.get("mal"));
    const ep = Number(url.searchParams.get("ep")) || 1;
    const mode = url.searchParams.get("mode") === "dub" ? "dub" : "sub";
    if ((!Number.isSafeInteger(id) || id < 1) && (!Number.isSafeInteger(mal) || mal < 1)) {
      return send(res, 400, { error: "Invalid anime ID" }, noStore);
    }
    if (!Number.isSafeInteger(ep) || ep < 1) return send(res, 400, { error: "Invalid episode" }, noStore);
    const streamId = mal > 0 ? "mal/" + mal : "ani/" + id;
    const candidates = [
      { provider: "zokoanime", url: `https://zokoanime.video/stream/${streamId}/${ep}/${mode}?color=a78bfa` },
      { provider: "megaplay", url: `https://megaplay.buzz/stream/${streamId}/${ep}/${mode}` }
    ];
    const providers = await Promise.all(candidates.map(async candidate => {
      try {
        const response = await fetchJson(candidate.url, {}, 8000);
        const body = (await response.text()).slice(0, 12000).toLowerCase();
        const isError = /not found|404|couldn.t find anything to play|nothing to play|no stream|stream unavailable|episode unavailable|oops! something went wrong|something went wrong|page you.re looking for doesn.t exist|doesn.t exist or has|page not found|tv tokyo/.test(body);
        return { provider: candidate.provider, available: response.ok && !isError };
      } catch {
        return { provider: candidate.provider, available: false };
      }
    }));
    return send(res, 200, { providers }, noStore);
  }

  if (path === "/api/mal/genre") {
    if (!malKey(res)) return;
    const genre = (url.searchParams.get("genre") || "").trim().toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    if (!validGenres.has(genre)) return send(res, 400, { error: "Unsupported MyAnimeList genre." }, noStore);
    const offsets = [(page - 1) * 100, (page - 1) * 100 + 100, (page - 1) * 100 + 200];
    try {
      const responses = await Promise.all(offsets.map(async offset => {
        const params = new URLSearchParams({ ranking_type: "all", limit: "100", offset: String(offset), fields: "alternative_titles,synopsis,mean,popularity,num_episodes,media_type,status,start_date,genres" });
        const response = await fetchJson("https://api.myanimelist.net/v2/anime/ranking?" + params, {
          headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID, Accept: "application/json" }
        }, 12000);
        if (!response.ok) throw new Error("MAL ranking request failed");
        return response.json();
      }));
      const seen = new Set(), matches = [];
      for (const json of responses) for (const item of json.data || []) {
        const node = item.node || item, id = Number(node.id);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        if ((node.genres || []).some(g => String(g.name || "").toLowerCase() === genre)) matches.push(node);
      }
      return send(res, 200, { data: matches.slice(0, 24).map(node => ({ node })), paging: { has_more: responses.some(x => (x.data || []).length === 100) } }, { "Cache-Control": "public, max-age=300" });
    } catch (error) {
      return send(res, 502, { error: error.name === "AbortError" ? "MyAnimeList genre search timed out" : "MyAnimeList genre search failed" }, noStore);
    }
  }

  if (path === "/api/mal/anime") {
    if (!malKey(res)) return;
    const query = (url.searchParams.get("q") || "").trim();
    if (!query) return send(res, 200, { data: [] });
    const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit")) || 24));
    const params = new URLSearchParams({ q: query, limit: String(limit), fields });
    try {
      const upstream = await fetchJson("https://api.myanimelist.net/v2/anime?" + params, {
        headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID, Accept: "application/json" }
      });
      if (!upstream.ok) return send(res, upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502, { error: "MyAnimeList API request failed", status: upstream.status }, noStore);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.end(await upstream.text());
    } catch (error) {
      return send(res, 502, { error: error.name === "AbortError" ? "MyAnimeList API timed out" : "Could not connect to MyAnimeList API" }, noStore);
    }
  }

  const malMatch = path.match(/^\/api\/mal\/anime\/(\d+)$/);
  if (malMatch) {
    if (!malKey(res)) return;
    const malId = Number(malMatch[1]);
    if (!Number.isSafeInteger(malId) || malId < 1) return send(res, 400, { error: "Invalid MAL ID" }, noStore);
    const params = new URLSearchParams({ fields });
    try {
      const upstream = await fetchJson(`https://api.myanimelist.net/v2/anime/${malId}?` + params, {
        headers: { "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID, Accept: "application/json" }
      });
      if (!upstream.ok) return send(res, upstream.status === 404 ? 404 : upstream.status === 429 ? 429 : 502, { error: "MyAnimeList API request failed", status: upstream.status }, noStore);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.end(await upstream.text());
    } catch (error) {
      return send(res, 502, { error: error.name === "AbortError" ? "MyAnimeList API timed out" : "Could not connect to MyAnimeList API" }, noStore);
    }
  }

  return send(res, 404, { error: "API route not found" }, noStore);
}
