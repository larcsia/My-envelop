import { db } from './firebase.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const CLOUDINARY_CLOUD_NAME = 'ekhncdna';
const CLOUDINARY_UPLOAD_PRESET = 'My envelop'; 

const $=id=>document.getElementById(id);
const DEF={to:'',msg:'',media:'',envc:'#2c2c2e',letc:'#f5f5f7',txtc:'#1d1d1f',sealc:'#c97b84',sst:1,ssl:1,stx:75,sty:5,stp:'',ms:70,ma:'center',mp:'below'};
const STAMP='https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=100&auto=format&fit=crop';
const envelope=$('envelope');
const up={media:null,stamp:null};

const safeURL=u=>{try{const x=new URL((u||'').trim());return /^https?:$/.test(x.protocol)?x:null}catch{return null}};
const imgSrc=u=>/^(blob:|data:image\/(jpeg|png|gif|webp);base64,)/.test(u||'')?u:safeURL(u)?.href;
const hex=(v,d)=>/^#[0-9a-f]{6}$/i.test(v)?v:d;
const seg=id=>document.querySelector('#'+id+' .on').dataset.v;

function mediaEl(raw,size){
  if(/^(blob:|data:image\/(jpeg|png|gif|webp);base64,)/.test(raw||'')){const i=document.createElement('img');i.src=raw;i.alt='';i.style.width=size+'%';return i}
  const x=safeURL(raw); if(!x) return null;
  const u=x.href,h=x.hostname.replace(/^www\./,''),p=x.pathname;
  const frame=(src,ht)=>{const f=document.createElement('iframe');f.src=src;f.height=ht;f.loading='lazy';f.allowFullscreen=true;
    f.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';f.style.border=0;return f};
  let el;
  if(/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(p)||h==='images.unsplash.com'||h==='i.imgur.com'){
    el=document.createElement('img');el.src=u;el.alt='';el.loading='lazy';
  }else if(h==='giphy.com'&&/^\/gifs\//.test(p)&&/^\w+$/.test(p.split('-').pop())){
    el=document.createElement('img');el.src='https://i.giphy.com/media/'+p.split('-').pop()+'/giphy.gif';el.alt='';el.loading='lazy';
  }else if(h==='youtu.be'||h.endsWith('youtube.com')){
    const id=h==='youtu.be'?p.slice(1):(x.searchParams.get('v')||p.split('/')[2]||'');
    if(/^[\w-]{6,15}$/.test(id)) el=frame('https://www.youtube.com/embed/'+id,Math.round(size*2));
    if(el) el.style.aspectRatio='16/9',el.removeAttribute('height'),el.style.height='auto';
  }else if(h==='open.spotify.com'){
    const q=p.replace(/^\/intl-\w+/,'');
    if(/^\/(track|album|playlist|episode|show|artist)\/\w+$/.test(q)) el=frame('https://open.spotify.com/embed'+q,152);
  }else if(h==='music.apple.com'){
    el=frame('https://embed.music.apple.com'+p+x.search,175);
  }else if(/\.(mp3|wav|ogg|m4a|aac)$/i.test(p)){
    el=document.createElement('audio');el.controls=true;el.src=u;
  }else if(/\.(mp4|webm|mov)$/i.test(p)){
    el=document.createElement('video');el.controls=true;el.playsInline=true;el.src=u;
  }
  if(!el){el=document.createElement('a');el.href=u;el.target='_blank';el.rel='noopener noreferrer';el.textContent='Open attachment ↗';return el}
  el.style.width=size+'%';
  return el;
}

function apply(s){
  const r=document.documentElement.style,L=$('letter');
  r.setProperty('--env-color',hex(s.envc,DEF.envc));
  r.setProperty('--seal-color',hex(s.sealc,DEF.sealc));
  L.style.background=$('paper').style.background=hex(s.letc,DEF.letc);
  L.style.color=hex(s.txtc,DEF.txtc);
  $('letterTo').textContent=s.to||'Dear Friend,';
  $('letterMsg').textContent=s.msg||'Your secret message...';
  const size=Math.min(100,Math.max(10,+s.ms||70)),box=$('letterMedia');
  box.replaceChildren();
  const el=mediaEl(s.media,size); if(el) box.append(el);
  box.style.justifyContent={left:'flex-start',right:'flex-end'}[s.ma]||'center';
  box.style.order=s.mp==='above'?2:4;
  const st=$('stamp');
  st.style.display=+s.sst?'flex':'none';
  st.style.left=(+s.stx||0)+'%';st.style.top=(+s.sty||0)+'%';
  const sp=imgSrc(s.stp)||STAMP;
  if($('stampImg').getAttribute('src')!==sp) $('stampImg').src=sp;
  $('waxSeal').style.display=+s.ssl?'block':'none';
}

function getState(){
  return{to:$('to').value,msg:$('msg').value,media:up.media?up.media.preview:$('media').value,envc:$('envc').value,letc:$('letc').value,txtc:$('txtc').value,
    sealc:$('sealc').value,sst:+$('sst').checked,ssl:+$('ssl').checked,stx:$('stx').value,sty:$('sty').value,stp:up.stamp?up.stamp.preview:$('stp').value,
    ms:$('ms').value,ma:seg('ma'),mp:seg('mp')};
}

function update(){
  const s=getState();
  $('msVal').textContent=s.ms+'%';$('stxVal').textContent=s.stx+'%';$('styVal').textContent=s.sty+'%';
  apply(s);
}

function setOpen(o){
  envelope.classList.toggle('open',o);document.body.classList.toggle('opened',o);
  document.documentElement.style.overflow=o?'hidden':'';
  $('letter').setAttribute('aria-hidden',!o);
  if(o)$('letter').scrollTop=0;
  if(document.body.classList.contains('view'))$('subTitle').textContent=o?'Tap the letter to close it.':'Tap the envelope to open it.';
}

const flip=()=>setOpen(!envelope.classList.contains('open'));
envelope.addEventListener('click',flip);
envelope.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
$('letter').addEventListener('click',e=>{if(!e.target.closest('audio,video,iframe,a'))setOpen(false)});
$('backdrop').addEventListener('click',()=>setOpen(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

let tt;
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('show'),3500)}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if(data.error) {
            console.error('Cloudinary Error:', data.error.message);
            toast('Cloudinary Error: ' + data.error.message);
            return null;
        }
        return data.secure_url;
    } catch (err) {
        console.error('Upload failed:', err);
        toast('Network error uploading photo.');
        return null;
    }
}

