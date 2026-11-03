/* ChaiMai — sliding tab highlight. Loaded after app.js.
   One bar moves between tabs (instead of an underline appearing under each). It follows aria-selected,
   so it also covers deep links, Back, and language changes that resize the labels. */
(function(){
var tabs=document.querySelector('.tabs');
if(!tabs) return;
var ind=document.createElement('span');
ind.className='tab-ind'; ind.setAttribute('aria-hidden','true');
tabs.appendChild(ind);

function place(animate){
  var label=tabs.querySelector('.tab[aria-selected="true"] span');
  if(!label) return;
  var t=tabs.getBoundingClientRect(), r=label.getBoundingClientRect();
  if(!animate) ind.style.transition='none';
  ind.style.width=r.width+'px';
  ind.style.transform='translateX('+(r.left-t.left)+'px)';
  if(!animate){ void ind.offsetWidth; ind.style.transition=''; }
}
place(false);

new MutationObserver(function(){ place(true); })
  .observe(tabs,{attributes:true,attributeFilter:['aria-selected'],subtree:true});

/* label width changes (EN <-> ไทย, fonts loading, rotation): snap, don't slide */
if(window.ResizeObserver){
  var ro=new ResizeObserver(function(){ place(false); });
  ro.observe(tabs);
  tabs.querySelectorAll('.tab span').forEach(function(s){ ro.observe(s); });
}
if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ place(false); });
})();
