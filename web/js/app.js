(function(){

function svg(p){ return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+p+'"/></svg>'; }
function $(id){ return document.getElementById(id); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

var currentLang='en', currentTab='usb';

/* ---------------- form scaffolding ---------------- */
var PLATFORMS=[['official','platOfficial'],['tiktokmall','platTikTokMall'],['shopee','platShopee'],['lazada','platLazada'],['tiktok','platTiktok'],['fb','platFb'],['physical','platPhysical'],['other','platOther']];
function fillPlatform(id,sel){
  $(id).innerHTML='<option value="" data-i18n="selectPrompt">Select</option>'+PLATFORMS.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+' data-i18n="'+o[1]+'"></option>'; }).join('');
}
fillPlatform('platformUsb','');
fillPlatform('platformPower','');

function buildChips(id,name,legend,opts,checked){
  var h='<legend data-i18n="'+legend+'"></legend><div class="chip-set">';
  opts.forEach(function(o){
    h+='<label class="chip"><input type="radio" name="'+name+'" value="'+o.v+'"'+(o.v===checked?' checked':'')+'><span class="chip-face">'+svg(P.check)+'<span'+(o.k?' data-i18n="'+o.k+'"':'')+'>'+(o.t||'')+'</span></span></label>';
  });
  $(id).innerHTML=h+'</div>';
}
var RATINGS=[{v:'unknown',k:'ratUnknown'},{v:'new',k:'ratNew'},{v:'low',k:'ratLow'},{v:'good',k:'ratGood'}];
buildChips('ratingUsbSet','ratingUsb','lblRating',RATINGS,'');
buildChips('ratingPowerSet','ratingPower','lblRating',RATINGS,'');
buildChips('stepsChargerSet','stepsCharger','lblSteps',[{v:'one',k:'stepsOne'},{v:'two',k:'stepsTwo'},{v:'many',k:'stepsMany'},{v:'unknown',k:'stepsUnknown'}],'');
buildChips('ratingChargerSet','ratingCharger','lblRating',RATINGS,'');
fillPlatform('platformCharger','');
buildChips('ifaceUsbSet','ifaceUsb','lblInterface',[{v:'usb2',t:'USB 2.0'},{v:'usb3',t:'USB 3.0 / 3.1 / 3.2'},{v:'typec',t:'USB-C'},{v:'dual',k:'ifaceDual'},{v:'unsure',k:'ifaceUnsure'}],'');
function radio(name){ var el=document.querySelector('input[name="'+name+'"]:checked'); return el?el.value:''; }

/* ---------------- verdict drawer ---------------- */
var PEEK=76;
function sheetHTML(k1,k2){
  return '<div class="pull" data-state="sealed" style="--p:0">'+
    '<div class="pull-clip">'+
      '<div class="pull-head"><span class="pull-ico" data-ico></span>'+
        '<div class="pull-ht"><div class="pull-title" data-i18n="verdictHead"></div><div class="pull-sub" data-sub></div></div>'+
        '</div>'+
      '<div class="pull-body" data-body aria-hidden="true">'+
        '<div class="vd"><span class="vd-ico" data-vico></span><div class="vd-text" data-vtext></div>'+
          '<div class="vd-score"><span class="vd-num" data-num></span><span class="vd-of">/100</span><div class="vd-lbl" data-i18n="riskLabel"></div></div></div>'+
        '<div class="stats"><div class="stat"><div class="lbl" data-i18n="'+k1+'"></div><div class="big" data-a></div></div>'+
          '<div class="stat"><div class="lbl" data-i18n="'+k2+'"></div><div class="big" data-b></div></div></div>'+
        '<div class="meter"><div class="fill" data-fill></div></div>'+
        '<ul class="findings" data-list></ul>'+
        '<p class="note" data-note></p>'+
      '</div>'+
    '</div>'+
    '<button type="button" class="pull-tab" data-tab aria-expanded="false">'+svg(P.chev)+'</button>'+
  '</div>';
}

function Sheet(mount,k1,k2){
  var self=this;
  mount.innerHTML=sheetHTML(k1,k2);
  this.root=mount.querySelector('.pull');
  var q=function(s){ return self.root.querySelector('['+s+']'); };
  this.clip=this.root.querySelector('.pull-clip');
  this.body=q('data-body'); this.tab=q('data-tab'); this.ico=q('data-ico');
  this.sub=q('data-sub'); this.vico=q('data-vico');
  this.vtext=q('data-vtext'); this.num=q('data-num'); this.a=q('data-a'); this.b=q('data-b');
  this.fill=q('data-fill'); this.list=q('data-list'); this.note=q('data-note');
  this.open=false; this.p=0; this.data=null; this.drag=null;
  this.root.classList.add('empty');

  this.ro=new ResizeObserver(function(){ if(!self.drag) self.render(self.p,false); });
  this.ro.observe(this.body);

  this.tab.addEventListener('pointerdown',function(e){
    if(!self.data) return;
    if(e.pointerType==='mouse' && e.button!==0) return;
    try{ self.tab.setPointerCapture(e.pointerId); }catch(_){}
    var now=performance.now();
    self.drag={y:e.clientY,p0:self.p,moved:false,lastY:e.clientY,lastT:now,v:0};
    self.root.classList.add('dragging');
  });
  this.tab.addEventListener('pointermove',function(e){
    var d=self.drag; if(!d) return;
    var dy=e.clientY-d.y;
    if(Math.abs(dy)>4) d.moved=true;
    var now=performance.now(), dt=Math.max(1,now-d.lastT);
    d.v=0.7*d.v+0.3*((e.clientY-d.lastY)/dt);
    d.lastY=e.clientY; d.lastT=now;
    if(d.moved){
      var h=Math.max(1,self.bodyH());
      self.render(clamp(d.p0+dy/h,0,1),false);
    }
  });
  var end=function(e){
    var d=self.drag; if(!d) return;
    self.drag=null; self.root.classList.remove('dragging');
    try{ self.tab.releasePointerCapture(e.pointerId); }catch(_){}
    if(e.type==='pointercancel'){ self.setOpen(self.open,true); return; }
    if(!d.moved){ self.setOpen(!self.open,true); return; }
    var want;
    if(d.v>0.4) want=true;
    else if(d.v<-0.4) want=false;
    else want = d.p0===0 ? self.p>0.2 : self.p>0.8;
    self.setOpen(want,true,true);
  };
  this.tab.addEventListener('pointerup',end);
  this.tab.addEventListener('pointercancel',end);
  this.tab.addEventListener('click',function(e){ if(e.detail===0) self.setOpen(!self.open,true); });
  this.tab.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){ e.preventDefault(); self.setOpen(true,true); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); self.setOpen(false,true); }
  });
}
Sheet.prototype.bodyH=function(){ return this.body.offsetHeight; };
Sheet.prototype.render=function(p,anim){
  this.p=p;
  this.clip.style.transition=anim?'':'none';
  this.body.style.transition=anim?'':'none';
  this.clip.style.height=(PEEK+p*this.bodyH())+'px';
  this.body.style.opacity = p<=0.02 ? 0 : Math.min(1,p*5);
  this.body.style.filter = p>=1 ? 'none' : 'blur('+(60*Math.pow(1-p,1.5)).toFixed(2)+'px)';
  if(this.data && !anim){ this.fill.style.transition='none'; this.fill.style.width=(p*this.data.risk)+'%'; }
  else this.fill.style.transition='';
  this.root.style.setProperty('--p',p);
  this.root.classList.toggle('tone-on',this.drag?this.open:p>0.45);
};
Sheet.prototype.updateHead=function(){
  var t=T[currentLang];
  this.root.classList.toggle('empty',!this.data);
  this.sub.textContent=!this.data?t.emptyHint:(this.open?t.openSub:t.pullHint);
  this.ico.innerHTML=svg(this.open?P.lockOpen:P.lock);
  this.tab.setAttribute('aria-label',this.open?t.closeAria:t.pullAria);
  this.body.setAttribute('aria-hidden',this.open?'false':'true');
};
Sheet.prototype.clear=function(){
  this.data=null; this.open=false; this.root.dataset.state='sealed';
  this.root.classList.remove('tone-bad','tone-warn','tone-ok');
  this.tab.setAttribute('aria-expanded','false'); this.fill.style.width='0%';
  this.render(0,false); this.updateHead();
};
Sheet.prototype.setOpen=function(o,anim,fromDrag){
  if(!this.data && o) return;
  var was=this.open, self=this;
  this.open=o;
  this.root.dataset.state=o?'open':'sealed';
  this.tab.setAttribute('aria-expanded',String(o));
  this.render(o?1:0,anim);
  this.updateHead();
  if(this.data) this.fill.style.width=o?this.data.risk+'%':'0%';
  if(!o) this.root.classList.remove('no-intro');
  if(o && !was){
    this.root.classList.remove('no-intro');
    this.vico.classList.remove('stamp'); void this.vico.offsetWidth; this.vico.classList.add('stamp');
    if(anim) setTimeout(function(){ self.root.scrollIntoView({behavior:'smooth',block:'nearest'}); },520);
  }
};
Sheet.prototype.nudge=function(){
  var tb=this.tab; tb.classList.remove('nudge'); void tb.offsetWidth; tb.classList.add('nudge');
  setTimeout(function(){ tb.classList.remove('nudge'); },1800);
};
var ICON_F={bad:P.close,warn:P.excl,ok:P.check};
var ICON_V={bad:P.vBad,warn:P.vWarn,ok:P.vOk};
Sheet.prototype.set=function(d,keep){
  var t=T[currentLang];
  this.data=d;
  this.root.classList.remove('tone-bad','tone-warn','tone-ok');
  this.root.classList.add('tone-'+d.tone);
  this.vico.innerHTML=svg(ICON_V[d.tone]);
  this.vtext.textContent=d.verdict;
  this.num.textContent=Math.round(d.risk);
  this.a.textContent=d.a; this.b.textContent=d.b;
  this.note.textContent=d.note;
  this.list.innerHTML='';
  d.findings.forEach(function(f,i){
    var li=document.createElement('li');
    li.className='finding '+f.type; li.style.setProperty('--i',i);
    li.innerHTML='<span class="f-ico">'+svg(ICON_F[f.type])+'</span><span><span class="f-mark"></span><span class="f-txt"></span></span>';
    li.querySelector('.f-mark').textContent=f.mark;
    li.querySelector('.f-txt').textContent=f.text;
    this.list.appendChild(li);
  },this);
  if(keep && this.open){ this.fill.style.width=d.risk+'%'; this.render(1,false); this.updateHead(); }
  else{ this.fill.style.width='0%'; this.open=false; this.root.dataset.state='sealed'; this.tab.setAttribute('aria-expanded','false'); this.render(0,false); this.updateHead(); }
};

