# OSINT::HUB

Одностраничный лаунчер, который **объединяет в одном интерфейсе** топовые GitHub OSINT-проекты и бесплатные веб-сервисы: утечки, базы данных, поиск по фото, никнеймам, телефонам, доменам и IP.

**Живое приложение:** после деплоя доступно через GitHub Pages.

## Возможности

- **Универсальная строка поиска** — вводишь любой локатор (email / ник / телефон / домен / IP / URL / имя), выбираешь тип → «Поиск везде» открывает сразу best-of-сервисы этого типа + генерирует готовый dork для Google.
- **Базы и утечки:** Have I Been Pwned, Intelligence X, LeakCheck, EmailRep, Gravatar (md5), Dehashed, Snusbase, BreachDirectory.
- **Фото / GEOINT:** Google Lens, Yandex Images, Bing Visual, PimEyes, Search4Faces, GeoSpy AI, FotoForensics, Jimpl EXIF, SunCalc, Sherloq.
- **Инфраструктура:** crt.sh, Shodan, Censys, URLScan, Wayback, Netlas, Who.is, ipinfo, AbuseIPDB, AlienVault OTX, BuiltWith, ViewDNS, PublicWWW, DNSDumpster.
- **Соцсети / люди:** WhatsMyName, InstantUsername, IDCrawl, TGStat, пред-сгенерированные dork-и для Telegram / VK / Instagram / X / Pastebin, поиск по Google/DDG/Bing/Yandex.
- **Каталог GitHub-проектов:** OsiNet, Kali NetHunter, GhostTrack, Sherlock, Maigret, theHarvester, PhoneInfoga, holehe, SpiderFoot, Recon-ng, Osintgram, GHunt, Cipher387 Databases, IntelTechniques, Haven.
- **Готовые скрипты Termux** с кнопкой «Копировать».

## Запуск локально

```bash
git clone https://github.com/xexqq/osint-hub
cd osint-hub
python3 -m http.server 8000   # или просто открой index.html
```

## Сборка / Деплой

Автоматический деплой на GitHub Pages через GitHub Actions: `.github/workflows/deploy.yml`
- любые изменения в `main` → новая сборка Pages.
- ручной запуск: вкладка Actions → **Deploy OSINT Hub to Pages** → Run workflow.

Валидация сборки: проверяется наличие index.html и синтаксис JS (node).

## Правовая рамка

Инструменты собраны для легального OSINT: аудита собственного цифрового следа, разрешённых расследований, security research. Сбор персональных данных людей без согласия незаконен.
