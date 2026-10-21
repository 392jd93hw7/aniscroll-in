import {getClerk} from "./clerk-client.js";
const root=document.getElementById("auth-mount"),status=document.getElementById("auth-status"),mode=document.body.dataset.authMode||"signin";
function message(s,error=false){if(!status)return;status.textContent=s;status.classList.toggle("error",error)}
function returnUrl(){const p=new URLSearchParams(location.search),v=p.get("redirect_url")||p.get("returnTo")||"/index.html";return v.startsWith("/")&&!v.startsWith("//")?v:"/index.html"}
async function initializeAuthPage(){
  try{
    if(!root)throw Error("Authentication mount point is missing.");
    if(!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY){message("Clerk is not configured yet. Add VITE_CLERK_PUBLISHABLE_KEY to your local .env and deployment environment, then restart the app.",true);return}
    const c=await getClerk();
    if(!c)throw Error("Clerk could not be initialized.");
    root.replaceChildren();
    const redirect=returnUrl();
    if(mode==="signup")c.mountSignUp(root,{signInUrl:"/signin.html",fallbackRedirectUrl:redirect});
    else if(mode==="profile"&&c.isSignedIn)c.mountUserProfile(root);
    else if(mode==="profile"){message("Sign in to manage your Aniscroll account.");c.mountSignIn(root,{signUpUrl:"/signup.html",fallbackRedirectUrl:"/profile.html"})}
    else c.mountSignIn(root,{signUpUrl:"/signup.html",fallbackRedirectUrl:redirect});
    if(status&&(mode!=="profile"||c.isSignedIn))status.hidden=true;
  }catch(e){message(e?.message||"Authentication could not be loaded. Check your Clerk dashboard settings.",true)}
}
void initializeAuthPage();