var sheetUsb=new Sheet($('mountUsb'),'lblPerGb','lblVsMarket');
var sheetPower=new Sheet($('mountPower'),'lblRealW','lblVsClaim');
var sheetCharger=new Sheet($('mountCharger'),'lblRealW','lblVsClaim');

/* ---------------- flash drive logic ---------------- */

function platLabel(platform){
  return platform==='tiktok' ? (currentLang==='th'?'ร้านทั่วไปบน TikTok Shop':'TikTok Shop regular sellers')
    : platform==='fb' ? (currentLang==='th'?'Facebook Marketplace/กลุ่ม':'Facebook Marketplace/groups')
    : (currentLang==='th'?'แหล่งนี้':'This source');
}
function toneOf(risk){ return risk>=55?'bad':risk>=25?'warn':'ok'; }

function readUsb(){
  var price=parseFloat($('priceUsb').value), gb=parseFloat($('capacityUsb').value);
  if(!price||price<=0||!gb) return null;
  return {price:price,gb:gb,brand:$('brandUsb').value||'other',platform:$('platformUsb').value||'other',rating:radio('ratingUsb')||'unknown',iface:radio('ifaceUsb')||'unsure'};
}
function calcUsb(s){
  var t=T[currentLang], risk=0, f=[];
  var ppg=s.price/s.gb, mr=getUsbRate(s.gb), ratio=ppg/mr;
  if(ratio<0.15){ risk+=45; f.push({type:'bad',mark:t.markPrice,text:t.fPriceBad1(ppg.toFixed(2),mr.toFixed(2),Math.round((1-ratio)*100))}); }
  else if(ratio<0.4){ risk+=28; f.push({type:'bad',mark:t.markPrice,text:t.fPriceBad2(ppg.toFixed(2),mr.toFixed(2))}); }
  else if(ratio<0.7){ risk+=12; f.push({type:'warn',mark:t.markPrice,text:t.fPriceWarn(ppg.toFixed(2),mr.toFixed(2))}); }
  else{ f.push({type:'ok',mark:t.markPrice,text:t.fPriceOk(ppg.toFixed(2),mr.toFixed(2))}); }

  if(s.brand==='hp'){ risk+=30; f.push({type:'bad',mark:t.markBrand,text:t.fBrandHp}); }
  else if(s.brand==='generic'||s.brand==='other'){ risk+=14; f.push({type:'warn',mark:t.markBrand,text:t.fBrandGeneric}); }
  else{ f.push({type:'ok',mark:t.markBrand,text:t.fBrandOk(brandNamesUsb[s.brand]||s.brand)}); }

  if(s.platform==='tiktok'||s.platform==='fb'||s.platform==='other'){ risk+=14; f.push({type:'warn',mark:t.markPlatform,text:t.fPlatRisky(platLabel(s.platform))}); }
  else if(s.platform==='tiktokmall'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatMall}); }
  else if(s.platform==='official'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatOfficial}); }
  else{ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatRegular}); }

  if(s.rating==='new'){ risk+=10; f.push({type:'warn',mark:t.markSeller,text:t.fSellerNew}); }
  else if(s.rating==='low'){ risk+=16; f.push({type:'bad',mark:t.markSeller,text:t.fSellerLow}); }
  else if(s.rating==='unknown'){ risk+=6; }

  if(s.iface==='usb2' && s.gb>=512){ risk+=8; f.push({type:'warn',mark:t.markSpecs,text:t.fSpecsUsb2(gbLabel(s.gb))}); }
  if(s.gb>=2048){ risk+=10; f.push({type:'warn',mark:t.markCapacity,text:t.fCapExtreme(gbLabel(s.gb))}); }

  risk=Math.min(100,risk);
  var tone=toneOf(risk);
  return {
    risk:risk, tone:tone, findings:f,
    verdict: tone==='bad'?t.stampFake:tone==='warn'?t.stampSuspect:t.stampClean,
    a:'฿'+ppg.toFixed(2),
    b: ratio<1 ? Math.round((1-ratio)*100)+t.below : Math.round((ratio-1)*100)+t.above,
    note: tone==='bad'?t.noteFakeUsb:tone==='warn'?t.noteSuspectUsb:t.noteCleanUsb
  };
}

