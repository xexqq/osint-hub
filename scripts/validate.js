const fs = require('fs');
const { execSync } = require('child_process');

const html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('OSINT')) throw new Error('title missing');
if (!html.includes('id="apk-link"')) throw new Error('APK download button missing');
if (!html.includes('api.github.com/repos/xexqq/osint-hub/releases/latest')) throw new Error('release fetch missing');
if (/СКЛЧАТЬ|нажimation|帮助|место|лемма-плейс/.test(html)) throw new Error('artifact text found');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (scripts.length === 0) throw new Error('script block missing');
scripts.forEach((m, i) => {
  fs.writeFileSync(`/tmp/opencode/idx_script_${i}.js`, m[1]);
  execSync(`node --check /tmp/opencode/idx_script_${i}.js`, { stdio: 'inherit' });
});

const con = fs.readFileSync('app/src/main/assets/console.html', 'utf8');
if (!con.includes('id="smart-go"')) throw new Error('console smart search missing');
if (!con.includes('id="s-theme"')) throw new Error('console settings missing');
if (!con.includes('con-smart.js')) throw new Error('console script ref missing');
['con-core.js', 'con-features.js', 'con-smart.js'].forEach(f => {
  const p = 'app/src/main/assets/' + f;
  execSync(`node --check ${p}`, { stdio: 'inherit' });
});

const manifest = fs.readFileSync('app/src/main/AndroidManifest.xml', 'utf8');
if (!manifest.includes('INTERNET')) throw new Error('INTERNET permission missing');
const main = fs.readFileSync('app/src/main/java/com/osint/hub/MainActivity.java', 'utf8');
if (!main.includes('onShowFileChooser')) throw new Error('file chooser missing in MainActivity');

const gradle = fs.readFileSync('app/build.gradle', 'utf8');
const v = gradle.match(/versionName\s*=\s*"([^"]+)"/);
if (!v) throw new Error('versionName missing');
console.log('OK — site + APK checked, version', v[1]);