async function buildLink(){
  const s = getState();
  if(!s.msg.trim() && !s.media.trim() && !up.media && !up.stamp) {
      toast('Write a message or add a photo/link first');
      return null;
  }

  toast('Saving...');

  if(up.media && up.media.file) {
      const url = await uploadToCloudinary(up.media.file);
      if(url) { s.media = url; } 
      else { return null; }
  }

  if(up.stamp && up.stamp.file) {
      const url = await uploadToCloudinary(up.stamp.file);
      if(url) { s.stp = url; } 
      else { return null; }
  }

  try {
      const docRef = await addDoc(collection(db, "envelopes"), s);
      const baseUrl = location.href.split('?')[0].split('#')[0];
      return baseUrl + '?id=' + docRef.id;
  } catch (e) {
      console.error("Firebase Error: ", e);
      toast('Firebase Error: ' + e.message);
      return null;
  }
}

async function copy(t){
  try{await navigator.clipboard.writeText(t);return true}catch{
    const a=document.createElement('textarea');a.value=t;a.style.position='fixed';a.style.opacity=0;document.body.append(a);a.select();
    let ok=false;try{ok=document.execCommand('copy')}catch{}a.remove();return ok}
}

$('copyBtn').onclick=async()=>{
    const l = await buildLink();
    if(!l)return;
    (await copy(l)) ? toast('Link copied ✓') : prompt('Copy this link:', l);
};