/* ---------------- power bank logic ---------------- */

function readPower(){
  var price=parseFloat($('pricePower').value);
  if(!price||price<=0||!(parseFloat($('capacityPower').value)>0)) return null;
  return {
    price:price,
    mah:parseFloat($('capacityPower').value)||0,
    claimW:parseFloat($('marketingWatt').value)||0,
    regV:parseFloat($('regVoltage').value)||0,
    regA:parseFloat($('regCurrent').value)||0,
    brand:$('brandPower').value||'other', platform:$('platformPower').value||'other', rating:radio('ratingPower')||'unknown'
  };
}
function calcPower(s){
  var t=T[currentLang], risk=0, f=[];
  var realW=s.regV*s.regA, claimW=s.claimW;
  if(claimW>0 && realW>0){
    var wr=claimW/realW;
    if(wr>=2.2){ risk+=35; f.push({type:'bad',mark:t.markWatt,text:t.fWattBad(claimW,realW.toFixed(1))}); }
    else if(wr>=1.4){ risk+=16; f.push({type:'warn',mark:t.markWatt,text:t.fWattWarn(claimW,realW.toFixed(1))}); }
    else{ f.push({type:'ok',mark:t.markWatt,text:t.fWattOk(claimW,realW.toFixed(1))}); }
  } else if(claimW>0){
    risk+=10; f.push({type:'warn',mark:t.markWatt,text:t.fWattMissing});
  }
  if(s.mah>0){
    var ppm=s.price/s.mah, mr=getPowerRate(s.mah), ratio=ppm/mr;
    if(ratio<0.25){ risk+=30; f.push({type:'bad',mark:t.markCapacity,text:t.fCapPowerBad1(ppm.toFixed(3),mr.toFixed(3),Math.round((1-ratio)*100))}); }
    else if(ratio<0.55){ risk+=14; f.push({type:'warn',mark:t.markCapacity,text:t.fCapPowerWarn(ppm.toFixed(3),mr.toFixed(3))}); }
    else{ f.push({type:'ok',mark:t.markCapacity,text:t.fCapPowerOk(ppm.toFixed(3),mr.toFixed(3))}); }
  }
  if(s.brand==='hp'){ risk+=25; f.push({type:'bad',mark:t.markBrand,text:t.fBrandPowerHp}); }
  else if(s.brand==='generic'||s.brand==='other'){ risk+=12; f.push({type:'warn',mark:t.markBrand,text:t.fBrandGeneric}); }
  else{ f.push({type:'ok',mark:t.markBrand,text:t.fBrandOk(brandNamesPower[s.brand]||s.brand)}); }

  if(s.platform==='tiktok'||s.platform==='fb'||s.platform==='other'){ risk+=14; f.push({type:'warn',mark:t.markPlatform,text:t.fPlatRisky(platLabel(s.platform))}); }
  else if(s.platform==='tiktokmall'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatMall}); }
  else if(s.platform==='official'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatOfficial}); }
  else{ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatRegular}); }

  if(s.rating==='new'){ risk+=10; f.push({type:'warn',mark:t.markSeller,text:t.fSellerNew}); }
  else if(s.rating==='low'){ risk+=16; f.push({type:'bad',mark:t.markSeller,text:t.fSellerLow}); }
  else if(s.rating==='unknown'){ risk+=6; }

  risk=Math.min(100,risk);
  var tone=toneOf(risk);
  return {
    risk:risk, tone:tone, findings:f,
    verdict: tone==='bad'?t.stampFake:tone==='warn'?t.stampSuspect:t.stampClean,
    a: realW>0 ? realW.toFixed(1)+'W' : '—',
    b: (claimW>0 && realW>0) ? (claimW>=realW ? '+'+Math.round(((claimW/realW)-1)*100)+'%' : Math.round((1-(claimW/realW))*100)+t.below) : '—',
    note: tone==='bad'?t.noteFakePower:tone==='warn'?t.noteSuspectPower:t.noteCleanPower
  };
}

