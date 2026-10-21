import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";
import { verifyToken } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";

async function checkProvider(url) {
  try {
    const response = await fetch(url);
    const body = (await response.text()).slice(0, 12000).toLowerCase();
    return response.ok && !/not found|404|couldn.t find anything to play|nothing to play|no stream|stream unavailable|episode unavailable|oops! something went wrong|something went wrong|page not found/i.test(body);
  } catch { return false; }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    appType: "mpa",
    plugins: [{
      name: "aniscroll-provider-availability",
      configureServer(server) {
        // Match clean anime detail routes in the Codespaces Vite server.
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url || "/", "http://localhost");
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts[0] === "anime" && parts.length >= 2 && /^\d+$/.test(parts[1])) {
            req.url = "/anime.html?id=" + encodeURIComponent(parts[1]);
          }
          next();
        });
        server.middlewares.use("/api/mal/genre", async (req, res) => {
          try {
            const url = new URL(req.url, "http://localhost");
            const genre = (url.searchParams.get("genre") || "").trim().toLowerCase();
            const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
            const validGenres = new Set(["action","adventure","cars","comedy","dementia","demons","drama","ecchi","fantasy","game","harem","historical","horror","josei","kids","magic","martial arts","mecha","military","music","mystery","parody","police","psychological","romance","samurai","school","sci-fi","seinen","shoujo","shoujo ai","shounen","shounen ai","slice of life","space","sports","super power","supernatural","thriller","vampire","yaoi","yuri"]);
            if (!validGenres.has(genre)) { res.statusCode=400;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:"Unsupported MyAnimeList genre."}));return; }
            if (!env.MAL_CLIENT_ID) { res.statusCode=503;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:"MAL_CLIENT_ID is not configured. Put it in .env for npm run dev."}));return; }
            const offsets=[(page-1)*100,(page-1)*100+100,(page-1)*100+200];
            const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
            try {
              const responses=await Promise.all(offsets.map(async offset=>{
                const params=new URLSearchParams({ranking_type:"all",limit:"100",offset:String(offset),fields:"alternative_titles,synopsis,mean,popularity,num_episodes,media_type,status,start_date,genres"});
                const response=await fetch("https://api.myanimelist.net/v2/anime/ranking?"+params.toString(),{headers:{"X-MAL-CLIENT-ID":env.MAL_CLIENT_ID,"Accept":"application/json"},signal:controller.signal});
                if(!response.ok)throw new Error("MAL ranking request failed ("+response.status+")");
                return response.json();
              }));
              const seen=new Set(),matches=[];
              for(const json of responses)for(const item of json.data||[]){const node=item.node||item,id=Number(node.id);if(!id||seen.has(id))continue;seen.add(id);if((node.genres||[]).some(g=>String(g.name||"").toLowerCase()===genre))matches.push(node);}
              res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify({data:matches.slice(0,24).map(node=>({node})),paging:{has_more:responses.some(x=>(x.data||[]).length===100)}}));
            } catch(e) { res.statusCode=502;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:e.name==="AbortError"?"MyAnimeList genre search timed out":"MyAnimeList genre search failed"})); }
            finally { clearTimeout(timer); }
          } catch { res.statusCode=500;res.setHeader("Content-Type","application/json");res.end(JSON.stringify({error:"MyAnimeList genre search failed"})); }
        });
        server.middlewares.use("/api/provider-availability", async (req, res) => {
          try {
            const url = new URL(req.url, "http://localhost");
            const id=Number(url.searchParams.get("id")), mal=Number(url.searchParams.get("mal")), ep=Number(url.searchParams.get("ep"))||1, mediaId=mal>0?"mal/"+mal:"ani/"+id, mode=url.searchParams.get("mode")==="dub"?"dub":"sub";
            if ((!Number.isSafeInteger(id)||id<1)&&(!Number.isSafeInteger(mal)||mal<1)) { res.statusCode=400; res.end(JSON.stringify({error:"Invalid anime ID"})); return; }
            const urls=[{provider:"zokoanime",url:`https://zokoanime.video/stream/${mediaId}/${ep}/${mode}?color=a78bfa`},{provider:"megaplay",url:`https://megaplay.buzz/stream/${mediaId}/${ep}/${mode}`}];
            const providers=await Promise.all(urls.map(async x=>({provider:x.provider,available:await checkProvider(x.url)})));
            res.setHeader("Content-Type","application/json");res.setHeader("Cache-Control","no-store");res.end(JSON.stringify({providers}));
          } catch { res.statusCode=500;res.end(JSON.stringify({error:"Availability check failed"})); }
        });
        // Local Vite middleware for the authenticated Neon library API. Production uses api/[...path].js.
        server.middlewares.use("/api/account/library", async (req, res) => {
          const send = (status, body) => { res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(body)); };
          if (!["GET", "PUT"].includes(req.method)) { res.setHeader("Allow", "GET, PUT"); send(405, { error: "Method not allowed" }); return; }
          if (!env.CLERK_SECRET_KEY) { send(503, { error: "CLERK_SECRET_KEY is not configured in .env." }); return; }
          if (!env.DATABASE_URL) { send(503, { error: "DATABASE_URL is not configured in .env." }); return; }
          const token = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1];
          if (!token) { send(401, { error: "Sign in to access your cloud library." }); return; }
          let claims;
          try {
            const parties = String(env.CLERK_AUTHORIZED_PARTIES || "").split(",").map(x => x.trim()).filter(Boolean);
            if (!parties.length) { send(503, { error: "CLERK_AUTHORIZED_PARTIES is not configured in .env." }); return; }
            claims = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY, authorizedParties: parties });
          } catch { send(401, { error: "Your session is invalid or expired. Sign in again." }); return; }
          const userId = String(claims?.sub || claims?.payload?.sub || "");
          if (!userId || userId.length > 255) { send(401, { error: "Could not verify the signed-in user." }); return; }
          let rawBody = "";
          if (req.method === "PUT") {
            try { for await (const chunk of req) { rawBody += chunk; if (rawBody.length > 300000) { send(413, { error: "Library payload is too large." }); return; } } }
            catch { send(400, { error: "Could not read request body." }); return; }
          }
          try {
            const sql = neon(env.DATABASE_URL);
            await sql.query("CREATE TABLE IF NOT EXISTS aniscroll_user_library (clerk_user_id TEXT NOT NULL, collection TEXT NOT NULL CHECK (collection IN ('watchlist','history')), data JSONB NOT NULL DEFAULT '[]'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (clerk_user_id, collection))", []);
            if (req.method === "GET") {
              const rows = await sql.query("SELECT collection, data FROM aniscroll_user_library WHERE clerk_user_id = $1", [userId]);
              const out = { watchlist: [], history: [] };
              for (const row of rows) if (row.collection === "watchlist" || row.collection === "history") out[row.collection] = Array.isArray(row.data) ? row.data : [];
              send(200, out); return;
            }
            let body;
            try { body = JSON.parse(rawBody || "{}"); } catch { send(400, { error: "Invalid JSON body." }); return; }
            const collection = body?.collection, data = body?.data;
            if (!["watchlist", "history"].includes(collection) || !Array.isArray(data)) { send(400, { error: "Provide a watchlist or history array." }); return; }
            if (data.length > (collection === "watchlist" ? 1000 : 100) || JSON.stringify(data).length > 250000) { send(413, { error: "Library payload is too large." }); return; }
            await sql.query("INSERT INTO aniscroll_user_library (clerk_user_id, collection, data, updated_at) VALUES ($1, $2, $3::jsonb, NOW()) ON CONFLICT (clerk_user_id, collection) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()", [userId, collection, JSON.stringify(data)]);
            send(200, { ok: true, collection, count: data.length });
          } catch (error) { console.error("Aniscroll local cloud library API failed:", error?.message || error); send(500, { error: "Cloud library unavailable. Check Neon and server configuration." }); }
        });
      }
    }],
    server: { proxy: { "/api/mal": { target:"https://api.myanimelist.net", changeOrigin:true, rewrite:path=>path.replace(/^\/api\/mal/,"/v2"), configure:proxy=>proxy.on("proxyReq",req=>{if(env.MAL_CLIENT_ID)req.setHeader("X-MAL-CLIENT-ID",env.MAL_CLIENT_ID)}) } } },
    build: { outDir:"dist", emptyOutDir:true, rollupOptions:{ input:{home:resolve(process.cwd(),"index.html"),anime:resolve(process.cwd(),"anime.html"),watch:resolve(process.cwd(),"watch.html"),search:resolve(process.cwd(),"search.html"),schedule:resolve(process.cwd(),"schedule.html"),watchlist:resolve(process.cwd(),"watchlist.html"),history:resolve(process.cwd(),"history.html"),signin:resolve(process.cwd(),"signin.html"),signup:resolve(process.cwd(),"signup.html"),profile:resolve(process.cwd(),"profile.html"),notFound:resolve(process.cwd(),"404.html")} } }
  };
});