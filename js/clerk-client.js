import { Clerk } from "@clerk/clerk-js";
const WATCHLIST_KEY="aniscroll:watchlist:v1", HISTORY_KEY="aniscroll:history:v1", OWNER_KEY="aniscroll:cloud-library-owner";
const clerkAppearance={variables:{colorPrimary:"#a78bfa",colorBackground:"#11131c",colorInputBackground:"#090a10",colorInputText:"#f4f5fa",colorText:"#f4f5fa",colorTextSecondary:"#9298aa",colorNeutral:"#b9b4c8",borderRadius:"12px",fontFamily:"DM Sans, system-ui, sans-serif"},elements:{userButtonPopoverCard:{backgroundColor:"#11131c",border:"1px solid #343746",boxShadow:"0 20px 60px #0008"},userButtonPopoverActionButton:{color:"#f4f5fa"},userButtonPopoverActionButtonText:{color:"#f4f5fa"},userButtonPopoverActionButtonIcon:{color:"#b9b4c8"},userButtonPopoverFooter:{backgroundColor:"#11131c"},modalContent:{backgroundColor:"#11131c",color:"#f4f5fa"},navbar:{backgroundColor:"#11131c"},navbarButton:{color:"#d8b4fe"},profileSectionPrimaryButton:{background:"linear-gradient(110deg,#a78bfa,#8b5cf6)",color:"#171126"},formButtonPrimary:{background:"linear-gradient(110deg,#a78bfa,#8b5cf6)",color:"#171126"},formFieldInput:{backgroundColor:"#090a10",border:"1px solid #343746",color:"#f4f5fa"},card:{backgroundColor:"#11131c",border:"1px solid #343746",boxShadow:"none"}}};
let clerkPromise=null,clerkUiPromise=null,hydratePromise=null,hydratedUserId="",syncTimer=null,pendingCollections=new Map(),syncQueue=Promise.resolve();
async function loadClerkUI(key){if(window.__internal_ClerkUICtor)return window.__internal_ClerkUICtor;if(clerkUiPromise)return clerkUiPromise;clerkUiPromise=new Promise((resolve,reject)=>{let domain;try{domain=atob(key.split("_")[2]).slice(0,-1)}catch{reject(Error("Clerk publishable key is invalid."));return}const script=document.createElement("script");script.src="https://"+domain+"/npm/@clerk/ui@1/dist/ui.browser.js";script.async=true;script.crossOrigin="anonymous";script.onload=()=>window.__internal_ClerkUICtor?resolve(window.__internal_ClerkUICtor):reject(Error("Clerk UI bundle loaded without its UI constructor."));script.onerror=()=>reject(Error("Could not load Clerk's UI bundle. Check network access and the publishable key."));document.head.appendChild(script)}).catch(error=>{clerkUiPromise=null;throw error});return clerkUiPromise}
export async function getClerk(){const key=import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;if(!key)return null;if(clerkPromise)return clerkPromise;clerkPromise=(async()=>{const ClerkUI=await loadClerkUI(key);const c=new Clerk(key);await c.load({ui:{ClerkUI},appearance:clerkAppearance});c.addListener(()=>{if(c.isSignedIn&&c.user&&c.session)void hydrateCloudLibrary(c).catch(e=>console.warn("Aniscroll cloud sync:",e.message));else{if(localStorage.getItem(OWNER_KEY)){localStorage.removeItem(WATCHLIST_KEY);localStorage.removeItem(HISTORY_KEY);localStorage.removeItem(OWNER_KEY)}hydratedUserId="";hydratePromise=null}});if(c.isSignedIn&&c.user&&c.session)void hydrateCloudLibrary(c).catch(e=>console.warn("Aniscroll cloud sync:",e.message));return c})().catch(e=>{clerkPromise=null;throw e});return clerkPromise}
async function token(c){return c?.session?c.session.getToken():null}
function stored(k){try{const x=JSON.parse(localStorage.getItem(k)||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
function mergeWatchlist(remote,local){const m=new Map();for(const x of [...(Array.isArray(remote)?remote:[]),...(Array.isArray(local)?local:[])]){const id=Number(x?.id);if(Number.isSafeInteger(id)&&id>0)m.set(id,{...(m.get(id)||{}),...x})}return[...m.values()].slice(0,1000)}
function mergeHistory(remote,local){const m=new Map();for(const x of [...(Array.isArray(remote)?remote:[]),...(Array.isArray(local)?local:[])]){const id=Number(x?.id),ep=Number(x?.episode||1);if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(ep)||ep<1)continue;const k=id+":"+ep,o=m.get(k);if(!o||Number(x.watchedAt||0)>=Number(o.watchedAt||0))m.set(k,x)}return[...m.values()].sort((a,b)=>Number(b.watchedAt||0)-Number(a.watchedAt||0)).slice(0,60)}
async function request(c,method,body){const t=await token(c);if(!t)throw Error("No active Clerk session.");const r=await fetch("/api/account/library",{method,headers:{Authorization:"Bearer "+t,...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store"});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||"Cloud library request failed.");return j}
async function hydrateCloudLibrary(c){const uid=c.user?.id;if(!uid||!c.isSignedIn||hydratedUserId===uid)return;if(hydratePromise)return hydratePromise;hydratePromise=(async()=>{const cloud=await request(c,"GET"),owner=localStorage.getItem(OWNER_KEY),sameOwner=!owner||owner===uid,w=mergeWatchlist(cloud.watchlist,sameOwner?stored(WATCHLIST_KEY):[]),h=mergeHistory(cloud.history,sameOwner?stored(HISTORY_KEY):[]);localStorage.setItem(WATCHLIST_KEY,JSON.stringify(w));localStorage.setItem(HISTORY_KEY,JSON.stringify(h));localStorage.setItem(OWNER_KEY,uid);await request(c,"PUT",{collection:"watchlist",data:w});await request(c,"PUT",{collection:"history",data:h});hydratedUserId=uid;window.dispatchEvent(new CustomEvent("aniscroll:cloud-library-synced"))})().catch(e=>{hydratePromise=null;throw e});return hydratePromise}
export function syncLibraryWrite(key,value){const collection=key===WATCHLIST_KEY?"watchlist":key===HISTORY_KEY?"history":null;if(!collection)return;pendingCollections.set(collection,value);if(syncTimer)clearTimeout(syncTimer);syncTimer=setTimeout(()=>{syncTimer=null;const updates=[...pendingCollections.entries()];pendingCollections.clear();syncQueue=syncQueue.then(async()=>{const c=await getClerk();if(!c?.isSignedIn||!c.session)return;for(const[name,data]of updates)await request(c,"PUT",{collection:name,data})}).catch(e=>console.warn("Aniscroll cloud library write failed:",e.message))},450)}
export async function mountAuthNavigation(){
  const root=document.getElementById("auth-control");
  if(!root)return;
  const render=async()=>{
    try{
      const c=await getClerk();
      if(!c){root.dataset.mode="guest";root.innerHTML='<a class="button button-quiet button-small" href="/signin.html">Sign in</a><a class="button button-primary button-small" href="/signup.html">Sign up</a>';return}
      if(c.isSignedIn&&c.user&&c.session){
        if(root.dataset.mode==="signed")return;
        root.dataset.mode="signed";
        root.innerHTML='<div id="clerk-user-button" class="clerk-user-button" aria-label="Account menu"></div>';
        c.mountUserButton(root.querySelector("#clerk-user-button"),{appearance:clerkAppearance});
      }else{
        root.dataset.mode="guest";
        root.innerHTML='<a class="button button-quiet button-small" href="/signin.html">Sign in</a><a class="button button-primary button-small" href="/signup.html">Sign up</a>';
      }
    }catch(error){console.warn("Aniscroll account menu:",error.message)}
  };
  await render();
  const c=await getClerk();
  c?.addListener(()=>void render());
}
