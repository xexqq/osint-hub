/* ============ IP ============ */
$("ip-go").onclick=function(){
  var q=$("ip-q").value.trim();
  outShow("ip-out","⏳ ipwho.is + rDNS ...");
  var url=q?("https://ipwho.is/"+encodeURIComponent(q)):"https://ipwho.is/";
  fetch(url).then(function(r){ return r.json(); }).then(function(d){
    if(!d||d.success===false){ outShow("ip-out",'<span class="bad">ошибка: '+esc((d&&d.message)||"")+"</span>"); return null; }
    var ip=d.ip||q;
    var h=kv("IP",ip)+"\n";
    h+=kv("Флаг", (d.flag&&d.flag.emoji)||"—")+"\n";
    h+=kv("Страна",(d.country||"—")+" ("+(d.country_code||"—")+")")+"\n";
    h+=kv("Регион/город",(d.region||"—")+" / "+(d.city||"—"))+"\n";
    h+=kv("Координаты",d.latitude+","+d.longitude)+"\n";
    var c=d.connection||{};
    h+=kv("Провайдер",c.isp||"—")+"\n";
    h+=kv("ORG",("AS"+(c.asn||"—")+" "+(c.org||"")).trim())+"\n";
    h+=kv("Таймзона",((d.timezone||{}).id)||"—")+"\n";
    outShow("ip-out",h);
    var pn=ctrName(ip);
    if(pn){
      return doh(pn,"PTR").then(function(j){
        var line="\n"+kv("rDNS(PTR)", (j&&j.Answer&&j.Answer.length)? j.Answer[0].data: "не определён");
        var el=$("ip-out");
        el.innerHTML+=line; el.style.display="block";
      }).catch(function(){});
    }
  }).catch(function(e){ outShow("ip-out",'<span class="bad">сеть недоступна: '+esc(e.message)+"</span>"); });
};
$("ip-shodan").onclick=function(){ exOpen("https://www.shodan.io/search?query="+encodeURIComponent($("ip-q").value.trim())); };
$("ip-censys").onclick=function(){ exOpen("https://search.censys.io/search?resource=hosts&q="+encodeURIComponent($("ip-q").value.trim())); };
$("ip-abuse").onclick=function(){ exOpen("https://www.abuseipdb.com/check/"+encodeURIComponent($("ip-q").value.trim())); };
$("ip-map").onclick=function(){
  var q=$("ip-q").value.trim();
  var url=q?("https://ipwho.is/"+encodeURIComponent(q)):"https://ipwho.is/";
  fetch(url).then(function(r){ return r.json(); }).then(function(j){
    if(j&&typeof j.latitude==="number"){
      exOpen("https://www.openstreetmap.org/?mlat="+j.latitude+"&mlon="+j.longitude+"#map=13/"+j.latitude+"/"+j.longitude);
    }
  }).catch(function(){});
};

/* ============ DNS ============ */
$("dns-go").onclick=function(){
  var d=cleanDomain($("dns-q").value);
  if(!d){ outShow("dns-out",'<span class="warn">введите домен</span>'); return; }
  outShow("dns-out","⏳ резолв "+d+" ...");
  var TYPES=["A","AAAA","CNAME","MX","NS","SOA","TXT"];
  Promise.all(TYPES.map(function(t){
    return doh(d,t).then(function(j){
      var n=(j&&j.Answer)?j.Answer.length:0;
      var body=n? ansList(j.Answer):( '<span class="warn">пусто</span>');
      return kv(t,String(n))+"\n"+body+"\n\n";
    }).catch(function(){ return kv(t,"<span class='bad'>ошибка</span>")+"\n\n"; });
  })).then(function(parts){ outShow("dns-out",parts.join("").trim()); });
};

