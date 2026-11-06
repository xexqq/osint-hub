"use strict";
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;");}
function kv(k,v){return '<span class="k">'+esc(k)+'</span>: '+esc(v);}

/* ---------- SETTINGS ---------- */
var SET={theme:"dark",country:"RU",subdepth:"std",engines:["google"],delay:500,histlog:"on"};
(function(){
  try{
    var s=JSON.parse(localStorage.getItem("osc_set")||"{}");
    Object.keys(SET).forEach(function(k){ if(k in s) SET[k]=s[k]; });
    if(!(SET.delay===0||SET.delay===250||SET.delay===500||SET.delay===900)) SET.delay=500;
    if(!(SET.subdepth in {fast:1,std:1,full:1})) SET.subdepth="std";
  }catch(e){}
})();
function saveSet(){ try{localStorage.setItem("osc_set",JSON.stringify(SET));}catch(e){} }

var SUB_LISTS={
 fast:["www","mail","webmail","vpn","api","app","dev","test","git","admin","portal","smtp","pop","imap","mx","ns1","ns2","stage","beta","demo","cdn","docs"],
 std:["www","mail","webmail","mx","mx1","mx2","smtp","pop","imap","ns1","ns2","ns3","vpn","api","api2","app","apps","dev","test","stage","staging","beta","demo","prod","git","gitlab","ci","jenkins","cd","build","portal","admin","cpanel","backup","db","sql","mysql","pg","postgres","redis","cache","cdn","static","assets","img","images","media","files","dl","download","ftp","sftp","remote","desktop","cloud","s3","storage","k8s","docker","jira","confluence","wiki","monitor","grafana","kibana","elastic","log","logs","intra","internal","corp","office","docs","help","support","sso","auth","login","id","shop","store","pay","billing","crm","erp","hr","panel","m","mobile","old","new","ssh","proxy","lb","edge","gw"],
 full:["www","mail","mail2","mail3","webmail","smtp","smtp2","pop","pop3","imap","imap2","mx","mx1","mx2","mx3","mx4","ns1","ns2","ns3","ns4","vpn","vpn2","api","api2","api3","apis","rest","graphql","app","apps","webapp","dev","dev2","develop","development","test","testing","stage","staging","beta","beta2","alpha","demo","prod","prod2","git","github","gitlab","git2","ci","cd","jenkins","teamcity","build","deploy","portal","portal2","admin","admin2","cpanel","panel","console","manage","manager","backup","bak","db","db2","sql","mysql","mariadb","pg","postgres","mongo","mongodb","redis","memcache","cache","cache2","cdn","cdn2","static","static2","assets","img","img2","images","image","thumb","thumbs","media","files","file","share","fs","dl","download","ftp","ftp2","sftp","ssh","remote","desktop","cloud","cloud2","s3","storage","bucket","k8s","kube","docker","registry","harbor","jira","confluence","wiki","docs","doc","monitor","monitoring","grafana","kibana","elk","elastic","prometheus","nagios","zabbix","log","logs","intra","internal","intranet","corp","office","help","support","faq","sso","auth","auth2","login","signin","account","accounts","id","identity","oidc","oauth","token","keys","vault","keycloak","shop","store","pay","payment","billing","checkout","crm","erp","hr","staff","m","mobile","wap","old","new","v2","beta2","edge","edge2","prx","proxy","proxy2","lb","balancer","haproxy","nginx","apache","gw","gateway","ws","wss","chat","im","msg","push","notify","notifier","socket","news","rss","feed","status","uptime","guard","fw","firewall","router","cctv","cam","cams","nvr","dvr","photo","photos","video","vod","live","stream","streams","rtmp","hls","data","sensor","iot","mqtt","broker","public","collab","meet","forum","board","blog","partners","partner","affiliate","referral"]
};

/* ---------- THEME ---------- */
function applyTheme(){ document.body.classList.toggle("light", SET.theme==="light"); }

/* ---------- TABS ---------- */
document.querySelectorAll("#tabsbar button").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll("#tabsbar button").forEach(function(x){x.classList.remove("on");});
    b.classList.add("on");
    document.querySelectorAll(".pane").forEach(function(p){p.classList.remove("on");});
    var p=$("pane-"+b.dataset.pane);
    if(p) p.classList.add("on");
    if(b.dataset.pane==="hist") renderHist();
  };
});
function gotoPane(name){
  var btn=document.querySelector('#tabsbar button[data-pane="'+name+'"]');
  if(btn) btn.click();
}
document.querySelectorAll(".pane .card input[type=text]").forEach(function(inp){
  inp.addEventListener("keydown",function(e){
    if(e.key==="Enter"){ e.preventDefault(); var btn=inp.closest(".card").querySelector(".row button"); if(btn) btn.click(); }
  });
});

/* ---------- EXTERNAL OPEN (stagger) ---------- */
var openQueue=[], openTimer=null;
function exOpen(url){
  if(SET.delay>0){
    openQueue.push(url);
    if(!openTimer){
      openTimer=setInterval(function(){
        var u=openQueue.shift();
        if(u){ try{ window.open(u,"_blank"); }catch(e){} }
        if(!openQueue.length){ clearInterval(openTimer); openTimer=null; }
      }, SET.delay);
    }
  }else{
    try{ window.open(url,"_blank"); }catch(e){}
  }
}

