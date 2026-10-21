import {getClerk} from "./clerk-client.js";
const root=document.getElementById("auth-mount"),status=document.getElementById("auth-status"),mode=document.body.dataset.authMode||"signin";
const authAppearance={
  variables:{
    colorPrimary:"#a78bfa",
    colorBackground:"#11131c",
    colorInputBackground:"#090a10",
    colorInputText:"#f4f5fa",
    colorText:"#f4f5fa",
    colorTextSecondary:"#9298aa",
    colorNeutral:"#b9b4c8",
    borderRadius:"12px",
    fontFamily:"DM Sans, system-ui, sans-serif"
  },
  elements:{
    rootBox:{width:"100%",maxWidth:"440px",margin:"0 auto"},
    card:{width:"100%",backgroundColor:"#11131c",border:"1px solid #ffffff12",boxShadow:"none",borderRadius:"14px"},
    headerTitle:{color:"#f4f5fa"},
    headerSubtitle:{color:"#9298aa"},
    formFieldLabel:{color:"#d9dbea"},
    formFieldInput:{backgroundColor:"#090a10",border:"1px solid #343746",color:"#f4f5fa",boxShadow:"none"},
    formButtonPrimary:{background:"linear-gradient(110deg,#a78bfa,#8b5cf6)",color:"#171126",boxShadow:"none"},
    socialButtonsBlockButton:{backgroundColor:"#171923",border:"1px solid #343746",color:"#f4f5fa",boxShadow:"none"},
    footer:{backgroundColor:"transparent"},
    footerActionLink:{color:"#d8b4fe"}
  }
};
function message(s,error=false){if(!status)return;status.textContent=s;status.classList.toggle("error",error)}
function returnUrl(){const p=new URLSearchParams(location.search),v=p.get("redirect_url")||p.get("returnTo")||"/index.html";return v.startsWith("/")&&!v.startsWith("//")?v:"/index.html"}
async function initializeAuthPage(){
  try{
    if(!root)throw Error("Authentication mount point is missing.");
    if(!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY){message("Clerk is not configured yet. Add VITE_CLERK_PUBLISHABLE_KEY to your local .env and deployment environment, then restart the app.",true);return}
    const c=await getClerk();
    if(!c)throw Error("Clerk could not be initialized.");
    root.replaceChildren();
    if(c.isSignedIn){message("You are already signed in. If you meant to use another account, sign out of Clerk first.");root.innerHTML='<div class="auth-already-signed-in"><p>You are already signed in to Aniscroll.</p><a class="button button-primary" href="/index.html">Continue to Aniscroll</a></div>';return}
    const redirect=returnUrl(),options={appearance:authAppearance};
    if(mode==="signup")c.mountSignUp(root,{...options,signInUrl:"/signin.html",fallbackRedirectUrl:redirect});
    else if(mode==="profile"&&c.isSignedIn)c.mountUserProfile(root,{...options});
    else if(mode==="profile"){message("Sign in to manage your Aniscroll account.");c.mountSignIn(root,{...options,signUpUrl:"/signup.html",fallbackRedirectUrl:"/profile.html"})}
    else c.mountSignIn(root,{...options,signUpUrl:"/signup.html",fallbackRedirectUrl:redirect});
    if(status&&(mode!=="profile"||c.isSignedIn))status.hidden=true;
  }catch(e){message(e?.message||"Authentication could not be loaded. Check your Clerk dashboard settings.",true)}
}
void initializeAuthPage();
