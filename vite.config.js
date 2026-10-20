import { defineConfig, loadEnv } from "vite";
import { resolve } from "node:path";

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
      }
    }],
    server: { proxy: { "/api/mal": { target:"https://api.myanimelist.net", changeOrigin:true, rewrite:path=>path.replace(/^\/api\/mal/,"/v2"), configure:proxy=>proxy.on("proxyReq",req=>{if(env.MAL_CLIENT_ID)req.setHeader("X-MAL-CLIENT-ID",env.MAL_CLIENT_ID)}) } } },
    build: { outDir:"dist", emptyOutDir:true, rollupOptions:{ input:{home:resolve(process.cwd(),"index.html"),anime:resolve(process.cwd(),"anime.html"),watch:resolve(process.cwd(),"watch.html"),search:resolve(process.cwd(),"search.html"),schedule:resolve(process.cwd(),"schedule.html"),watchlist:resolve(process.cwd(),"watchlist.html"),history:resolve(process.cwd(),"history.html"),notFound:resolve(process.cwd(),"404.html")} } }
  };
});