if(navigator.share){
  $('shareBtn').hidden=false;
  $('shareBtn').onclick=async()=>{
      const baseUrl = window.location.href.split('?')[0].split('#')[0];
      try{
          await navigator.share({
              title: 'My Envelop', 
              text: 'Create and send your own personalized digital envelopes!', 
              url: baseUrl
          });
      }catch(err){}
  };
}

const FLD={media:'media',stamp:'stp'};
const readData=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});

function clearUp(k){
  up[k]=null;$(k+'Name').textContent='';$(k+'Clear').hidden=true;
}

async function pick(k,file){
  if(!file)return;
  toast('Loading photo…');
  try{
    const raw=await readData(file);
    up[k] = { file: file, preview: raw };
    $(FLD[k]).value='';
    $(k+'Name').textContent=file.name||'Photo';
    $(k+'Clear').hidden=false;
    update();
    toast('Photo ready ✓');
  }catch(err){
    toast('Could not load this photo');
  }finally{
    $(k+'File').value='';
  }
}

for(const k of ['media','stamp']){
  $(k+'File').addEventListener('change',e=>pick(k,e.target.files[0]));
  $(k+'Clear').addEventListener('click',()=>{clearUp(k);update()});
  $(FLD[k]).addEventListener('input',()=>{if(up[k])clearUp(k)});
}

document.querySelectorAll('.panel input,.panel textarea').forEach(e=>e.addEventListener('input',update));
document.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{
  b.parentElement.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));update()}));

(()=>{
  if(matchMedia('(pointer:coarse)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  let target=scrollY,cur=scrollY,raf=0;
  const max=()=>document.documentElement.scrollHeight-innerHeight;
  const loop=()=>{cur+=(target-cur)*.11;if(Math.abs(target-cur)<.4){cur=target;raf=0}else raf=requestAnimationFrame(loop);scrollTo({top:cur,behavior:'instant'})};
  addEventListener('wheel',e=>{
    if(e.ctrlKey||document.body.classList.contains('opened')||e.target.closest('textarea'))return;
    e.preventDefault();
    target=Math.max(0,Math.min(max(),target+e.deltaY*(e.deltaMode===1?32:1)));
    if(!raf)raf=requestAnimationFrame(loop);
  },{passive:false});
  addEventListener('scroll',()=>{if(!raf)cur=target=scrollY},{passive:true});
})();

async function init() {
    try {
        const auth = getAuth();
        await signInAnonymously(auth);
        console.log("Logged in anonymously to Firebase");
    } catch (error) {
        console.error("Auth Error: ", error);
        toast("Auth Error: " + error.message);
    }

    const P = new URLSearchParams(location.search);
    const id = P.get('id');
    const view = P.get('view');
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const layout = document.getElementById('layout');

    if (id) {
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (layout) {
            layout.style.display = 'grid';
            layout.classList.remove('edit');
        }
        document.body.classList.add('view');
        $('mainTitle').textContent = "You've got a secret message.";
        $('subTitle').textContent = 'Tap the envelope to open it.';
        
        try {
            const docSnap = await getDoc(doc(db, "envelopes", id));
            if (docSnap.exists()) {
                apply(docSnap.data());
            } else {
                $('subTitle').textContent = 'Message not found.';
            }
        } catch(e) {
            console.error("Error loading", e);
            $('subTitle').textContent = 'Error loading message.';
        }
    } else if (view === 'create') {
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (layout) {
            layout.style.display = 'grid';
            layout.classList.add('edit');
        }
        document.body.classList.remove('view');
        $('mainTitle').textContent = "Create an Envelope.";
        $('subTitle').textContent = 'Customize below to preview.';
        update();
    } else {
        if (layout) layout.style.display = 'none';
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        document.body.classList.remove('view');
    }
}

document.getElementById('startBtn').addEventListener('click', () => {
    window.history.replaceState({}, '', '?view=create');
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('layout').style.display = 'grid';
    document.getElementById('layout').classList.add('edit');
    document.getElementById('mainTitle').textContent = "Create an Envelope.";
    document.getElementById('subTitle').textContent = 'Customize below to preview.';
    update();
});

init();