/* ---------------- charger logic ---------------- */

function readCharger(){
  var price=parseFloat($('priceCharger').value);
  if(!price||price<=0||!(parseFloat($('wattCharger').value)>0)) return null;
  return {
    price:price,
    claimW:parseFloat($('wattCharger').value)||0,
    regV:parseFloat($('regVoltageC').value)||0,
    regA:parseFloat($('regCurrentC').value)||0,
    weight:parseFloat($('weightCharger').value)||0,
    brand:$('brandCharger').value||'other', platform:$('platformCharger').value||'other',
    steps:radio('stepsCharger')||'unknown', rating:radio('ratingCharger')||'unknown'
  };
}
function calcCharger(s){
  var t=T[currentLang], risk=0, f=[];
  var realW=s.regV*s.regA, claimW=s.claimW, cw=claimW>0?claimW:realW;
  if(claimW>0 && realW>0){
    var wr=claimW/realW;
    if(wr>=2.2){ risk+=35; f.push({type:'bad',mark:t.markWatt,text:t.fWattBad(claimW,realW.toFixed(1))}); }
    else if(wr>=1.4){ risk+=16; f.push({type:'warn',mark:t.markWatt,text:t.fWattWarn(claimW,realW.toFixed(1))}); }
    else{ f.push({type:'ok',mark:t.markWatt,text:t.fWattOk(claimW,realW.toFixed(1))}); }
  } else if(claimW>0){
    risk+=10; f.push({type:'warn',mark:t.markWatt,text:t.fWattMissing});
  }
  if(s.steps==='unknown'){ risk+=8; f.push({type:'warn',mark:t.markSteps,text:t.fStepsUnknown}); }
  else if(s.steps==='one'){
    if(cw>=18){ risk+=30; f.push({type:'bad',mark:t.markSteps,text:t.fStepsOne(cw)}); }
    else{ f.push({type:'ok',mark:t.markSteps,text:t.fStepsOk}); }
  }
  else if(s.steps==='two'){
    if(cw>=45){ risk+=22; f.push({type:'bad',mark:t.markSteps,text:t.fStepsTwo(cw)}); }
    else if(cw>27){ risk+=12; f.push({type:'warn',mark:t.markSteps,text:t.fStepsTwoMild(cw)}); }
    else{ f.push({type:'ok',mark:t.markSteps,text:t.fStepsOk}); }
  }
  else{ f.push({type:'ok',mark:t.markSteps,text:t.fStepsMany}); }

  if(s.weight>0 && cw>=20){
    var gpw=s.weight/cw;
    if(gpw<0.6){ risk+=20; f.push({type:'bad',mark:t.markWeight,text:t.fWeightBad(s.weight,cw)}); }
    else if(gpw<1.0){ risk+=10; f.push({type:'warn',mark:t.markWeight,text:t.fWeightWarn(s.weight,cw)}); }
    else{ f.push({type:'ok',mark:t.markWeight,text:t.fWeightOk(s.weight,cw)}); }
  }
  if(cw>0){
    var ppw=s.price/cw, mr=getChargerRate(cw), ratio=ppw/mr;
    if(ratio<0.15){ risk+=35; f.push({type:'bad',mark:t.markPrice,text:t.fPWBad1(ppw.toFixed(2),mr.toFixed(2),Math.round((1-ratio)*100))}); }
    else if(ratio<0.4){ risk+=22; f.push({type:'bad',mark:t.markPrice,text:t.fPWBad2(ppw.toFixed(2),mr.toFixed(2))}); }
    else if(ratio<0.7){ risk+=10; f.push({type:'warn',mark:t.markPrice,text:t.fPWWarn(ppw.toFixed(2),mr.toFixed(2))}); }
    else{ f.push({type:'ok',mark:t.markPrice,text:t.fPWOk(ppw.toFixed(2),mr.toFixed(2))}); }
  }
  if(s.brand==='generic'||s.brand==='other'){ risk+=12; f.push({type:'warn',mark:t.markBrand,text:t.fBrandGeneric}); }
  else{ f.push({type:'ok',mark:t.markBrand,text:t.fBrandCh(brandNamesCh[s.brand]||s.brand)}); }

  if(s.platform==='tiktok'||s.platform==='fb'||s.platform==='other'){ risk+=14; f.push({type:'warn',mark:t.markPlatform,text:t.fPlatRisky(platLabel(s.platform))}); }
  else if(s.platform==='tiktokmall'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatMall}); }
  else if(s.platform==='official'){ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatOfficial}); }
  else{ f.push({type:'ok',mark:t.markPlatform,text:t.fPlatRegular}); }

  if(s.rating==='new'){ risk+=10; f.push({type:'warn',mark:t.markSeller,text:t.fSellerNew}); }
  else if(s.rating==='low'){ risk+=16; f.push({type:'bad',mark:t.markSeller,text:t.fSellerLow}); }
  else if(s.rating==='unknown'){ risk+=6; }

  risk=Math.min(100,risk);
  var tone=toneOf(risk);
  return {
    risk:risk, tone:tone, findings:f,
    verdict: tone==='bad'?t.stampFake:tone==='warn'?t.stampSuspect:t.stampClean,
    a: realW>0 ? realW.toFixed(1)+'W' : '—',
    b: (claimW>0 && realW>0) ? (claimW>=realW ? '+'+Math.round(((claimW/realW)-1)*100)+'%' : Math.round((1-(claimW/realW))*100)+t.below) : '—',
    note: tone==='bad'?t.noteFakeCh:tone==='warn'?t.noteSuspectCh:t.noteCleanCh
  };
}

