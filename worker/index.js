export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/provider-availability" && request.method === "GET") {
      const id=Number(url.searchParams.get("id")), mal=Number(url.searchParams.get("mal")), ep=Number(url.searchParams.get("ep"))||1, mode=url.searchParams.get("mode")==="dub"?"dub":"sub";
      if ((!Number.isSafeInteger(id)||id<1)&&(!Number.isSafeInteger(mal)||mal<1)) return Response.json({error:"Invalid anime ID"},{status:400});
      const streamId=mal>0?"mal/"+mal:"ani/"+id;
      const candidates=[{provider:"zokoanime",url:`https://zokoanime.video/stream/${streamId}/${ep}/${mode}?color=a78bfa`},{provider:"megaplay",url:`https://megaplay.buzz/stream/${streamId}/${ep}/${mode}`}];
      const providers=await Promise.all(candidates.map(async c=>{try{const r=await fetch(c.url);const body=(await r.text()).slice(0,12000).toLowerCase();const isError=/not found|404|couldn\x27t find anything to play|nothing to play|no stream|stream unavailable|episode unavailable|oops! something went wrong|something went wrong|page you\x27re looking for doesn\x27t exist|doesn\x27t exist or has|page not found|tv tokyo/.test(body);return {provider:c.provider,available:r.ok&&!isError}}catch{return {provider:c.provider,available:false}}}));
      return Response.json({providers},{headers:{"Cache-Control":"no-store"}});
    }
    if(request.method==="GET"&&url.pathname==="/api/mal/genre"){
      if(!env.MAL_CLIENT_ID)return Response.json({error:"MAL_CLIENT_ID is not configured."},{status:503,headers:{"Cache-Control":"no-store"}});
      const genre=(url.searchParams.get("genre")||"").trim().toLowerCase();
      const page=Math.max(1,Number(url.searchParams.get("page"))||1);
      const validGenres=new Set(["action","adventure","cars","comedy","dementia","demons","drama","ecchi","fantasy","game","harem","historical","horror","josei","kids","magic","martial arts","mecha","military","music","mystery","parody","police","psychological","romance","samurai","school","sci-fi","seinen","shoujo","shoujo ai","shounen","shounen ai","slice of life","space","sports","super power","supernatural","thriller","vampire","yaoi","yuri"]);
      if(!validGenres.has(genre))return Response.json({error:"Unsupported MyAnimeList genre."},{status:400});
      const offsets=[(page-1)*100,(page-1)*100+100,(page-1)*100+200];
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try{
        const responses=await Promise.all(offsets.map(async offset=>{
          const params=new URLSearchParams({ranking_type:"all",limit:"100",offset:String(offset),fields:"alternative_titles,synopsis,mean,popularity,num_episodes,media_type,status,start_date,genres"});
          const response=await fetch("https://api.myanimelist.net/v2/anime/ranking?"+params.toString(),{headers:{"X-MAL-CLIENT-ID":env.MAL_CLIENT_ID,"Accept":"application/json"},signal:controller.signal});
          if(!response.ok)throw new Error("MAL ranking request failed ("+response.status+")");
          return response.json();
        }));
        const seen=new Set(),matches=[];
        for(const json of responses)for(const item of json.data||[]){
          const node=item.node||item,id=Number(node.id);
          if(!id||seen.has(id))continue;
          seen.add(id);
          if((node.genres||[]).some(g=>String(g.name||"").toLowerCase()===genre))matches.push(node);
        }
        return Response.json({data:matches.slice(0,24).map(node=>({node})),paging:{has_more:responses.some(x=>(x.data||[]).length===100)}},{headers:{"Cache-Control":"public, max-age=300"}});
      }catch(e){return Response.json({error:e.name==="AbortError"?"MyAnimeList genre search timed out":"MyAnimeList genre search failed"},{status:502,headers:{"Cache-Control":"no-store"}});}
      finally{clearTimeout(timer)}
    }
    if(request.method==="GET"&&url.pathname==="/api/mal/anime"){
      if(!env.MAL_CLIENT_ID)return Response.json({error:"MAL_CLIENT_ID is not configured. Add it to .dev.vars locally or Cloudflare Worker secrets in production."},{status:503,headers:{"Cache-Control":"no-store"}});
      const query=(url.searchParams.get("q")||"").trim();
      if(!query)return Response.json({data:[]});
      const params=new URLSearchParams({q:query,limit:String(Math.min(24,Math.max(1,Number(url.searchParams.get("limit"))||24))),fields:"alternative_titles,synopsis,mean,rank,popularity,num_episodes,average_episode_duration,media_type,status,start_date,end_date,genres"});
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
      let upstream;
      try{upstream=await fetch("https://api.myanimelist.net/v2/anime?"+params.toString(),{headers:{"X-MAL-CLIENT-ID":env.MAL_CLIENT_ID,"Accept":"application/json"},signal:controller.signal});}
      catch(e){return Response.json({error:e.name==="AbortError"?"MyAnimeList API timed out":"Could not connect to MyAnimeList API"},{status:502,headers:{"Cache-Control":"no-store"}});}
      finally{clearTimeout(timer)}
      if(!upstream.ok)return Response.json({error:"MyAnimeList API request failed",status:upstream.status},{status:upstream.status===404?404:upstream.status===429?429:502,headers:{"Cache-Control":"no-store"}});
      return new Response(await upstream.text(),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=300"}});
    }
    const malMatch=url.pathname.match(/^\/api\/mal\/anime\/(\d+)$/);
    if(request.method==="GET"&&malMatch){
      if(!env.MAL_CLIENT_ID)return Response.json({error:"MAL_CLIENT_ID is not configured. Add it to .dev.vars locally or Cloudflare Worker secrets in production."},{status:503,headers:{"Cache-Control":"no-store"}});
      const malId=Number(malMatch[1]);if(!Number.isSafeInteger(malId)||malId<1)return Response.json({error:"Invalid MAL ID"},{status:400});
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
      let upstream;
      try{upstream=await fetch(`https://api.myanimelist.net/v2/anime/${malId}?fields=alternative_titles,synopsis,mean,rank,popularity,media_type,status,num_episodes,average_episode_duration,start_date,end_date,genres`,{headers:{"X-MAL-CLIENT-ID":env.MAL_CLIENT_ID,"Accept":"application/json"},signal:controller.signal});}
      catch(e){return Response.json({error:e.name==="AbortError"?"MyAnimeList API timed out":"Could not connect to MyAnimeList API"},{status:502,headers:{"Cache-Control":"no-store"}});}
      finally{clearTimeout(timer)}
      if(!upstream.ok)return Response.json({error:"MyAnimeList API request failed",status:upstream.status},{status:upstream.status===404?404:upstream.status===429?429:502,headers:{"Cache-Control":"no-store"}});
      return new Response(await upstream.text(),{headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"public, max-age=300"}});
    }
    if(url.pathname==="/api/health")return Response.json({ok:true,app:"Aniscroll",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
    return env.ASSETS.fetch(request);
  }
};
