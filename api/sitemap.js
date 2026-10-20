const SITE = "https://aniscroll.in";
const API = "https://graphql.anilist.co";
const QUERY = `query { Page(page: 1, perPage: 50) { media(type: ANIME, isAdult: false, sort: POPULARITY_DESC) { id title { english romaji native } updatedAt } } }`;
function slug(value) {
  return String(value || "anime").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "anime";
}
export default async function handler(req, res) {
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: QUERY }),
    });
    if (!response.ok) throw new Error("AniList sitemap request failed");
    const json = await response.json();
    if (json.errors?.length) throw new Error("AniList sitemap query failed");
    const media = json.data?.Page?.media || [];
    const urls = [
      { loc: SITE + "/", priority: "1.0" },
      { loc: SITE + "/search.html", priority: "0.8" },
      { loc: SITE + "/schedule.html", priority: "0.7" },
      ...media.map((anime) => ({
        loc: SITE + "/anime/" + Number(anime.id) + "/" + slug(anime.title?.english || anime.title?.romaji || anime.title?.native),
        lastmod: anime.updatedAt ? new Date(Number(anime.updatedAt) * 1000).toISOString().slice(0, 10) : "",
        priority: "0.7",
      })),
    ];
    const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls.map((item) => '<url><loc>' + item.loc.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</loc>' +
        (item.lastmod ? '<lastmod>' + item.lastmod + '</lastmod>' : '') +
        '<changefreq>weekly</changefreq><priority>' + item.priority + '</priority></url>').join("") +
      '</urlset>';
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://aniscroll.in/</loc></url><url><loc>https://aniscroll.in/search.html</loc></url><url><loc>https://aniscroll.in/schedule.html</loc></url></urlset>');
  }
}
