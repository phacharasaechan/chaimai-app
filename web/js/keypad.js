/* ChaiMai — custom numeric keypad. Loaded after app.js.
   Inputs marked data-num use inputmode="none" (no system keyboard); this pad edits them instead.
   Pad is shown on touch devices only, so desktop keeps normal typing. */
(function(){
var pad=document.getElementById('keypad');
if(!pad) return;
var touch=window.matchMedia('(pointer: coarse)').matches;
var fields=[].slice.call(document.querySelectorAll('input[data-num]'));
var active=null, hideTimer=null;

/* Always keep numeric fields clean (covers hardware keyboards and paste). */
function clean(v){
  v=v.replace(/[^0-9.]/g,'');
  var i=v.indexOf('.');
  if(i!==-1) v=v.slice(0,i+1)+v.slice(i+1).replace(/\./g,'');
  return v.slice(0,12);
}
fields.forEach(function(f){
  f.addEventListener('input',function(){
    var c=clean(f.value);
    if(c!==f.value){ var p=f.selectionStart-(f.value.length-c.length); f.value=c; try{ f.setSelectionRange(p,p); }catch(e){} }
  });
});
if(!touch) return;

function visibleFields(form){
  return fields.filter(function(f){ return f.form===form && f.offsetParent!==null; });
}
function updateGo(){
  var list=visibleFields(active.form), last=list.indexOf(active)===list.length-1;
  document.getElementById('kpNext').hidden=last;
  document.getElementById('kpDone').hidden=!last;
}
function isOpen(){ return pad.classList.contains('open'); }
function show(){
  clearTimeout(hideTimer);
  document.documentElement.style.setProperty('--kp-h',pad.offsetHeight+'px');
  pad.classList.add('open'); pad.setAttribute('aria-hidden','false');
  document.body.classList.add('kp-open');           /* page bottom padding eases in with the pad */
  if(active) setTimeout(function(){ if(active) active.scrollIntoView({block:'center',behavior:'smooth'}); },30);
}
function hide(){
  active=null;
  pad.classList.remove('open'); pad.setAttribute('aria-hidden','true');   /* pad slides back down */
  document.body.classList.remove('kp-open');                              /* page padding eases back */
}

fields.forEach(function(f){
  f.addEventListener('focus',function(){ active=f; updateGo(); show(); });
  f.addEventListener('blur',function(){
    hideTimer=setTimeout(function(){
      if(!document.activeElement || !document.activeElement.hasAttribute('data-num')) hide();
    },120);
  });
});

function press(k){
  if(!active) return;
  var v=active.value, s=active.selectionStart, e=active.selectionEnd;
  if(s==null){ s=e=v.length; }
  if(k==='del'){
    if(s!==e){ v=v.slice(0,s)+v.slice(e); e=s; }
    else if(s>0){ v=v.slice(0,s-1)+v.slice(s); s--; e=s; }
  } else {
    if(k==='.' && v.slice(0,s).concat(v.slice(e)).indexOf('.')!==-1) return;
    var ins=(k==='.' && (s===0 || (s===e && v.slice(0,s)===''))) ? '0.' : k;
    var nv=v.slice(0,s)+ins+v.slice(e);
    if(nv.length>12) return;
    v=nv; s=e=s+ins.length;
  }
  active.value=v;
  try{ active.setSelectionRange(s,s); }catch(_){}
  active.dispatchEvent(new Event('input',{bubbles:true}));
  if(navigator.vibrate) try{ navigator.vibrate(6); }catch(_){}
}

/* pointerdown + preventDefault keeps focus on the input while tapping keys */
pad.addEventListener('pointerdown',function(ev){
  var b=ev.target.closest('.kp-key'); if(!b) return;
  ev.preventDefault();
  var k=b.getAttribute('data-k');
  if(k==='next'){
    var list=visibleFields(active.form), i=list.indexOf(active);
    if(i<list.length-1) list[i+1].focus(); else { active.blur(); hide(); }
    return;
  }
  press(k);
  if(k==='del') startRepeat(k,b);
});
var rep=null;
function startRepeat(k,b){
  stopRepeat();
  rep=setTimeout(function(){ rep=setInterval(function(){ press(k); },70); },380);
}
function stopRepeat(){ clearTimeout(rep); clearInterval(rep); rep=null; }
['pointerup','pointercancel','pointerleave'].forEach(function(n){ pad.addEventListener(n,stopRepeat); });

/* tap outside fields + pad closes it; tab change closes it */
document.addEventListener('pointerdown',function(ev){
  if(!isOpen()) return;
  if(pad.contains(ev.target) || ev.target.closest('.tf')) return;
  if(active) active.blur();
  hide();
});
document.querySelectorAll('.tab').forEach(function(t){ t.addEventListener('click',hide); });
window.addEventListener('hashchange',hide);
})();
