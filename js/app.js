import {getAnime,getAnimeByIds,getAnimeList,getCurrentAnime,searchAnime,getSchedule} from "./anilist.js";
import {searchMalAnime,searchMalGenre,getMalAnime} from "./mal.js";
import {mountAuthNavigation,syncLibraryWrite} from "./clerk-client.js";
const K={w:"aniscroll:watchlist:v1",h:"aniscroll:history:v1"},$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),title=a=>a?.title?.english||a?.title?.romaji||a?.title?.native||"Untitled anime",cover=a=>a?.coverImage?.extraLarge||a?.coverImage?.large||"https://placehold.co/420x630/171827/d8b4fe?text=Anime",score=a=>a?.averageScore?(a.averageScore/10).toFixed(1):"NR",meta=a=>[a.format,a.seasonYear,a.episodes?Number(a.episodes)+" eps":null].filter(Boolean).join(" · ");
function read(k){try{const v=JSON.parse(localStorage.getItem(k)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));void syncLibraryWrite(k,v)}catch{toast("Browser storage is unavailable")}}function toast(s){let n=$("#toast");if(!n){n=document.createElement("div");n.id="toast";n.className="toast";document.body.append(n)}n.textContent=s;n.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>n.classList.remove("show"),2200)}
function header(){const slot=$("#site-header");if(!slot)return;const p=location.pathname;slot.innerHTML='<header class="site-header"><a class="brand" href="/index.html"><span class="brand-mark">A</span><span class="brand-name">ani<span class="violet">scroll</span><small class="brand-tag">YOUR ANIME UNIVERSE</small></span></a><nav id="main-nav" class="main-nav"><a class="nav-link" href="/index.html">Home</a><a class="nav-link" href="/search.html">Discover</a><a class="nav-link" href="/schedule.html">Schedule</a><a class="nav-link" href="/watchlist.html">Watchlist</a><a class="nav-link" href="/history.html">History</a></nav><form class="header-search" id="header-search"><span>⌕</span><input name="q" type="search" placeholder="Search anime…" aria-label="Search anime"><kbd>↵</kbd></form><div id="auth-control" class="auth-control"><a class="button button-quiet button-small" href="/signin.html">Sign in</a><a class="button button-primary button-small" href="/signup.html">Sign up</a></div><button class="mobile-menu" id="mobile-menu" aria-label="Toggle navigation">☰</button></header>';mountAuthNavigation();$$(".nav-link").forEach(a=>{if(a.pathname===p)a.classList.add("active")});$("#header-search").addEventListener("submit",e=>{e.preventDefault();const q=new FormData(e.currentTarget).get("q")?.toString().trim();if(q)location.href="/search.html?q="+encodeURIComponent(q)});const searchForm=$("#header-search"),searchInput=searchForm.querySelector("input"),searchIcon=searchForm.querySelector("span");searchIcon.setAttribute("role","button");searchIcon.setAttribute("tabindex","0");searchIcon.setAttribute("aria-label","Open anime search");const openSearch=()=>{searchForm.classList.add("search-open");searchInput.style.display="block";searchInput.focus()};searchIcon.addEventListener("click",openSearch);searchIcon.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openSearch()}});searchInput.addEventListener("blur",()=>{if(!searchInput.value.trim()){searchForm.classList.remove("search-open");searchInput.style.removeProperty("display")}});const menuButton=$("#mobile-menu"),mainNav=$("#main-nav");menuButton.setAttribute("aria-controls","main-nav");menuButton.setAttribute("aria-expanded","false");menuButton.addEventListener("click",()=>{const open=mainNav.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open));menuButton.setAttribute("aria-label",open?"Close navigation":"Open navigation");menuButton.textContent=open?"×":"☰"});mainNav.addEventListener("click",e=>{if(e.target.closest(".nav-link")){mainNav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");menuButton.setAttribute("aria-label","Open navigation");menuButton.textContent="☰"}});document.addEventListener("click",e=>{if(!e.target.closest(".site-header")&&mainNav.classList.contains("open")){mainNav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");menuButton.setAttribute("aria-label","Open navigation");menuButton.textContent="☰"}})}
function footer(){const n=$("#site-footer");if(n)n.innerHTML='<footer class="site-footer"><div class="footer-inner"><a href="/index.html" class="footer-brand">ani<span>scroll</span></a><p class="footer-note">Anime metadata powered by AniList. Aniscroll is an independent fan project.</p><nav class="footer-links"><a href="/search.html">Discover</a><a href="/watchlist.html">Watchlist</a><a href="/history.html">History</a><a href="https://anilist.co" target="_blank" rel="noreferrer">AniList ↗</a></nav></div></footer>'}
function animeSlug(value){return String(value||"anime").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80)||"anime"}
function animeUrl(a){return a?.malOnly?"/anime.html?source=mal&id="+Number(a.id):"/anime/"+Number(a.id)+"/"+animeSlug(title(a))}
function setSeoMeta({title:pageTitle,description,canonical,robots="index,follow"}){document.title=pageTitle;let meta=document.querySelector('meta[name="description"]');if(!meta){meta=document.createElement("meta");meta.name="description";document.head.append(meta)}meta.content=description;let robot=document.querySelector('meta[name="robots"]');if(!robot){robot=document.createElement("meta");robot.name="robots";document.head.append(robot)}robot.content=robots;let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement("link");link.rel="canonical";document.head.append(link)}link.href=canonical;}
function card(a,ep){
 const id=Number(a.id),mal=Number(a.idMal)||0,detailUrl=animeUrl(a),watchQuery=a.malOnly?"source=mal&id="+id+"&mal="+mal+"&ep="+Number(ep||1):"id="+id+(mal?"&mal="+mal:"")+"&ep="+Number(ep||1),watchUrl="/watch.html?"+watchQuery,watchBase=a.malOnly?"source=mal&id="+id+"&mal="+mal:"id="+id+(mal?"&mal="+mal:""),genres=Array.isArray(a.genres)?a.genres.slice(0,6):[],description=String(a.description||"").replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim();
 const names=[a.title?.english,a.title?.romaji].filter((v,i,arr)=>v&&v!==title(a)&&arr.indexOf(v)===i).slice(0,2);
 const status=a.status==="RELEASING"?"Currently Airing":a.status==="FINISHED"?"Finished":a.status==="NOT_YET_RELEASED"?"Upcoming":String(a.status||"Unknown").replace(/_/g," ");
 return '<article class="poster-card poster-hover-card"><a class="poster-cover" href="'+detailUrl+'"><img src="'+esc(cover(a))+'" alt="'+esc(title(a))+'" loading="lazy" referrerpolicy="no-referrer"><span class="poster-score">★ '+score(a)+'</span><span class="poster-format">'+(ep?'EP '+Number(ep):esc(a.format||"ANIME"))+'</span><span class="poster-overlay"><span class="play-orb">▶</span></span></a><a class="poster-title" href="'+detailUrl+'">'+esc(title(a))+'</a><div class="poster-meta">'+esc(meta(a)||"Anime")+'</div><div class="poster-hover-details"><a class="hover-detail-title" href="'+detailUrl+'">'+esc(title(a))+'</a><div class="hover-badges"><span>'+esc(a.format||"ANIME")+'</span><span>HD</span><span>★ '+score(a)+'</span></div><p class="hover-description">'+esc(description?description.slice(0,230)+(description.length>230?"…":""):"Synopsis unavailable.")+'</p>'+(names.length?'<p class="hover-alt-names"><strong>Other names:</strong> '+esc(names.join("; "))+'</p>':"")+'<div class="hover-stats"><span>Score: '+score(a)+'</span><span>Year: '+esc(a.seasonYear||a.startDate?.year||"—")+'</span><span>Duration: '+(a.duration?Number(a.duration)+" min":"—")+'</span><span>Status: '+esc(status)+'</span></div>'+(genres.length?'<div class="hover-genres"><strong>Genre:</strong> '+genres.map(g=>esc(g)).join(", ")+'</div>':"")+'<div class="hover-actions"><a href="'+watchUrl+'">▶ Watch</a>'+(a.malOnly?'':'<button type="button" class="hover-save" data-id="'+id+'">'+(isSaved(id)?"✓ In List":"+ Add to List")+'</button>')+'</div></div></article>'
}
function draw(n,items,msg="No anime found"){if(!n)return;n.innerHTML=items?.length?items.map(a=>card(a)).join(""):'<div class="empty-state"><span>✧</span><h2>'+esc(msg)+'</h2><p>Try another title or filter.</p><a class="button button-primary" href="/search.html">Discover anime</a></div>';$$(".hover-save",n).forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const saved=toggleSaved(Number(b.dataset.id));b.textContent=saved?"✓ In List":"+ Add to List"}))}
function getList(){return read(K.w)}function isSaved(id){return getList().some(x=>Number(x.id)===Number(id))}function toggleSaved(id){const l=getList();if(isSaved(id)){write(K.w,l.filter(x=>Number(x.id)!==Number(id)));toast("Removed from watchlist");return false}l.unshift({id:Number(id),status:"planned",addedAt:Date.now()});write(K.w,l);toast("Added to watchlist");return true}function record(a,ep){const old=read(K.h),v={id:Number(a.id),episode:Number(ep),title:title(a),image:cover(a),source:a.malOnly?"mal":"anilist",malId:Number(a.idMal)||0,watchedAt:Date.now()};write(K.h,[v,...old.filter(x=>!(Number(x.id)===v.id&&Number(x.episode)===v.episode))].slice(0,60))}
function drawHistory(n,list){if(!n)return;if(!list.length){n.innerHTML='<div class="empty-state"><span>◷</span><h2>Your story continues here</h2><p>Open an episode and it will appear in history.</p><a class="button button-primary" href="/search.html">Find anime</a></div>';return}n.innerHTML=list.map(x=>'<article class="poster-card"><a class="poster-cover" href="/watch.html?'+(x.source==="mal"?'source=mal&mal='+Number(x.malId||x.id)+'&id='+Number(x.id):'id='+Number(x.id))+'&ep='+Number(x.episode||1)+'"><img src="'+esc(x.image||"")+'" alt="" loading="lazy"><span class="poster-format">EP '+Number(x.episode||1)+'</span></a><a class="poster-title" href="/watch.html?'+(x.source==="mal"?'source=mal&mal='+Number(x.malId||x.id)+'&id='+Number(x.id):'id='+Number(x.id))+'&ep='+Number(x.episode||1)+'">'+esc(x.title||"Continue watching")+'</a><div class="poster-meta">'+new Date(x.watchedAt||Date.now()).toLocaleDateString()+'</div></article>').join("")}
async function home(){
 let featured=[],active=0,slideTimer;
 const heroImage=$("#hero-image"),heroTitle=$("#hero-title"),heroMeta=$("#hero-meta"),heroDescription=$("#hero-description"),watch=$("#hero-watch"),details=$("#hero-details"),pagination=$("#hero-pagination");
 const setSlide=(index)=>{
  if(!featured.length)return;
  active=(index+featured.length)%featured.length;
  const a=featured[active],id=Number(a.id),mal=Number(a.idMal)||0;
  heroImage.style.backgroundImage='url("'+cover(a)+'")';
  heroTitle.textContent=title(a);
  heroMeta.innerHTML='<span>▶ '+esc(a.format||"TV")+'</span><span>▦ '+esc(a.seasonYear||a.startDate?.year||"Anime")+'</span><span class="score">★ '+score(a)+'</span>';
  const description=String(a.description||"Discover your next favorite anime.").replace(/<[^>]*>/g," ").replace(/\\s+/g," ").trim();
  heroDescription.textContent=description||"Discover your next favorite anime.";
  watch.href="/watch.html?id="+id+(mal?"&mal="+mal:"")+"&ep=1";
  details.href=animeUrl(a);
  $("#hero-rank").textContent="#"+(active+1)+" SPOTLIGHT";
  pagination.innerHTML=featured.map((_,i)=>'<button type="button" class="'+(i===active?"active":"")+'" data-slide="'+i+'" aria-label="Show featured anime '+(i+1)+'"></button>').join("");
  $$("[data-slide]",pagination).forEach(b=>b.addEventListener("click",()=>{setSlide(Number(b.dataset.slide));restartTimer()}));
 };
 const restartTimer=()=>{clearInterval(slideTimer);if(featured.length>1)slideTimer=setInterval(()=>setSlide(active+1),8000)};
 $("#hero-prev")?.addEventListener("click",()=>{setSlide(active-1);restartTimer()});
 $("#hero-next")?.addEventListener("click",()=>{setSlide(active+1);restartTimer()});
 const loaders=[
  ["trending-grid",()=>getAnimeList("TRENDING",24)],
  ["popular-grid",()=>getAnimeList("POPULARITY",18)],
  ["season-grid",()=>getCurrentAnime(18)]
 ];
 const tasks=loaders.map(async([id,fn])=>{
  try{
   const a=await fn();
   draw($("#"+id),a);
   if(id==="trending-grid"&&a.length){featured=a.slice(0,8);setSlide(0);restartTimer()}
  }catch(e){
   const grid=$("#"+id);
   if(grid)grid.innerHTML='<div class="empty-state"><h2>Could not load anime</h2><p>'+esc(e.message)+'</p><button class="button button-quiet" data-home-retry="'+id+'">Retry</button></div>';
   $$("[data-home-retry='"+id+"']").forEach(b=>b.addEventListener("click",()=>{b.disabled=true;b.textContent="Loading…";fn().then(a=>draw(grid,a)).catch(err=>{b.disabled=false;b.textContent="Retry";toast(err.message)})}));
  }
 });
 await Promise.all(tasks);
 const h=read(K.h).slice(0,6);
 if(h.length){
  $("#continue-section").hidden=false;
  try{const a=await getAnimeByIds(h.map(x=>x.id)),m=new Map(a.map(x=>[Number(x.id),x]));$("#continue-grid").innerHTML=h.map(x=>m.has(Number(x.id))?card(m.get(Number(x.id)),x.episode):"").join("")}catch{}
 }
}
async function searchPage(){
 const form=$("#search-form"),q=$("#query-input"),f=$("#format-filter"),s=$("#status-filter"),g=$("#genre-filter"),season=$("#season-filter"),year=$("#year-filter"),sort=$("#sort-filter"),params=new URLSearchParams(location.search);
 setSeoMeta({title:"Discover anime — Aniscroll",description:"Explore anime by title, genre, format, release status and season.",canonical:location.origin+"/search.html",robots:params.toString()?"noindex,follow":"index,follow"});
 q.value=params.get("q")||""; f.value=params.get("format")||""; s.value=params.get("status")||""; if(g)g.value=params.get("genre")||""; if(season)season.value=params.get("season")||""; if(year)year.value=params.get("year")||""; sort.value=params.get("sort")||"TRENDING_DESC";
 let page=Math.max(1,Number(params.get("page"))||1);
 async function load(){
  const grid=$("#search-results"); grid.innerHTML=Array.from({length:12},()=>'<div class="loading-card"></div>').join("");
  $("#results-title").textContent=q.value.trim()?'Results for "'+q.value.trim()+'"':"Explore anime"; $("#results-count").textContent= g?.value ? "Searching AniList and MyAnimeList…" : "Searching AniList…";
  const filters={search:q.value.trim()||undefined,format:f.value||undefined,status:s.value||undefined,genres:g?.value?[g.value]:undefined,season:season?.value||undefined,seasonYear:year?.value?Number(year.value):undefined,sort:sort.value,page,perPage:24};
  try {
   let r,fromMal=false;
   try{r=await searchAnime(filters);}
   catch(anilistError){if(!filters.search)throw anilistError;r={media:[],pageInfo:{total:0,currentPage:1,lastPage:1,hasNextPage:false}};}
   if(filters.search&&!r.media.length){
    $("#results-count").textContent="No AniList matches. Searching MyAnimeList…";
    r=await searchMalAnime(filters.search);
    fromMal=true;
   }
   if(filters.genre){
    $("#results-count").textContent="Combining AniList and MyAnimeList genre results…";
    const malResults=await searchMalGenre(filters.genre,page);
    const seen=new Set(r.media.map(a=>Number(a.idMal||0)).filter(Boolean));
    const merged=[...r.media,...malResults.media.filter(a=>!seen.has(Number(a.idMal||a.id)))];
    r={media:merged,pageInfo:{...r.pageInfo,total:merged.length}};
    fromMal=true;
   }
   draw(grid,r.media,"No matching anime");
   $("#results-count").textContent=(fromMal?"AniList + MyAnimeList · ":"")+(Number(r.pageInfo.total||0)).toLocaleString()+" titles · Page "+r.pageInfo.currentPage+" of "+r.pageInfo.lastPage;
   const url=new URL(location.href); ["q","format","status","genre","season","year","sort","page"].forEach(k=>url.searchParams.delete(k));
   if(filters.search)url.searchParams.set("q",filters.search); if(filters.format)url.searchParams.set("format",filters.format); if(filters.status)url.searchParams.set("status",filters.status);
   if(g?.value)url.searchParams.set("genre",g.value); if(season?.value)url.searchParams.set("season",season.value); if(year?.value)url.searchParams.set("year",year.value); if(filters.sort)url.searchParams.set("sort",filters.sort); if(page>1)url.searchParams.set("page",String(page)); history.replaceState({},"",url);
   const current=r.pageInfo.currentPage,last=Math.max(1,r.pageInfo.lastPage),p=$("#pagination");
   p.innerHTML='<button class="page-button" data-page="'+(current-1)+'" '+(current<=1?'disabled':'')+'>← Previous</button><span class="muted">Page '+current+' / '+last+'</span><button class="page-button" data-page="'+(current+1)+'" '+(current>=last?'disabled':'')+'>Next →</button>';
   $$("[data-page]",p).forEach(b=>b.addEventListener("click",()=>{page=Number(b.dataset.page);load();scrollTo({top:0,behavior:"smooth"})}));
  } catch(e) {
   grid.innerHTML='<div class="empty-state"><h2>Search unavailable</h2><p>'+esc(e.message)+'</p><button id="retry" class="button button-quiet">Retry</button></div>';
   $("#retry")?.addEventListener("click",load); $("#results-count").textContent="AniList request failed.";
  }
 }
 form.addEventListener("submit",e=>{e.preventDefault();page=1;load()});
 $("#clear-filters").addEventListener("click",()=>{form.reset();sort.value="TRENDING_DESC";page=1;load()});
 await load();
}
async function animePage(){const params=new URLSearchParams(location.search),sourceMal=params.get("source")==="mal",pathId=location.pathname.match(/^\/anime\/(\d+)/)?.[1],id=Number(params.get("id")||pathId),box=$("#anime-detail");if(!Number.isInteger(id)||id<1){box.innerHTML='<div class="error-state"><h2>Anime ID missing</h2><a href="/search.html">Discover anime</a></div>';return}try{const a=sourceMal?await getMalAnime(id):await getAnime(id),d=(a.description||"No synopsis available.").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),rel=(a.relations?.edges||[]).filter(x=>x.node?.type==="ANIME"&&!x.node.isAdult).slice(0,8),rec=(a.recommendations?.nodes||[]).map(x=>x.mediaRecommendation).filter(x=>x&&!x.isAdult).slice(0,8);const canonical=location.origin+animeUrl(a),seoDescription=d.slice(0,155)||("Explore "+title(a)+": synopsis, genres, format, release status and episode information on Aniscroll.");setSeoMeta({title:title(a)+" — Anime Info, Synopsis & Genres | Aniscroll",description:seoDescription,canonical});let schema=document.getElementById("anime-jsonld");if(!schema){schema=document.createElement("script");schema.id="anime-jsonld";schema.type="application/ld+json";document.head.append(schema)}schema.textContent=JSON.stringify({"@context":"https://schema.org","@type":"TVSeries","name":title(a),"url":canonical,"image":cover(a),"description":d.slice(0,1000),"genre":a.genres||[],"datePublished":a.startDate?.year?String(a.startDate.year):undefined,"numberOfEpisodes":a.episodes||undefined,"aggregateRating":a.averageScore?{"@type":"AggregateRating","ratingValue":Number(a.averageScore)/10,"bestRating":10}:undefined});box.innerHTML='<div class="detail-hero"><div class="detail-backdrop" style="background-image:url('+JSON.stringify(a.bannerImage||cover(a))+')"></div><div class="detail-content"><img class="detail-cover" src="'+esc(cover(a))+'" alt="'+esc(title(a))+' cover"><div><p class="section-kicker">ANISCROLL TITLE GUIDE</p><h1 class="detail-title">'+esc(title(a))+'</h1><div class="detail-native">'+esc(a.title?.native||"")+'</div><div class="detail-stats"><span class="stat-pill">★ '+score(a)+' AniList</span><span class="stat-pill">'+esc(a.format||"ANIME")+'</span><span class="stat-pill">'+esc(a.status||"UNKNOWN")+'</span><span class="stat-pill">'+(a.episodes?Number(a.episodes)+" episodes":"Episode count unknown")+'</span></div><div class="genre-list">'+(a.genres||[]).map(g=>'<a class="genre-chip" href="/search.html?genre='+encodeURIComponent(g)+'">'+esc(g)+'</a>').join("")+'</div><p class="detail-description">'+esc(d.slice(0,900))+'</p><div class="detail-actions"><a class="button button-primary" href="/watch.html?'+(a.malOnly?'source=mal&id='+id+'&mal='+id:'id='+id+(Number(a.idMal)?'&mal='+Number(a.idMal):''))+'&ep=1">▶ Watch episode 1</a><button class="button button-quiet" id="save-anime">'+(isSaved(id)?"✓ Saved to watchlist":"♡ Add to watchlist")+'</button><a class="button button-quiet" href="'+esc(a.siteUrl||(a.malOnly?"https://myanimelist.net/anime/"+id:"https://anilist.co"))+'" target="_blank" rel="noreferrer">'+(a.malOnly?"MyAnimeList ↗":"AniList ↗")+'</a></div></div></div></div><div class="detail-layout"><div><section class="detail-section"><h2>About this anime</h2><p class="detail-description">'+esc(d)+'</p></section><section class="detail-section"><h2>Episodes</h2><div class="episodes-notice">'+(a.episodes?Number(a.episodes)+" episodes listed by AniList.":"Episode count unavailable.")+' Episode mapping and stream availability depend on the provider. <a class="text-link" href="/watch.html?id='+id+'&ep=1">Open player ↗</a></div></section></div><aside class="detail-section"><h2>Title information</h2><div class="episodes-notice"><p><strong>Format</strong><br>'+esc(a.format||"Unknown")+'</p><p><strong>Status</strong><br>'+esc(a.status||"Unknown")+'</p><p><strong>Year</strong><br>'+esc(a.startDate?.year||a.seasonYear||"Unknown")+'</p><p><strong>Popularity</strong><br>'+Number(a.popularity||0).toLocaleString()+'</p></div></aside></div>'+(rel.length?'<section class="detail-section"><h2>Related titles</h2><div class="related-grid">'+rel.map(x=>card(x.node)).join("")+'</div></section>':"")+(rec.length?'<section class="detail-section"><h2>You might also like</h2><div class="related-grid">'+rec.map(card).join("")+'</div></section>':"");$("#save-anime").addEventListener("click",()=>{$("#save-anime").textContent=toggleSaved(id)?"✓ Saved to watchlist":"♡ Add to watchlist"})}catch(e){box.innerHTML='<div class="error-state"><h2>We could not load this anime</h2><p>'+esc(e.message)+'</p><a href="/search.html">Back to discovery</a></div>'}}
function streamURL(provider,id,ep,mode,malId=null,useMal=false){if(!Number.isInteger(Number(ep))||Number(ep)<1)throw Error("Invalid episode");const source=useMal?"mal":"ani",streamId=useMal?Number(malId):Number(id);if(!Number.isInteger(streamId)||streamId<1)throw Error("A valid MyAnimeList ID is required for MAL fallback");if(provider==="megaplay"){if(mode==="hsub")throw Error("Hard-subbed is configured only for ZokoAnime");return "https://megaplay.buzz/stream/"+source+"/"+streamId+"/"+Number(ep)+"/"+mode}return "https://zokoanime.video/stream/"+source+"/"+streamId+"/"+Number(ep)+"/"+mode}
async function watchPage(){
 const p=new URLSearchParams(location.search),initialMalId=Number(p.get("mal"))||0,requestedId=Number(p.get("id"))||0,sourceMal=p.get("source")==="mal"||(initialMalId>0&&requestedId===initialMalId),id=requestedId||(sourceMal?initialMalId:0);
 let ep=Math.max(1,Number(p.get("ep"))||1);
 let provider=["zokoanime","megaplay"].includes(p.get("provider"))?p.get("provider"):"zokoanime";
 let mode=["sub","dub","hsub"].includes(p.get("mode"))?p.get("mode"):"sub";
 const box=$("#watch-app");
 if(!Number.isInteger(id)||id<1){box.innerHTML='<div class="error-state"><h2>Choose an anime first</h2><a href="/search.html">Discover anime</a></div>';return}
 try{
  let a,useMalIds=sourceMal||initialMalId>0,metadataFromMal=sourceMal;
  if(sourceMal){a=await getMalAnime(initialMalId||id);useMalIds=true;metadataFromMal=true;}
  else{try{a=await getAnime(id)}catch(anilistError){if(!initialMalId)throw anilistError;a=await getMalAnime(initialMalId);useMalIds=true;metadataFromMal=true;}}
  const malId=Number(a.idMal)||initialMalId,count=Number(a.episodes)||0,animeTitle=title(a),poster=cover(a);
  if(!sourceMal&&malId>0&&id!==malId)useMalIds=true;
  const availableEpisodeCount=a.status==="RELEASING"&&a.nextAiringEpisode&&Number(a.nextAiringEpisode.episode)>0?Math.min(count||Number(a.nextAiringEpisode.episode)-1,Number(a.nextAiringEpisode.episode)-1):count;
  document.title="Watch "+animeTitle+" — Aniscroll";
  const description=(a.description||"No synopsis available.").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
  const seasons=(a.relations?.edges||[]).filter(x=>x.node?.type==="ANIME"&&!x.node.isAdult).slice(0,6);
  box.classList.add("watch-page");
  box.innerHTML=
   '<div class="watch-breadcrumb"><a href="/index.html">← Back to discovery</a><span>ANISCROLL / WATCH</span></div>'+

   '<div class="watch-layout watch-layout-reference">'+
    '<aside class="episode-sidebar reference-episodes"><div class="reference-episode-head"><h2>List of episodes:</h2><label class="episode-search"><span>⌕</span><input id="episode-search" type="search" placeholder="Number of Ep" aria-label="Search episode number"></label></div>'+
     '<div class="episode-list reference-episode-list" id="episode-list"></div>'+
    '</aside>'+
    '<section class="watch-main-column">'+
     '<div class="reference-player"><div class="video-frame-wrap" id="video-frame-wrap"></div>'+
      '</div>'+
   ((a.status==="RELEASING"&&a.nextAiringEpisode&&Number(a.nextAiringEpisode.airingAt)*1000>Date.now())?'<div class="airing-notice" id="airing-notice"><span class="airing-notice-message">♧ The next episode is predicted to arrive on <strong id="airing-date"></strong> <span id="airing-countdown"></span></span><button type="button" class="airing-notice-close" id="airing-notice-close" aria-label="Dismiss airing notice">×</button></div>':'')+
     '<div class="watch-action-bar"><button type="button" class="watch-action" id="light-toggle">💡 Light <strong>On</strong></button><button type="button" class="watch-action" id="autoplay-toggle">Auto Play <strong>On</strong></button><button type="button" class="watch-action" id="autonext-toggle">Auto Next <strong>Off</strong></button><button type="button" class="watch-action" id="skipintro-toggle">Auto Skip Intro <strong>Off</strong></button><button type="button" class="watch-action" id="save-watch">＋ Add to List</button><a class="watch-action" href="#watch-together">◉ Watch2gether</a><button type="button" class="watch-action" id="prev-text">◀ Prev</button><button type="button" class="watch-action" id="next-text">Next ▶</button><button type="button" class="watch-action" id="report-player">⚠ Report</button></div>'+
     '<div class="watch-server-panel"><div class="watch-server-note"><strong id="server-note-title">You are watching Episode '+ep+'</strong><p>If current server doesn’t work, please try another server beside.</p></div><div class="watch-server-options">'+
      '<div class="server-row"><span class="server-label">▣ &nbsp; SUB:</span><button class="server-choice" data-provider="zokoanime" data-mode="sub">ZokoAnime</button><button class="server-choice" data-provider="megaplay" data-mode="sub">MegaPlay</button></div>'+
      '<div class="server-row" id="dub-server-row"><span class="server-label">♩ &nbsp; DUB:</span><span class="dub-availability" id="dub-availability" role="status">Checking availability…</span></div>'+
      ''+
     '</div></div>'+
     '<section class="watch-anime-info"><img class="watch-info-poster" src="'+esc(poster)+'" alt="'+esc(animeTitle)+' poster"><div class="watch-info-copy"><h1>'+esc(animeTitle)+'</h1><div class="watch-info-stats"><span class="rating-badge">R</span><span class="rating-badge pink">HD</span><span class="rating-badge green">CC '+(count||"—")+'</span><span class="rating-badge blue">♩ '+(count||"—")+'</span><span class="watch-meta-dot">• '+esc(a.format||"TV")+' • '+(a.duration?Number(a.duration)+"m":"24m")+'</span></div><p>'+esc(description.slice(0,540))+(description.length>540?' …':'')+' <button class="inline-more" id="more-description">＋ More</button></p><a class="button button-quiet button-small" href="/watch.html?id='+id+(malId?"&mal="+malId:"")+(metadataFromMal?"&source=mal":"")+'">View detail</a></div></section>'+
    '</section>'+
    '<aside class="watch-related-sidebar"><h2>Related</h2><div class="watch-related-list">'+(seasons.length?seasons.map(x=>'<a class="watch-related-item" href="'+animeUrl(x.node)+'"><img src="'+esc(x.node.coverImage?.medium||x.node.coverImage?.large||"")+'" alt=""><span><strong>'+esc(x.node.title?.english||x.node.title?.romaji||"Related anime")+'</strong><small>'+esc(x.node.format||"Anime")+' · '+(x.node.episodes?Number(x.node.episodes)+" Eps":"Episodes unknown")+(x.node.duration?" · "+Number(x.node.duration)+" min":"")+'</small></span></a>').join(""):'<p class="related-empty">No related titles found.</p>')+'</div></aside>'+
   '</div>';
  let availabilityVersion=0;
  async function checkEpisodeAvailability(){
   const version=++availabilityVersion;
   const subRow=$$(".server-row").find(row=>row.querySelector('[data-mode="sub"]'));
   const dubRow=$("#dub-server-row");
   if(!subRow||!dubRow)return;
   const check=async audioMode=>{
    const query=new URLSearchParams({id:String(id),mal:String(malId||0),ep:String(ep),mode:audioMode});
    const response=await fetch("/api/provider-availability?"+query.toString(),{cache:"no-store"});
    if(!response.ok)throw new Error("Availability check failed");
    const data=await response.json();
    return (data.providers||[]).filter(item=>item.available).map(item=>item.provider);
   };
   try{
    const [subProviders,dubProviders]=await Promise.all([check("sub"),check("dub")]);
    if(version!==availabilityVersion)return;
    // Only expose MegaPlay as an alternate when ZokoAnime itself has that audio track.
    // If ZokoAnime has no SUB/DUB for this episode, hide that whole audio row.
    const visibleSubProviders=subProviders.includes("zokoanime")?subProviders.filter(name=>name==="zokoanime"||name==="megaplay"):[];
    const visibleDubProviders=dubProviders.includes("zokoanime")?dubProviders.filter(name=>name==="zokoanime"||name==="megaplay"):[];
    const updateRow=(row,audioMode,providers)=>{
     row.querySelectorAll(".server-choice").forEach(button=>button.remove());
     const currentStatus=row.querySelector("#dub-availability");
     if(!providers.length){
      if(audioMode==="dub"){
       if(currentStatus){currentStatus.textContent="Dub unavailable for this episode";currentStatus.hidden=false;}
       else {const label=document.createElement("span");label.id="dub-availability";label.className="dub-availability";label.textContent="Dub unavailable for this episode";row.append(label);}
      }else{
       let note=row.querySelector(".audio-unavailable");if(!note){note=document.createElement("span");note.className="audio-unavailable";row.append(note)}note.textContent="Sub unavailable for this episode";
      }
      return;
     }
     currentStatus?.remove();row.querySelector(".audio-unavailable")?.remove();
     providers.forEach(name=>{
      const button=document.createElement("button");button.type="button";button.className="server-choice";button.dataset.provider=name;button.dataset.mode=audioMode;button.textContent=name==="zokoanime"?"ZokoAnime":"MegaPlay";
      button.addEventListener("click",()=>{provider=name;mode=audioMode;fallbackAttempted=false;useMalIds=metadataFromMal||malId>0;load()});
      row.append(button);
     });
    };
    subRow.hidden=!visibleSubProviders.length;
    dubRow.hidden=!visibleDubProviders.length;
    updateRow(subRow,"sub",visibleSubProviders);updateRow(dubRow,"dub",visibleDubProviders);
    const currentAvailable=(mode==="dub"?visibleDubProviders:visibleSubProviders).includes(provider);
    if(!currentAvailable){
     const preferredMode=visibleSubProviders.length?"sub":visibleDubProviders.length?"dub":null;
     if(preferredMode){const list=preferredMode==="sub"?visibleSubProviders:visibleDubProviders;mode=preferredMode;provider=list.includes("zokoanime")?"zokoanime":list[0];}
    }
   }catch{
    if(version!==availabilityVersion)return;
    const status=$("#dub-availability");if(status)status.textContent="Availability check failed";
   }
  }
  function updateURL(){const u=new URL(location.href);u.searchParams.set("ep",ep);u.searchParams.set("mode",mode);u.searchParams.set("provider",provider);if(malId)u.searchParams.set("mal",malId);history.replaceState({},"",u)}
  function episodeList(){
   const n=$("#episode-list"),len=Math.min(availableEpisodeCount||0,2000),filter=$("#episode-search")?.value.trim()||"";
   const paged=len>=100;
   const pageSize=100;
   const pageCount=Math.ceil(len/pageSize);
   let page=Math.min(pageCount-1,Math.max(0,Math.floor((ep-1)/pageSize)));
   if(filter&&paged){
    const matches=Array.from({length:len},(_,i)=>i+1).filter(x=>String(x).includes(filter));
    const ranges=[...new Set(matches.map(x=>Math.floor((x-1)/pageSize)))];
    page=ranges.length?ranges[0]:page;
   }
   if(paged){
    const rangeStart=page*pageSize+1,rangeEnd=Math.min(len,rangeStart+pageSize-1);
    n.innerHTML='<div class="episode-grid-toolbar"><span class="episode-grid-icon">☷</span><label class="episode-range-label" for="episode-range">EPS: <select id="episode-range">'+Array.from({length:pageCount},(_,i)=>'<option value="'+i+'" '+(i===page?'selected':'')+'>'+String(i*pageSize+1).padStart(3,"0")+'-'+Math.min(len,(i+1)*pageSize)+'</option>').join("")+'</select></label><span class="episode-grid-search-icon">⌕</span></div><div class="episode-number-grid">'+Array.from({length:rangeEnd-rangeStart+1},(_,i)=>rangeStart+i).filter(x=>!filter||String(x).includes(filter)).map(x=>'<button class="episode-number-tile '+(x===ep?'active':'')+'" data-ep="'+x+'">'+x+'</button>').join("")+'</div>'||"";
    const sel=$("#episode-range",n);
    sel.addEventListener("change",()=>{const start=Number(sel.value)*pageSize+1;setEpisode(start)});
   }else{
    n.innerHTML=len===0?'<p class="episode-empty">No episodes have aired yet.</p>':Array.from({length:len},(_,i)=>i+1).filter(x=>!filter||String(x).includes(filter)).map(x=>'<button class="episode-row reference-episode-row '+(x===ep?"active":"")+'" data-ep="'+x+'"><span class="episode-number">'+x+'</span><span class="episode-name">Episode '+x+'</span><span class="episode-play">▶</span></button>').join("")||'<p class="episode-empty">No matching episode.</p>';
   }
   $$("[data-ep]",n).forEach(b=>b.addEventListener("click",()=>setEpisode(Number(b.dataset.ep))));
  }
  let fallbackAttempted=false,anilistStreamAttempted=false,frameLoadTimer=null;
  let loadVersion=0;
  async function load(){
   checkEpisodeAvailability();
   const version=++loadVersion;
   if(provider==="megaplay"&&mode==="hsub")mode="sub";
   if(frameLoadTimer){clearTimeout(frameLoadTimer);frameLoadTimer=null}
   // Check MAL-ID availability before embedding ZokoAnime. Its internal 404 page still fires iframe load,
   // so iframe load/error events alone cannot reliably detect a missing episode.
   if(provider==="zokoanime"&&useMalIds&&!metadataFromMal&&malId>0&&id>0&&id!==malId){
    try{
     const check=await fetch("/api/provider-availability?id="+encodeURIComponent(id)+"&mal="+encodeURIComponent(malId)+"&ep="+encodeURIComponent(ep)+"&mode="+encodeURIComponent(mode));
     const data=check.ok?await check.json():null;
     if(version!==loadVersion)return;
     const zoko=(data?.providers||[]).find(x=>x.provider==="zokoanime");
     if(zoko&&!zoko.available){
      fallbackAttempted=true;useMalIds=false;
      toast("MAL ID has no stream for this episode. Trying AniList ID…");
      return load();
     }
    }catch{}
   }
   if(version!==loadVersion)return;
   const src=streamURL(provider,id,ep,mode,malId,useMalIds)+"?color=a78bfa";
   const frame=document.createElement("iframe");
   frame.src=src;frame.title=animeTitle+" episode "+ep;
   frame.allow="autoplay; fullscreen; picture-in-picture";if(provider==="zokoanime")frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock allow-pointer-lock allow-popups");
   frame.loading="eager";frame.referrerPolicy="strict-origin-when-cross-origin";
   frame.addEventListener("error",()=>handleStreamFailure());
   frame.addEventListener("load",()=>{if(frameLoadTimer){clearTimeout(frameLoadTimer);frameLoadTimer=null}});
   $("#video-frame-wrap").replaceChildren(frame);
   frameLoadTimer=setTimeout(()=>{if(!frame.isConnected)return;handleStreamFailure()},5500);
   $("#server-note-title").textContent="You are watching Episode "+ep;
   $$("[data-provider]").forEach(b=>b.classList.toggle("active",b.dataset.provider===provider&&b.dataset.mode===mode));
   episodeList();updateURL();record(a,ep);
  }
  function handleStreamFailure(){
   if(provider!=="zokoanime"||fallbackAttempted)return;
   if(useMalIds&&!metadataFromMal&&malId>0&&id>0&&id!==malId){
    fallbackAttempted=true;
    useMalIds=false;
    toast("MAL ID playback failed. Trying the AniList ID…");
    load();
    return;
   }
   fallbackAttempted=true;
   toast("ZokoAnime could not load this episode with the available IDs. Try another episode or select MegaPlay manually.");
  }
  function setEpisode(n){if(Number.isInteger(n)&&n>=1&&n<=availableEpisodeCount){ep=n;fallbackAttempted=false;useMalIds=metadataFromMal||malId>0;load()}}
  $("#episode-search").addEventListener("input",episodeList);
  $("#prev-text").addEventListener("click",()=>setEpisode(ep-1));$("#next-text").addEventListener("click",()=>setEpisode(ep+1));
  $$("[data-provider]").forEach(b=>b.addEventListener("click",()=>{provider=b.dataset.provider;mode=b.dataset.mode;fallbackAttempted=false;useMalIds=metadataFromMal||malId>0;load()}));
  if(metadataFromMal){$("#save-watch").hidden=true;}else $("#save-watch").addEventListener("click",()=>{const saved=toggleSaved(id);$("#save-watch").textContent=saved?"✓ Added to List":"＋ Add to List";toast(saved?"Added to watchlist":"Removed from watchlist")});
  let lightOn=true,autoPlay=true,autoNext=false,skipIntro=false;
  function toggleSetting(id,label,get,set){const b=$("#"+id);b.addEventListener("click",()=>{set(!get());b.innerHTML=label+' <strong>'+(get()?"On":"Off")+'</strong>';if(id==="light-toggle"||id==="toggle-light")document.body.classList.toggle("watch-lights-off",!get())})}
  toggleSetting("light-toggle","💡 Light",()=>lightOn,v=>lightOn=v);
  toggleSetting("autoplay-toggle","Auto Play",()=>autoPlay,v=>autoPlay=v);
  toggleSetting("autonext-toggle","Auto Next",()=>autoNext,v=>autoNext=v);
  toggleSetting("skipintro-toggle","Auto Skip Intro",()=>skipIntro,v=>skipIntro=v);
  $("#report-player").addEventListener("click",()=>toast("If playback fails, switch server or audio mode."));
  $("#more-description").addEventListener("click",()=>{const p=$("#more-description").parentElement;p.innerHTML=esc(description)+' <button class="inline-more" id="less-description">− Less</button>';$("#less-description").addEventListener("click",()=>location.reload())});
  if(a.status==="RELEASING"&&a.nextAiringEpisode&&Number(a.nextAiringEpisode.airingAt)*1000>Date.now()){
   const airingAt=Number(a.nextAiringEpisode.airingAt)*1000,dateEl=$("#airing-date"),countdownEl=$("#airing-countdown"),close=$("#airing-notice-close"),notice=$("#airing-notice");
   const dateText=new Date(airingAt).toLocaleString(undefined,{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",timeZoneName:"short"});
   if(dateEl)dateEl.textContent=dateText;
   const tick=()=>{if(!countdownEl||!notice)return;const ms=airingAt-Date.now();if(ms<=0){notice.remove();return}const days=Math.floor(ms/86400000),hours=Math.floor(ms%86400000/3600000),minutes=Math.floor(ms%3600000/60000),seconds=Math.floor(ms%60000/1000);countdownEl.textContent=' ('+(days?days+' days, ':'')+hours+' hours, '+minutes+' minutes, '+seconds+' seconds)';};
   tick();const airingTimer=setInterval(()=>{if(!document.getElementById("airing-countdown")){clearInterval(airingTimer);return}tick()},1000);
   close?.addEventListener("click",()=>{notice.remove();clearInterval(airingTimer)});
  }
  load();checkEpisodeAvailability();
 }catch(e){box.innerHTML='<div class="error-state"><h2>Could not open this anime</h2><p>'+esc(e.message)+'</p><a href="/search.html">Back to discovery</a></div>'}
}
async function library(type){const n=type==="watchlist"?$("#library-results"):$("#history-results");if(type==="history"){$("#clear-history")?.addEventListener("click",()=>{if(confirm("Clear history on this device?")){write(K.h,[]);drawHistory(n,[])}});drawHistory(n,read(K.h));window.addEventListener("aniscroll:cloud-library-synced",()=>drawHistory(n,read(K.h)));return}let filter="all";async function render(){const all=watchlist(),items=filter==="all"?all:all.filter(x=>x.status===filter);if(!items.length){n.innerHTML='<div class="empty-state"><span>♡</span><h2>Your watchlist starts here</h2><p>Save anime from any poster preview to build your collection.</p><a class="button button-primary" href="/search.html">Discover anime</a></div>';return}try{const aa=await getAnimeByIds(items.map(x=>x.id)),m=new Map(aa.map(x=>[x.id,x]));n.innerHTML=items.map(x=>{const a=m.get(Number(x.id));if(!a)return"";return'<article class="poster-card"><a class="poster-cover" href="/watch.html?id='+a.id+'"><img src="'+esc(cover(a))+'" alt="'+esc(title(a))+'"><span class="poster-score">★ '+score(a)+'</span></a><a class="poster-title" href="/watch.html?id='+a.id+'">'+esc(title(a))+'</a><div class="poster-meta">'+esc(meta(a))+'</div><label class="field" style="margin-top:8px"><span>List status</span><select class="control-select list-status" data-id="'+a.id+'" style="width:100%;max-width:none"><option value="watching" '+(x.status==="watching"?"selected":"")+'>Watching</option><option value="planned" '+(x.status==="planned"?"selected":"")+'>Plan to watch</option><option value="completed" '+(x.status==="completed"?"selected":"")+'>Completed</option><option value="dropped" '+(x.status==="dropped"?"selected":"")+'>Dropped</option></select></label><button class="button button-quiet button-small remove-saved" data-id="'+a.id+'" style="margin-top:8px;width:100%">Remove</button></article>'}).join("");$$(".list-status",n).forEach(s=>s.addEventListener("change",()=>{const l=watchlist(),it=l.find(x=>Number(x.id)===Number(s.dataset.id));if(it)it.status=s.value;write(K.w,l);toast("Watchlist updated");if(filter!=="all")render()}));$$(".remove-saved",n).forEach(b=>b.addEventListener("click",()=>{write(K.w,watchlist().filter(x=>Number(x.id)!==Number(b.dataset.id)));render();toast("Removed from watchlist")}))}catch(e){n.innerHTML='<div class="empty-state"><p>'+esc(e.message)+'</p></div>'}}window.addEventListener("aniscroll:cloud-library-synced",()=>void render());$(".library-tab").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.list;$(".library-tab").forEach(x=>x.classList.toggle("active",x===b));render()}));await render()}
async function genresPage(){const gs=["Action","Adventure","Comedy","Drama","Fantasy","Horror","Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"];$("#genre-directory").innerHTML=gs.map(g=>'<a class="genre-tile" href="/search.html?genre='+encodeURIComponent(g)+'">'+esc(g)+' <span>↗</span></a>').join("");try{draw($("#genre-featured"),await getAnimeList("TRENDING",6))}catch(e){$("#genre-featured").innerHTML='<div class="empty-state"><p>'+esc(e.message)+'</p></div>'}}
async function schedulePage(){
 const list=$("#schedule-list"),tabs=$("#schedule-day-tabs"),range=$("#schedule-range"),clock=$("#schedule-clock"),week=$("#schedule-week");
 let items=[],activeDay=0,mode="all";
 const now=new Date(),startDay=new Date(now);startDay.setHours(0,0,0,0);
 if(week)week.textContent=startDay.toLocaleDateString(undefined,{month:"short",day:"numeric"})+" – "+new Date(startDay.getTime()+6*86400000).toLocaleDateString(undefined,{month:"short",day:"numeric"})+" · your timezone";
 const updateClock=()=>{if(clock)clock.textContent=new Date().toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"});};
 updateClock();setInterval(updateClock,1000);
 const dayKey=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x.getTime()};
 function renderTabs(){
  const days=Array.from({length:7},(_,i)=>{const d=new Date(startDay);d.setDate(d.getDate()+i);return d});
  tabs.innerHTML=days.map((d,i)=>{const count=items.filter(x=>dayKey(new Date(x.airingAt*1000))===dayKey(d)).length;return '<button class="schedule-day-tab '+(i===activeDay?'active':'')+'" data-day="'+i+'"><span class="schedule-tab-date">'+d.toLocaleDateString(undefined,{day:"2-digit",month:"short"}).toUpperCase()+'</span><strong>'+d.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase()+'</strong><small>'+(count?count+' eps':'—')+'</small></button>'}).join("");
  $$(".schedule-day-tab",tabs).forEach(b=>b.addEventListener("click",()=>{activeDay=Number(b.dataset.day);renderTabs();renderList()}));
 }
 function renderList(){
  const day=new Date(startDay);day.setDate(day.getDate()+activeDay);
  const dayItems=items.filter(x=>dayKey(new Date(x.airingAt*1000))===dayKey(day));
  range.textContent=day.toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"})+" · "+dayItems.length+" episodes";
  const filtered=mode==="all"?dayItems:dayItems;
  if(!filtered.length){list.innerHTML='<div class="schedule-empty"><h2>No episodes scheduled</h2><p>AniList has no upcoming episode times for this day.</p></div>';return}
  list.innerHTML='<div class="schedule-now-marker"><span>'+new Date().toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})+'</span><i></i><strong>YOUR TIME</strong></div>'+filtered.map(x=>{const d=new Date(x.airingAt*1000),isNext=x.airingAt*1000>Date.now();return '<article class="schedule-episode-card"><time class="schedule-time-column"><strong>'+d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})+'</strong><small>'+d.toLocaleTimeString(undefined,{hour:"2-digit",hour12:true}).replace(/[0-9: ]/g,"")+'</small></time><a class="schedule-poster" href="/watch.html?id='+Number(x.media.id)+'&ep='+Number(x.episode)+'"><img loading="lazy" src="'+esc(x.media.coverImage?.large||x.media.coverImage?.extraLarge||"")+'" alt="'+esc(title(x.media))+'"></a><div class="schedule-card-info"><a class="schedule-title" href="/watch.html?id='+Number(x.media.id)+'&ep='+Number(x.episode)+'">'+esc(title(x.media))+'</a><div class="schedule-card-meta"><span>SUB</span><span>Episode '+Number(x.episode)+'</span><span>'+esc(x.media.format||"ANIME")+'</span></div><p>'+esc((x.media.description||"Upcoming episode release.").replace(/<[^>]*>/g," ").slice(0,155))+(x.media.description?.length>155?"…":"")+'</p><div class="schedule-tags">'+(x.media.genres||[]).slice(0,3).map(g=>'<span>'+esc(g)+'</span>').join("")+'</div></div><div class="schedule-countdown">'+(isNext?'IN '+(()=>{const m=Math.max(0,Math.floor((x.airingAt*1000-Date.now())/60000));return m>=60?Math.floor(m/60)+'H '+m%60+'M':m+'M'})():"AIRING")+'</div></article>'}).join("");
 }
 $$(".schedule-mode-tabs button").forEach(b=>b.addEventListener("click",()=>{$$(".schedule-mode-tabs button").forEach(x=>x.classList.toggle("active",x===b));mode=b.dataset.scheduleMode;renderList()}));
 const load=async()=>{list.innerHTML='<div class="loading-panel"></div>';try{items=(await getSchedule(7)).filter(x=>x.airingAt*1000>=startDay.getTime()&&x.airingAt*1000<startDay.getTime()+7*86400000);items.sort((a,b)=>a.airingAt-b.airingAt);if(!items.length){range.textContent="No upcoming episodes";tabs.innerHTML="";list.innerHTML='<div class="schedule-empty"><h2>No schedule data</h2><p>AniList has no upcoming episodes for this week.</p></div>';return}renderTabs();renderList()}catch(e){list.innerHTML='<div class="schedule-empty"><h2>Schedule unavailable</h2><p>'+esc(e.message)+'</p></div>'}};
 $("#refresh-schedule")?.addEventListener("click",load);await load();
}

header();footer();const page=document.body.dataset.page;if(page==="home")home();if(page==="search")searchPage();if(page==="anime")animePage();if(page==="watch")watchPage();if(page==="watchlist")library("watchlist");if(page==="history")library("history");if(page==="schedule")schedulePage();