/* ---------------- wiring ---------------- */
var snap={usb:null,power:null,charger:null};

function setErr(id,helpId,on,key){
  var box=$(id), help=$(helpId);
  box.classList.toggle('err',on);
  help.hidden=!on;
  if(on){ help.setAttribute('data-err',key||'errRequired'); help.textContent=T[currentLang][key||'errRequired']; }
  else help.removeAttribute('data-err');
}
var KIND={
  usb:{read:readUsb,calc:calcUsb,sheet:sheetUsb,cap:'Usb'},
  power:{read:readPower,calc:calcPower,sheet:sheetPower,cap:'Power'},
  charger:{read:readCharger,calc:calcCharger,sheet:sheetCharger,cap:'Charger'}
};
var REQ={
  usb:[['priceUsb','tfPriceUsb','helpPriceUsb','errPrice'],['capacityUsb','tfCapacityUsb','helpCapacityUsb','errRequired']],
  power:[['pricePower','tfPricePower','helpPricePower','errPrice'],['capacityPower','tfCapacityPower','helpCapacityPower','errRequired']],
  charger:[['priceCharger','tfPriceCharger','helpPriceCharger','errPrice'],['wattCharger','tfWattCharger','helpWattCharger','errRequired']]
};
function missing(kind){
  return REQ[kind].filter(function(r){ return !(parseFloat($(r[0]).value)>0); });
}
function syncErrs(kind){
  if(!missing(kind).length){ var fb=document.querySelector('#intake'+KIND[kind].cap+' .form-err'); if(fb) fb.hidden=true; }
  REQ[kind].forEach(function(r){
    var el=$(r[2]);
    if(parseFloat($(r[0]).value)>0 && !el.hidden && el.getAttribute('data-err')) setErr(r[1],r[2],false);
  });
}
function liveUpdate(kind){
  syncErrs(kind);
  if(!snap[kind]) return;
  var K=KIND[kind], s=K.read();
  if(s){ snap[kind]=s; K.sheet.set(K.calc(s),true); }
  else{ snap[kind]=null; K.sheet.clear(); }
}
function submitFor(kind){
  var K=KIND[kind], read=K.read, calc=K.calc, sheet=K.sheet, cap=K.cap;
  var s=read();
  if(!s){
    var miss=missing(kind);
    REQ[kind].forEach(function(r){ setErr(r[1],r[2],miss.indexOf(r)!==-1,r[3]); });
    var form=$('intake'+cap), box=form.querySelector('.form-err');
    if(!box){ box=document.createElement('div'); box.className='form-err'; box.setAttribute('role','alert'); form.querySelector('.btn').parentNode.insertBefore(box,form.querySelector('.btn')); }
    box.textContent=T[currentLang].errMissing+' '+miss.map(function(r){ return $(r[1]).querySelector('.tf-label').textContent; }).join(', ');
    box.hidden=false;
    $(miss[0][1]).scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  REQ[kind].forEach(function(r){ setErr(r[1],r[2],false); });
  var fb=$('intake'+cap).querySelector('.form-err'); if(fb) fb.hidden=true;
  snap[kind]=s;
  sheet.set(calc(s),false);
  sheet.nudge();
  $('mount'+cap).scrollIntoView({behavior:'smooth',block:'center'});
}
$('intakeUsb').addEventListener('submit',function(e){ e.preventDefault(); submitFor('usb'); });
[['intakeUsb','usb'],['intakePower','power'],['intakeCharger','charger']].forEach(function(x){
  var form=$(x[0]);
  form.querySelector('.btn').addEventListener('click',function(){ submitFor(x[1]); });
  form.addEventListener('keydown',function(e){ if(e.key==='Enter' && e.target.tagName==='INPUT'){ e.preventDefault(); submitFor(x[1]); } });
});
$('intakePower').addEventListener('submit',function(e){ e.preventDefault(); submitFor('power'); });
$('intakeCharger').addEventListener('submit',function(e){ e.preventDefault(); submitFor('charger'); });

[['intakeUsb','usb'],['intakePower','power'],['intakeCharger','charger']].forEach(function(x){
  $(x[0]).addEventListener('input',function(){ liveUpdate(x[1]); });
  $(x[0]).addEventListener('change',function(){ liveUpdate(x[1]); });
});

function updateReg(){
  var v=parseFloat($('regVoltage').value)||0, a=parseFloat($('regCurrent').value)||0;
  var w=v*a;
  $('regCalc').textContent='= '+(Math.round(w*10)/10)+' W'; $('regCalc').hidden=!(w>0);
}
$('regVoltage').addEventListener('input',updateReg);
$('regCurrent').addEventListener('input',updateReg);
function updateRegC(){
  var v=parseFloat($('regVoltageC').value)||0, a=parseFloat($('regCurrentC').value)||0;
  var w=v*a;
  $('regCalcC').textContent='= '+(Math.round(w*10)/10)+' W'; $('regCalcC').hidden=!(w>0);
}
$('regVoltageC').addEventListener('input',updateRegC);
$('regCurrentC').addEventListener('input',updateRegC);

document.querySelectorAll('.btn').forEach(function(b){
  b.addEventListener('pointerdown',function(e){
    var r=b.getBoundingClientRect(), s=Math.max(r.width,r.height)*2;
    var d=document.createElement('span'); d.className='ripple';
    d.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';
    b.appendChild(d); setTimeout(function(){ d.remove(); },650);
  });
});

/* ---------------- custom material dropdown ---------------- */
var selects=[];
function CustomSelect(sel){
  var self=this;
  this.sel=sel; this.tf=sel.closest('.tf'); this.wrap=sel.parentNode;
  this.label=this.tf.querySelector('.tf-label');
  this.isOpen=false; this.act=-1; this.buf=''; this.bufT=0;
  var id=sel.id;
  sel.classList.add('native'); sel.tabIndex=-1; sel.setAttribute('aria-hidden','true');
  if(!this.label.id) this.label.id=id+'Lbl';
  var btn=document.createElement('button');
  btn.type='button'; btn.className='dd-btn'; btn.id=id+'Btn';
  btn.setAttribute('role','combobox'); btn.setAttribute('aria-haspopup','listbox');
  btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-controls',id+'Menu');
  btn.setAttribute('aria-labelledby',this.label.id+' '+btn.id);
  var menu=document.createElement('ul');
  menu.className='dd-menu'; menu.id=id+'Menu'; menu.tabIndex=-1;
  menu.setAttribute('role','listbox'); menu.setAttribute('aria-labelledby',this.label.id);
  this.wrap.appendChild(btn); this.tf.appendChild(menu);
  this.btn=btn; this.menu=menu;

  sel.addEventListener('focus',function(){ btn.focus(); });
  btn.addEventListener('click',function(e){
    if(e.detail===0) return;
    if(self.isOpen) self.close(); else self.openMenu();
  });
  btn.addEventListener('keydown',function(e){ self.key(e); });
  menu.addEventListener('mousedown',function(e){ e.preventDefault(); });
  menu.addEventListener('click',function(e){
    var li=e.target.closest('.dd-item'); if(li) self.choose(parseInt(li.getAttribute('data-i'),10));
  });
  menu.addEventListener('pointermove',function(e){
    var li=e.target.closest('.dd-item');
    if(li){ var i=parseInt(li.getAttribute('data-i'),10); if(i!==self.act) self.setActive(i,false); }
  });
  this.refresh();
}
CustomSelect.prototype.refresh=function(){
  var o=this.sel.options[this.sel.selectedIndex];
  this.btn.textContent=o?o.textContent:'';
  this.btn.classList.toggle('is-empty',!this.sel.value);
};
CustomSelect.prototype.build=function(){
  var self=this, h='';
  Array.prototype.forEach.call(this.sel.options,function(o,i){
    var s=i===self.sel.selectedIndex;
    h+='<li class="dd-item" role="option" id="'+self.sel.id+'O'+i+'" data-i="'+i+'" aria-selected="'+s+'" style="--i:'+i+'"><span></span>'+svg(P.check)+'</li>';
  });
  this.menu.innerHTML=h;
  Array.prototype.forEach.call(this.menu.children,function(li,i){ li.firstChild.textContent=self.sel.options[i].textContent; });
};
CustomSelect.prototype.openMenu=function(){
  selects.forEach(function(s){ if(s!==this && s.isOpen) s.close(); },this);
  this.build();
  var r=this.tf.getBoundingClientRect(), vh=window.innerHeight;
  var below=vh-r.bottom-12, above=r.top-110-12;
  var need=Math.min(320,this.sel.options.length*48+16);
  var up=below<need && above>below;
  this.menu.classList.toggle('up',up);
  this.menu.style.maxHeight=Math.max(160,Math.min(320,up?above:below))+'px';
  this.isOpen=true;
  this.wrap.classList.add('open');
  this.btn.setAttribute('aria-expanded','true');
  this.menu.classList.add('show');
  this.setActive(this.sel.selectedIndex,true,true);
};
CustomSelect.prototype.close=function(){
  if(!this.isOpen) return;
  this.isOpen=false;
  this.wrap.classList.remove('open');
  this.menu.classList.remove('show');
  this.btn.setAttribute('aria-expanded','false');
  this.btn.removeAttribute('aria-activedescendant');
};
CustomSelect.prototype.setActive=function(i,scroll,center){
  var items=this.menu.children;
  if(!items.length) return;
  i=clamp(i,0,items.length-1);
  if(this.act>=0 && items[this.act]) items[this.act].classList.remove('act');
  this.act=i;
  var li=items[i];
  li.classList.add('act');
  this.btn.setAttribute('aria-activedescendant',li.id);
  if(center){
    this.menu.scrollTop=li.offsetTop-this.menu.clientHeight/2+li.offsetHeight/2;
  } else if(scroll!==false){
    var m=this.menu, top=li.offsetTop, bot=top+li.offsetHeight;
    if(top<m.scrollTop+8) m.scrollTop=top-8;
    else if(bot>m.scrollTop+m.clientHeight-8) m.scrollTop=bot-m.clientHeight+8;
  }
};
CustomSelect.prototype.choose=function(i){
  var changed=this.sel.selectedIndex!==i;
  this.sel.selectedIndex=i;
  this.refresh();
  this.close();
  if(changed){
    this.sel.dispatchEvent(new Event('input',{bubbles:true}));
    this.sel.dispatchEvent(new Event('change',{bubbles:true}));
  }
};
CustomSelect.prototype.key=function(e){
  var n=this.sel.options.length, k=e.key;
  if(!this.isOpen){
    if(k==='ArrowDown'||k==='ArrowUp'||k==='Enter'||k===' '){ e.preventDefault(); this.openMenu(); }
    return;
  }
  if(k==='ArrowDown'){ e.preventDefault(); this.setActive(Math.min(n-1,this.act+1)); }
  else if(k==='ArrowUp'){ e.preventDefault(); this.setActive(Math.max(0,this.act-1)); }
  else if(k==='Home'){ e.preventDefault(); this.setActive(0); }
  else if(k==='End'){ e.preventDefault(); this.setActive(n-1); }
  else if(k==='Enter'||k===' '){ e.preventDefault(); this.choose(this.act); }
  else if(k==='Escape'){ e.preventDefault(); this.close(); }
  else if(k==='Tab'){ this.close(); }
  else if(k.length===1 && /\S/.test(k)){
    var now=Date.now();
    this.buf = (now-this.bufT>600 ? '' : this.buf)+k.toLowerCase();
    this.bufT=now;
    for(var j=1;j<=n;j++){
      var idx=(this.act+j)%n;
      if(this.sel.options[idx].textContent.toLowerCase().indexOf(this.buf)===0){ this.setActive(idx); break; }
    }
  }
};
document.querySelectorAll('.tf-row.sel select').forEach(function(s){ selects.push(new CustomSelect(s)); });
function refreshSelects(){ selects.forEach(function(s){ s.refresh(); }); }
function closeAllSelects(){ selects.forEach(function(s){ s.close(); }); }
document.addEventListener('pointerdown',function(e){
  selects.forEach(function(s){ if(s.isOpen && !s.tf.contains(e.target)) s.close(); });
});

/* ---------------- animated notes ---------------- */
var EASE='cubic-bezier(.2,0,0,1)';
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
function stagger(d){
  d.querySelectorAll('.body > p, .body li').forEach(function(el,i){ el.style.setProperty('--k',i); });
}
function toggleDetails(d,want){
  var sum=d.querySelector('summary');
  var cur=d.offsetHeight;
  if(d._a){ d._a.onfinish=null; d._a.cancel(); d._a=null; }
  d.style.overflow='hidden';
  var end;
  if(want){ d.open=true; d.classList.add('is-open'); stagger(d); end=d.offsetHeight; }
  else{ d.classList.remove('is-open'); end=sum.offsetHeight; }
  var a=d.animate({height:[cur+'px',end+'px']},{duration:want?440:300,easing:EASE});
  d._a=a;
  a.onfinish=function(){ d._a=null; d.style.overflow=''; if(!want) d.open=false; };
}
document.querySelectorAll('details').forEach(function(d){
  d.querySelector('summary').addEventListener('click',function(e){
    e.preventDefault();
    var want=!d.classList.contains('is-open');
    if(reduce.matches){ d.open=want; d.classList.toggle('is-open',want); if(want) stagger(d); return; }
    toggleDetails(d,want);
  });
});
if('IntersectionObserver' in window && !reduce.matches){
  var io=new IntersectionObserver(function(entries){
    var n=0;
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:520,delay:n*80,easing:EASE,fill:'backwards'});
      n++;
    });
  },{threshold:0.2});
  document.querySelectorAll('.evidence .sec-label, .evidence details').forEach(function(el){ io.observe(el); });
}