$("sub-go").onclick=function(){
  var d=cleanDomain($("dns-q").value);
  if(!d){ outShow("dns-out",'<span class="warn">введите домен</span>'); return; }
  var list=SUB_LISTS[SET.subdepth]||SUB_LISTS.std;
  var lines=[]; var found=0; var remaining=list.length; var cursor=0;
  var shown=false;
  function show(){
    if(shown) return; shown=true;
    var head=kv("Найдено живых поддоменов",found+"/"+list.length)+"\n\n";
    var body=lines.length? lines.join("\n") : '<span class="warn">из списка ничего не резолвится</span>';
    outShow("dns-out", head+body);
  }
  outShow("dns-out","⏳ брутфорс "+list.length+" поддоменов ("+SET.subdepth+")...");
  function worker(){
    if(cursor>=list.length) return;
    var i=cursor++;
    doh(list[i]+"."+d,"A").then(function(j){
      if(j&&j.Answer&&j.Answer.length){
        var ip=j.Answer[0].data;
        lines.push(kv(list[i]+"."+d, ip));
        found++;
      }
    }).catch(function(){}).then(function(){
      remaining--;
      if(remaining<=0) show(); else worker();
    });
  }
  for(var z=0; z<Math.min(5,list.length); z++) worker();
  setTimeout(show, Math.min(list.length*150, 60000));
};
$("dns-whois").onclick=function(){ exOpen("https://rdap.org/domain/"+encodeURIComponent(cleanDomain($("dns-q").value))); };
$("dns-crt").onclick=function(){ exOpen("https://crt.sh/?q="+encodeURIComponent(cleanDomain($("dns-q").value))); };
$("dns-arch").onclick=function(){ exOpen("https://web.archive.org/web/*/"+$("dns-q").value.trim()); };
$("dns-scan").onclick=function(){ exOpen("https://urlscan.io/search/#"+encodeURIComponent($("dns-q").value.trim())); };

/* ============ EMAIL ============ */
function provOf(domain){
  var d=String(domain||"").toLowerCase();
  if(/(^|\.)(gmail|googlemail)\.com$/.test(d)) return "Google / Gmail";
  if(/(^|\.)yahoo\./.test(d)) return "Yahoo";
  if(/(^|\.)(outlook|hotmail|live|msn)\./.test(d)) return "Microsoft";
  if(/(^|\.)(mail|bk|inbox|list|internet)\.ru$/.test(d)) return "Mail.ru (RU)";
  if(/(^|\.)(yandex|ya)\.ru$/.test(d)) return "Яндекс (RU)";
  if(/(^|\.)proton\.(me|ch)$/.test(d)) return "Proton (приватный)";
  if(/(^|\.)icloud\.com$/.test(d)) return "iCloud";
  return "собственный / корпоративный";
}
$("em-go").onclick=function(){
  var em=$("em-q").value.trim().toLowerCase();
  if(!em){ outShow("em-out",'<span class="warn">введите email</span>'); return; }
  var p=em.split("@");
  var local=p[0]||"", domain=p[1]||"";
  var h=kv("Локальная часть",'"'+local+'"')+"\n";
  h+=kv("Домен",domain)+"\n";
  h+=kv("Провайдер",provOf(domain))+"\n";
  if(typeof CryptoJS!=="undefined") h+=kv("MD5 (Gravatar)",CryptoJS.MD5(em).toString())+"\n";
  outShow("em-out",h);
  doh(domain,"MX").then(function(j){
    var line;
    if(j&&j.Answer&&j.Answer.length){
      var mx=j.Answer.map(function(x){ var w=x.data.split(/\s+/); return w.length>1? w[1]: x.data; }).join(", ");
      line="\n"+kv("MX-серверы",mx);
    }else{
      line="\n"+'<span class="warn">MX: нет — домен без почты</span>';
    }
    var el=$("em-out"); el.innerHTML+=line; el.style.display="block";
  }).catch(function(){});
};
$("em-grav").onclick=function(){
  var em=$("em-q").value.trim().toLowerCase();
  if(typeof CryptoJS!=="undefined"){
    exOpen("https://gravatar.com/"+CryptoJS.MD5(em).toString()+".json");
  }
};
$("em-hibp").onclick=function(){ exOpen("https://haveibeenpwned.com/account/"+encodeURIComponent($("em-q").value.trim())); };
$("em-ix").onclick=function(){ exOpen("https://intelx.io/?s="+encodeURIComponent($("em-q").value.trim())); };

