/* ============ SMART SEARCH ============ */
function detectType(raw){
  var s=raw.trim();
  if(/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(s)) return "email";
  var digits=s.replace(/\D/g,"");
  if(/^[+\d][\d\s\-\(\)].{6,}$/.test(s) && digits.length>=7 && digits.length<=15) return "phone";
  if(/^[0-9]{1,3}(\.[0-9]{1,3}){3}$/.test(s)) return "ip";
  if(/^[0-9a-fA-F:]*:[0-9a-fA-F:]+$/.test(s) && s.indexOf(":")>-1) return "ip";
  if(/^https?:\/\//i.test(s)) return "domain";
  if(/^[a-zA-Zа-яА-ЯёЁ0-9\-_]+(\.[a-zA-Zа-яА-ЯёЁ0-9\-_]+)+$/.test(s)) return "domain";
  if(/^[\w\-\.]{3,}$/.test(s)) return "username";
  return "person";
}
$("smart-go").onclick=function(){
  var raw=$("ibq").value.trim();
  if(!raw){ $("ibq").focus(); return; }
  var type=detectType(raw);
  var title={email:"EMAIL",phone:"ТЕЛЕФОН",ip:"IP-АДРЕС",domain:"ДОМЕН/URL",username:"НИКНЕЙМ",person:"ИМЯ ЧЕЛОВЕКА"}[type];
  histAdd(raw,title);
  goSmart(type,raw);
};
function goSmart(type,raw){
  if(type==="email"){
    var parts=raw.split("@");
    var local=parts[0], domain=(parts[1]||"");
    var h="Тип: EMAIL\n\n"+kv("Локальная часть",'"'+local+'"')+"\n"+kv("Домен",domain)+"\n"+kv("Провайдер",provOf(domain));
    if(typeof CryptoJS!=="undefined") h+="\n"+kv("MD5",CryptoJS.MD5(raw.trim().toLowerCase()).toString());
    outShow("smart-out",h);
    doh(domain,"MX").then(function(j){
      var line;
      if(j&&j.Answer&&j.Answer.length){
        line="\n"+kv("MX", j.Answer.map(function(x){var w=x.data.split(/\s+/);return w.length>1?w[1]:x.data;}).join(", "));
      }else{
        line="\n"+'<span class="warn">MX: нет</span>';
      }
      var el=$("smart-out"); el.innerHTML+=line; el.style.display="block";
    }).catch(function(){});
    linksTo("smart-links",[
      ["Gravatar", typeof CryptoJS!=="undefined"? "https://gravatar.com/"+CryptoJS.MD5(raw.trim().toLowerCase()).toString()+".json":"https://gravatar.com/"],
      ["HIBP", "https://haveibeenpwned.com/account/"+encodeURIComponent(raw)],
      ["Intelligence X", "https://intelx.io/?s="+encodeURIComponent(raw)],
      ["GitHub код-dork", ENG.google('"'+raw+'" site:github.com')]
    ]);
  }else if(type==="phone"){
    var pn=phoneParse(raw);
    var h="Тип: ТЕЛЕФОН\n\n";
    if(pn){
      h+=kv("Валидный",pn.isValid()?"да":"нет")+"\n";
      h+=kv("Страна",(pn.country||"—")+" "+(COUNTRY_FLAG[pn.country]||""))+"\n";
      h+=kv("E.164",pn.number)+"\n";
      h+=kv("Тип линии",String(pn.getType()||"—"))+"\n";
    }else{
      h+='<span class="warn">Не удалось разобрать (попробуйте с «+\')</span>\n';
    }
    outShow("smart-out",h);
    linksTo("smart-links",[
      ["Truecaller", "https://www.truecaller.com/search/"+SET.country.toLowerCase()+"/"+encodeURIComponent(raw)],
      ["Дампы Google dork", ENG.google('"'+raw+'" site:t.me OR site:vk.com OR site:pastebin.com OR filetype:txt')],
      ["Intelligence X", "https://intelx.io/?s="+encodeURIComponent(raw)]
    ]);
  }else if(type==="ip"){
    outShow("smart-out","Тип: IP-АДРЕС\n\n⏳ ipwho.is ...");
    fetch("https://ipwho.is/"+encodeURIComponent(raw)).then(function(r){ return r.json(); }).then(function(d){
      if(!d||d.success===false){ outShow("smart-out",'<span class="bad">ipwho.is: ошибка</span>'); return null; }
      var h="Тип: IP-АДРЕС\n\n"+kv("IP",d.ip)+"\n"+kv("Страна",(d.country||"—")+" ("+(d.country_code||"—")+")")+"\n";
      h+=kv("Регион/город",(d.region||"—")+" / "+(d.city||"—"))+"\n";
      h+=kv("Координаты",d.latitude+","+d.longitude)+"\n";
      var c=d.connection||{};
      h+=kv("Провайдер",c.isp||"—")+"\n"+kv("ORG","AS"+(c.asn||"—")+" "+(c.org||"—"));
      outShow("smart-out",h);
      var pn=ctrName(d.ip);
      if(pn){
        return doh(pn,"PTR").then(function(j){
          var el=$("smart-out");
          el.innerHTML+="\n"+kv("rDNS(PTR)", (j&&j.Answer&&j.Answer.length)? j.Answer[0].data: "не определён");
          el.style.display="block";
        }).catch(function(){});
      }
    }).catch(function(){})
    .then(function(){
      linksTo("smart-links",[
        ["Shodan", "https://www.shodan.io/search?query="+encodeURIComponent(raw)],
        ["Censys", "https://search.censys.io/search?resource=hosts&q="+encodeURIComponent(raw)],
        ["AbuseIPDB", "https://www.abuseipdb.com/check/"+encodeURIComponent(raw)]
      ]);
    });
  }else if(type==="domain"){
    var dom=cleanDomain(raw);
    outShow("smart-out","Тип: ДОМЕН: "+dom+"\n\n⏳ DNS ...");
    var TYPES=["A","AAAA","MX","NS","SOA","TXT"];
    Promise.all(TYPES.map(function(t){
      return doh(dom,t).then(function(j){
        var arr=(j&&j.Answer)? j.Answer: [];
        var n=arr.length;
        return kv(t,String(n))+((n>0&&n<6)?"\n"+ansList(arr):"")+"\n";
      }).catch(function(){ return kv(t,"—")+"\n"; });
    })).then(function(parts){
      outShow("smart-out","Тип: ДОМЕН: "+dom+"\n\n"+parts.join("\n"));
    }).catch(function(){});
    linksTo("smart-links",[
      ["crt.sh", "https://crt.sh/?q="+encodeURIComponent(dom)],
      ["Wayback", "https://web.archive.org/web/*/"+dom],
      ["RDAP WHOIS", "https://rdap.org/domain/"+encodeURIComponent(dom)],
      ["urlscan", "https://urlscan.io/search/#"+encodeURIComponent(dom)]
    ]);
  }else if(type==="username"){
    outShow("smart-out","Тип: НИКНЕЙМ: "+raw+"\n\n⏳ GitHub API ...");
    fetch("https://api.github.com/users/"+encodeURIComponent(raw)).then(function(r){ return r.json(); }).then(function(p){
      var h="Тип: НИКНЕЙМ: "+raw+"\n\n";
      if(!p.message){
        h+=kv("GitHub",p.login+(p.name? " ("+p.name+")":""))+"\n";
        if(p.email) h+=kv("Email",p.email)+"\n";
        if(p.company) h+=kv("Компания",p.company)+"\n";
        if(p.location) h+=kv("Локация",p.location)+"\n";
        h+=kv("Создан",(p.created_at||"—").split("T")[0])+"\n";
      }else{
        h+='<span class="warn">GitHub: не найден</span>\n';
      }
      outShow("smart-out",h);
      gotoPane("nick");
      $("gh-q").value=raw;
    }).catch(function(){});
    linksTo("smart-links",[
      ["WhatsMyName","https://whatsmyname.app/?q="+encodeURIComponent(raw)],
      ["Telegram","https://t.me/"+encodeURIComponent(raw)],
      ["VK","https://vk.com/"+encodeURIComponent(raw)]
    ]);
  }else{
    outShow("smart-out","Тип: ИМЯ ЧЕЛОВЕКА: "+raw+"\n\nИнтерпретируется как человек — dork по соцсетям будет открыт:");
    openEng('"'+raw+'" site:vk.com OR site:instagram.com OR site:t.me OR site:linkedin.com');
    linksTo("smart-links",[
      ["Все соцсети одним dork (Google)", ENG.google('"'+raw+'" (site:vk.com OR site:t.me OR site:instagram.com OR site:x.com OR site:linkedin.com)')],
      ["Картинки (лица)", "https://yandex.ru/images/search?text="+encodeURIComponent(raw)],
      ["IDCrawl", "https://www.idcrawl.com/u/"+encodeURIComponent(raw.split(/\s+/).join("-").toLowerCase())]
    ]);
  }
}
$("smart-copy").onclick=function(){
  var el=$("smart-out");
  var t=el.textContent||"";
  navigator.clipboard.writeText(t).then(function(){
    $("smart-copy").textContent="✓ Скопировано";
    setTimeout(function(){ $("smart-copy").textContent="Скопировать результаты"; },1400);
  });
};

/* ============ DIAGNOSTICS ============ */
$("diag-go").onclick=function(){
  outShow("diag-out","⏳ проверка библиотек и API...");
  var res=[];
  function check(name,fn){ try{ return fn()? "✓":"✗"; }catch(e){ return "✗"; } }
  res.push(kv("libphonenumber", check("lp",function(){ return typeof libphonenumber!=="undefined"; }))+"\n");
  res.push(kv("crypto-js (md5)", check("cs",function(){ return typeof CryptoJS!=="undefined" && CryptoJS.MD5("test").toString()==="098f6bcd4621d373cade4e832627b4f6"; }))+"\n");
  res.push(kv("exifr", check("ex",function(){ return typeof exifr!=="undefined"; }))+"\n");
  Promise.all([
    doh("example.com","A").catch(function(){ return null; }),
    fetch("https://ipwho.is/").then(function(r){ return r.json(); }).catch(function(){ return null; }),
    fetch("https://api.github.com/users/octocat").then(function(r){ return r.json(); }).catch(function(){ return null; })
  ]).then(function(ars){
    res.push(kv("DoH (dns.google)", ars[0]&&ars[0].Answer? "✓":"✗")+"\n");
    res.push(kv("ipwho.is", ars[1]&&ars[1].success? "✓ ваш IP: "+ars[1].ip : "✗")+"\n");
    res.push(kv("GitHub API", ars[2]&&ars[2].login? "✓":"✗")+"\n");
    outShow("diag-out",res.join(""));
    $("dot").className="dot ok"; $("dot").textContent="●";
  }).catch(function(e){
    outShow("diag-out",res.join(""))
    $("dot").className="dot fail"; $("dot").textContent="●";
  });
};

/* ---------- INIT ---------- */
applyTheme();
try{
  doh("example.com","A").then(function(j){
    if(j&&j.Answer){ $("dot").className="dot ok"; $("dot").textContent="●"; }
    else{ $("dot").className="dot fail"; $("dot").textContent="●"; }
  }).catch(function(){ $("dot").className="dot fail"; $("dot").textContent="●"; });
}catch(e){}