/* ---------------- language + tabs ---------------- */
var CAP={usb:'Usb',power:'Power',charger:'Charger'};
function heroFor(tab){ var t=T[currentLang]; $('heroTitle').innerHTML=t['title'+CAP[tab]]; $('heroSub').innerHTML=t['sub'+CAP[tab]]; }
function applyLang(lang){
  currentLang=lang;
  var t=T[lang];
  document.body.classList.toggle('lang-th',lang==='th');
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(function(el){ var k=el.getAttribute('data-i18n'); if(t[k]!==undefined) el.textContent=t[k]; });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){ var k=el.getAttribute('data-i18n-html'); if(t[k]!==undefined) el.innerHTML=t[k]; });
  heroFor(currentTab);
  $('btnEn').classList.toggle('active',lang==='en');
  $('btnTh').classList.toggle('active',lang==='th');
  if(snap.usb) sheetUsb.set(calcUsb(snap.usb),true); else sheetUsb.updateHead();
  if(snap.power) sheetPower.set(calcPower(snap.power),true); else sheetPower.updateHead();
  if(snap.charger) sheetCharger.set(calcCharger(snap.charger),true); else sheetCharger.updateHead();
  document.querySelectorAll('.form-err').forEach(function(el){ el.hidden=true; });
  document.querySelectorAll('.tf-help[data-err]').forEach(function(el){ el.textContent=t[el.getAttribute('data-err')]; });
  refreshSelects();
  document.querySelectorAll('details.is-open').forEach(stagger);
}
$('btnEn').addEventListener('click',function(){ applyLang('en'); });
$('btnTh').addEventListener('click',function(){ applyLang('th'); });