/* ============ PHONE ============ */
var COUNTRY_FLAG={RU:"🇷🇺",UA:"🇺🇦",KZ:"🇰🇿",BY:"🇧🇾",US:"🇺🇸",GB:"🇬🇧",DE:"🇩🇪",IN:"🇮🇳"};
function phoneParse(raw){
  if(typeof libphonenumber==="undefined") return null;
  try{ return libphonenumber.parsePhoneNumberFromString(raw, SET.country); }
  catch(e){ return null; }
}
$("ph-go").onclick=function(){
  var raw=$("ph-q").value.trim();
  if(!raw){ outShow("ph-out",'<span class="warn">введите номер</span>'); return; }
  var pn=phoneParse(raw);
  if(!pn){
    outShow("ph-out",'<span class="warn">формат не распознался — попробуйте с «+»; страна по умолчанию: '+esc(SET.country)+"</span>");
    return;
  }
  var h=kv("Валидный", pn.isValid()? '<span class="good">да</span>':'<span class="bad">нет</span>')+"\n";
  h+=kv("Страна",(pn.country||"—")+" "+(COUNTRY_FLAG[pn.country]||""))+"\n";
  h+=kv("E.164",pn.number)+"\n";
  h+=kv("Формат",pn.formatInternational())+"\n";
  h+=kv("Тип линии",String(pn.getType()||"—"))+"\n";
  h+=kv("Оператор-префикс",(nationalOf(p)||"—").slice(0,4))+"\n";
  outShow("ph-out",h);
};
function nationalOf(p){ try{ return String(p.nationalNumber||""); }catch(e){ return ""; } }
$("ph-dork").onclick=function(){
  var raw=$("ph-q").value.trim();
  exOpen(ENG.google('"'+raw+'" (site:t.me OR site:vk.com OR site:pastebin.com OR site:github.com OR filetype:txt)'));
};
$("ph-true").onclick=function(){
  var raw=$("ph-q").value.trim();
  exOpen("https://www.truecaller.com/search/"+SET.country.toLowerCase()+"/"+encodeURIComponent(raw));
};

/* ============ NICK ============ */
$("gh-go").onclick=function(){
  var u=$("gh-q").value.trim();
  if(!u){ outShow("gh-out",'<span class="warn">введите ник</span>'); return; }
  outShow("gh-out","⏳ GitHub API...");
  Promise.all([
    fetch("https://api.github.com/users/"+encodeURIComponent(u)).then(function(r){return r.json();}),
    fetch("https://api.github.com/users/"+encodeURIComponent(u)+"/repos?per_page=5&sort=updated").then(function(r){return r.json();})
  ]).then(function(rs){
    var p=rs[0], repos=rs[1];
    if(p.message){ outShow("gh-out",'<span class="warn">'+esc(u)+": "+esc(p.message)+"</span>"); return; }
    var h=kv("Ник",p.login)+" ("+(p.type||"User")+")\n";
    if(p.name) h+=kv("Имя",p.name)+"\n";
    if(p.email) h+=kv("EMAIL",p.email)+"\n";
    if(p.company) h+=kv("Компания",p.company)+"\n";
    if(p.location) h+=kv("Локация",p.location)+"\n";
    if(p.blog) h+=kv("Сайт",p.blog)+"\n";
    if(p.twitter_username) h+=kv("X/Twitter",p.twitter_username)+"\n";
    h+=kv("Репо/фолловеры",p.public_repos+" / "+p.followers)+"\n";
    h+=kv("Аккаунт создан",(p.created_at||"—").split("T")[0])+"\n";
    if(repos&&repos.length){
      h+="\nПОСЛЕДНИЕ РЕПО:\n";
      repos.forEach(function(r){
        h+="  • "+r.name+" ("+(r.language||"—")+", ★"+r.stargazers_count+", "+(r.updated_at||"—").split("T")[0]+")\n";
      });
    }
    outShow("gh-out",h);
  }).catch(function(e){ outShow("gh-out",'<span class="bad">сеть недоступна: '+esc(e.message)+"</span>"); });
};
$("nick-web").onclick=function(){ exOpen("https://whatsmyname.app/?q="+encodeURIComponent($("gh-q").value.trim())); };
$("nick-l").onclick=function(){
  var u=$("gh-q").value.trim();
  if(!u){ outShow("gh-out",'<span class="warn">введите ник сначала</span>'); return; }
  var sites=[
    ["VK","https://vk.com/u:{u}"],["Telegram","https://t.me/{u}"],
    ["Instagram","https://www.instagram.com/{u}/"],["X","https://x.com/{u}"],
    ["GitHub","https://github.com/{u}"],["Reddit","https://www.reddit.com/user/{u}"],
    ["YouTube","https://www.youtube.com/@{u}"],["Twitch","https://www.twitch.tv/{u}"],
    ["OK","https://ok.ru/{u}"],["Steam","https://steamcommunity.com/id/{u}"],
    ["Medium","https://medium.com/@{u}"],["Pinterest","https://www.pinterest.com/{u}/"],
    ["Keybase","https://keybase.io/{u}"],["SoundCloud","https://soundcloud.com/{u}"],
    ["Threads","https://www.threads.net/@{u}"],["Behance","https://www.behance.net/{u}"],
    ["Dev.to","https://dev.to/{u}"],["TikTok","https://www.tiktok.com/@{u}"],
    ["Vimeo","https://vimeo.com/{u}"],["Zen (Dzen)","https://dzen.ru/{u}"]
  ];
  var box=$("nick-links"); box.innerHTML=""; box.style.display="block";
  var lbl=document.createElement("div");
  lbl.style.cssText="font-size:11px;color:var(--dim);margin:4px 0 2px";
  lbl.textContent="20 платформ (если профиль существует, откроется):";
  box.appendChild(lbl);
  sites.forEach(function(s){
    var a=document.createElement("a");
    a.href=s[1].replace(/\{u\}/,encodeURIComponent(u));
    a.textContent=s[0];
    a.target="_blank"; a.rel="noopener";
    box.appendChild(a);
  });
};