/* ---------- SETTINGS UI ---------- */
$("s-theme").value=SET.theme; $("s-country").value=SET.country;
$("s-subdepth").value=SET.subdepth; $("s-delay").value=String(SET.delay);
$("s-histlog").value=SET.histlog;
$("s-theme").onchange=function(){SET.theme=this.value;applyTheme();saveSet();};
$("s-country").onchange=function(){SET.country=this.value;saveSet();};
$("s-subdepth").onchange=function(){SET.subdepth=this.value;saveSet();};
$("s-delay").onchange=function(){SET.delay=parseInt(this.value,10)||0;saveSet();};
$("s-histlog").onchange=function(){SET.histlog=this.value;saveSet();};
document.querySelectorAll(".eng").forEach(function(c){
  c.checked=(SET.engines.indexOf(c.value)>-1);
  c.onchange=function(){
    SET.engines=[];
    document.querySelectorAll(".eng:checked").forEach(function(x){SET.engines.push(x.value);});
    saveSet();
  };
});
$("set-reset").onclick=function(){
  SET={theme:"dark",country:"RU",subdepth:"std",engines:["google"],delay:500,histlog:"on"};
  saveSet();
  $("s-theme").value=SET.theme; $("s-country").value=SET.country;
  $("s-subdepth").value=SET.subdepth; $("s-delay").value=String(SET.delay);
  $("s-histlog").value=SET.histlog;
  document.querySelectorAll(".eng").forEach(function(c){ c.checked=(SET.engines.indexOf(c.value)>-1); });
  applyTheme();
};

/* ---------- ENGINES ---------- */
var ENG={
 google:function(q){return "https://www.google.com/search?q="+encodeURIComponent(q);},
 yandex:function(q){return "https://yandex.ru/search/?text="+encodeURIComponent(q);},
 bing:function(q){return "https://www.bing.com/search?q="+encodeURIComponent(q);},
 ddg:function(q){return "https://duckduckgo.com/?q="+encodeURIComponent(q);}
};
function openEng(q){
  (SET.engines.length?SET.engines:["google"]).forEach(function(e){ exOpen(ENG[e](q)); });
}

/* ---------- HISTORY ---------- */
function histAdd(q,note){
  if(SET.histlog!=="on") return;
  var h=[];
  try{ h=JSON.parse(localStorage.getItem("osc_hist")||"[]"); }catch(e){}
  h.unshift({t:Date.now(),q:q,n:note||""});
  try{ localStorage.setItem("osc_hist",JSON.stringify(h.slice(0,50))); }catch(e){}
}
function renderHist(){
  var h=[];
  try{ h=JSON.parse(localStorage.getItem("osc_hist")||"[]"); }catch(e){}
  var el=$("hist-out");
  if(!h.length){ el.innerHTML='<span class="warn">пусто — запустите Умный поиск</span>'; el.style.display="block"; return; }
  var s=h.map(function(x){ return new Date(x.t).toLocaleString()+"  "+x.q+(x.n?"  ["+x.n+"]":""); }).join("\n");
  el.innerHTML=esc(s); el.style.display="block";
}
$("hist-clear").onclick=function(){ try{localStorage.removeItem("osc_hist");}catch(e){} renderHist(); };
$("hist-export").onclick=function(){
  var h=[];
  try{ h=JSON.parse(localStorage.getItem("osc_hist")||"[]"); }catch(e){}
  var s=h.map(function(x){ return new Date(x.t).toISOString()+"\t"+x.q+"\t"+(x.n||""); }).join("\n");
  navigator.clipboard.writeText(s).then(function(){
    $("hist-export").textContent="✓ Скопировано";
    setTimeout(function(){$("hist-export").textContent="Скопировать всё";},1400);
  });
};

/* ---------- OUTPUT HELPERS ---------- */
function outShow(id,html){ var e=$(id); e.innerHTML=html; e.style.display="block"; }
function linksTo(id,items){
  var box=$(id); box.innerHTML=""; box.style.display="block";
  var lbl=document.createElement("div");
  lbl.style.cssText="font-size:11px;color:var(--dim);margin:4px 0 2px";
  lbl.textContent="Открываются во внешнем браузере:";
  box.appendChild(lbl);
  items.forEach(function(it){
    var a=document.createElement("a");
    a.href=it[1]; a.textContent=it[0];
    a.target="_blank"; a.rel="noopener";
    box.appendChild(a);
  });
}

/* ---------- DoH ---------- */
function doh(n,t){
  return fetch("https://dns.google/resolve?name="+encodeURIComponent(n)+"&type="+encodeURIComponent(t))
    .then(function(r){ return r.json(); });
}
function ansList(list){
  return (list||[]).map(function(x){ return "  "+(x.data||""); }).join("\n");
}
function ctrName(ip){
  var p=ip.split(".");
  if(p.length!==4) return null;
  return p.slice().reverse().join(".")+".in-addr.arpa";
}
function cleanDomain(s){
  return s.replace(/^https?:\/\//i,"").replace(/^www\./i,"").split(/[\/?#]/)[0].trim();
}