var HASH={'flash-drive':'usb','power-bank':'power','charger':'charger'};
var HASHOF={usb:'flash-drive',power:'power-bank',charger:'charger'};
function showTab(tab){
  currentTab=tab;
  var t=T[currentLang];
  document.querySelectorAll('.tab').forEach(function(b){ b.setAttribute('aria-selected',String(b.getAttribute('data-tab')===tab)); });
  closeAllSelects();
  [['usb','panelUsb'],['power','panelPower'],['charger','panelCharger']].forEach(function(x){
    var el=$(x[1]), on=tab===x[0]; el.hidden=!on; el.classList.toggle('active',on);
  });
  heroFor(tab);
}
/* Tab switch: the viewport slides sideways (direction follows tab order) using the View Transitions API.
   The sticky header is held still so only the content moves. Browsers without it just switch instantly. */
var TABORDER=['usb','power','charger'], vtId=0;
function switchTab(tab){
  if(tab===currentTab) return;
  var dir=TABORDER.indexOf(tab)-TABORDER.indexOf(currentTab);
  function run(){ showTab(tab); window.scrollTo(0,0); }
  if(!document.startViewTransition || reduce.matches){ run(); return; }
  var root=document.documentElement, id=++vtId;
  root.dataset.slide=dir>0?'next':'prev';
  root.classList.add('vt');
  var vt=document.startViewTransition(run);
  vt.finished.then(function(){},function(){}).then(function(){
    if(id!==vtId) return;
    root.classList.remove('vt'); delete root.dataset.slide;
  });
}
document.querySelectorAll('.tab').forEach(function(b){
  b.addEventListener('click',function(){
    var tab=b.getAttribute('data-tab');
    if(tab===currentTab) return;
    if(location.hash==='#'+HASHOF[tab]) switchTab(tab);   /* hashchange won't fire */
    else location.hash=HASHOF[tab];                       /* hashchange -> switchTab (also covers Back) */
  });
});
window.addEventListener('hashchange',function(){
  var tab=HASH[location.hash.replace('#','')];
  if(tab && tab!==currentTab) switchTab(tab);
});

/* ---------------- first state: blank form, verdict drawers empty ---------------- */
applyLang('en');
updateReg(); updateRegC();
sheetUsb.updateHead(); sheetPower.updateHead(); sheetCharger.updateHead();
var startTab=HASH[location.hash.replace('#','')];
if(startTab) showTab(startTab);

})();