/* ============ PHOTO ============ */
$("ph-file").addEventListener("change",function(ev){
  var f=ev.target.files[0];
  if(!f) return;
  outShow("photo-out","⏳ читаю EXIF локально...");
  if(typeof exifr==="undefined"){ outShow("photo-out",'<span class="warn">exifr не загрузилась (нет сети?)</span>'); return; }
  exifr.parse(f,{gps:true}).then(function(x){
    if(!x||Object.keys(x).length===0){
      outShow("photo-out",'<span class="warn">EXIF пуст (фотография пересжата или метаданные сняты)</span>');
      return;
    }
    var h="";
    if(x.Make||x.Model) h+=kv("Камера",(x.Make||"—")+" "+(x.Model||""))+"\n";
    if(x.DateTimeOriginal) h+=kv("Дата съёмки",new Date(x.DateTimeOriginal).toLocaleString())+"\n";
    if(x.software) h+=kv("Софт",x.software)+"\n";
    if(x.ISO!==undefined) h+=kv("ISO",x.ISO)+"\n";
    if(x.FNumber) h+=kv("Диафрагма","f/"+x.FNumber)+"\n";
    if(x.FocalLength) h+=kv("Фокусное",x.FocalLength+" mm")+"\n";
    if(x.GPSLatitude&&x.GPSLongitude){
      var la=x.GPSLatitude, lo=x.GPSLongitude;
      h+=kv("GPS",la+", "+lo)+"\n";
      h+='   → <a target="_blank" rel="noopener" href="https://www.google.com/maps?q='+la+","+lo+'">Google Maps</a>\n';
      h+='   → <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat='+la+"&mlon="+lo+'#map=15/'+la+"/"+lo+'">OSM</a>\n';
      h+='   → <a target="_blank" rel="noopener" href="https://yandex.ru/maps/?ll='+lo+","+la+"&z=15&l=sat\">Яндекс.Карты (спутник)</a>\n";
    }else{
      h+='<span class="warn">GPS: нет данных</span>\n';
    }
    outShow("photo-out",h);
  }).catch(function(e){ outShow("photo-out",'<span class="bad">ошибка разбора: '+esc(e.message)+"</span>"); });
});

/* ============ DORK ============ */
var chipsState=[];
$("dorchips").addEventListener("click",function(ev){
  var a=ev.target.closest(".ch");
  if(!a) return;
  ev.preventDefault();
  var add=a.getAttribute("data-add");
  var i=chipsState.indexOf(add);
  var base=$("dk-q").value.trim();
  if(i>-1){ chipsState.splice(i,1); a.classList.remove("on"); }
  else{ chipsState.push(add); a.classList.add("on"); }
  var txt=base? ('"'+base+'" ') : "";
  $("dk-txt").value=(txt+chipsState.join(" ")).replace(/\s{2,}/g," ").trim();
});
$("dk-go").onclick=function(){
  var q=$("dk-txt").value.trim();
  if(!q) q=$("dk-q").value.trim();
  if(!q) return;
  var engine=$("dk-engine").value;
  exOpen(ENG[engine](q));
};
$("dk-copy").onclick=function(){
  var q=$("dk-txt").value.trim();
  navigator.clipboard.writeText(q).then(function(){
    $("dk-copy").textContent="✓";
    setTimeout(function(){ $("dk-copy").textContent="Копировать"; },1200);
  });
};
