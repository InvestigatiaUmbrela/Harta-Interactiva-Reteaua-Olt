# Rețeaua Olt — hartă interactivă

Site static care însoțește documentarul despre rețeaua din județul Olt: clipul,
harta interactivă a legăturilor, cronologia și cifrele.

Harta reproduce planșa din Figma — aceeași paletă (fundal `#171717`, roșu `#990000`,
alb), aceeași gramatică vizuală: conector alb ortogonal, punct la origine,
vârf de săgeată la țintă, etichetă roșie în italic.

## Ce e interactiv

- **Click pe o persoană / instituție / companie** → se deschide fișa ei: rol, ce spune
  documentarul despre ea și lista completă de legături. Restul planșei se stinge,
  ca să rămână aprinse doar relațiile nodului selectat.
- **Click pe o săgeată** → se deschide relația exactă dintre cele două capete,
  cu explicația din documentar. Din fișă se poate sări direct la oricare capăt.
- **Filtre** pe tip (persoană, instituție, companie de stat, companie privată…).
- **Căutare** — scrie un nume și apasă Enter; harta se centrează pe el.
- **Pan & zoom** — trage de planșă, rotița pentru zoom, `Esc` închide, `0` resetează.
- Navigare completă de la tastatură: `Tab` prin noduri și relații, `Enter` deschide.

## Ce trebuie completat

Un singur lucru: **ID-ul clipului de pe YouTube**, în [`js/main.js`](js/main.js), linia 9:

```js
const VIDEO_ID = "";
```

Pentru `https://www.youtube.com/watch?v=ABC123xyz` sau `https://youtu.be/ABC123xyz`,
ID-ul este `ABC123xyz`. Până când e completat, în locul player-ului apare o notă.

## Structura

```
index.html          pagina
css/style.css       tokens, tipografie, componente
js/data.js          NODURILE și RELAȚIILE — aici se editează conținutul
js/map.js           motorul hărții: geometrie conectori, pan/zoom, selecție
js/main.js          video, cronologie, cifre, filtre, panou, animații
assets/             planșa originală
```

### Cum adaugi sau modifici conținut

Tot conținutul stă în `js/data.js`, nicăieri altundeva.

Un nod nou:

```js
{
  id: "identificator", kind: "person", x: 500, y: 400,
  label: ["Prenume", "NUME"], eyebrow: "PSD",
  role: "O linie despre rolul lui în rețea.",
  lead: "Paragraful de deschidere al fișei.",
  facts: ["Punct din documentar.", "Alt punct."],
  src: "harta"
}
```

`kind` poate fi `person`, `office`, `company-state`, `company-private`, `service`
sau `event` — determină culoarea și eticheta de tip. `x` și `y` sunt coordonate în
planșa de `1600 × 980`.

O relație nouă:

```js
{ from: "id_sursa", to: "id_tinta", label: "textul de pe săgeată",
  route: "vhv", mid: 470,
  detail: "Explicația care apare când dai click pe săgeată.", src: "harta" }
```

`route` alege forma traseului: `line` (un cot), `hvh` (orizontal–vertical–orizontal),
`vhv` (vertical–orizontal–vertical), `hv`, `vh`. `mid` fixează coordonata absolută a
segmentului din mijloc, ca să nu se suprapună săgețile. `offset` decalează o săgeată
paralelă cu alta între aceleași noduri.

Câmpul `src` apare în fișă și spune de unde vine informația: `harta` pentru ce e
desenat pe planșă, `documentar` pentru ce e afirmat în naraţiune.

## Publicare pe GitHub Pages

Depozitul nu are nevoie de build — sunt fișiere statice.

1. Creează un depozit gol pe contul dorit (fără README, fără .gitignore).
2. Leagă-l și trimite conținutul:

```bash
git remote add origin https://github.com/UTILIZATOR/DEPOZIT.git
```

```bash
git push -u origin main
```

3. În depozit: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.

Fișierul `.nojekyll` există deja, ca GitHub să servească directoarele așa cum sunt.

## Verificare locală

```bash
python -m http.server 8777
```

Apoi deschide `http://localhost:8777`. Pagina merge și deschisă direct de pe disc
(scripturi clasice, fără module), dar prin server e cel mai aproape de producție.

## Notă la reimport

`assets/board/peace-sign-1.png` este filigranul din fundal. Pluginul îl exportă
la 2×, adică 2830 × 3703 px — 40 MB decodați în memorie pentru un element afișat
la 2% opacitate. Pe telefon, atâta memorie omoară fila.

După fiecare reimport din Figma, micșorează-l la un sfert (~708 × 926 px):

```powershell
Add-Type -AssemblyName System.Drawing
$f = "assetsoard\peace-sign-1.png"
$im = [System.Drawing.Image]::FromFile((Resolve-Path $f))
$b = New-Object System.Drawing.Bitmap([int]($im.Width/4), [int]($im.Height/4))
$g = [System.Drawing.Graphics]::FromImage($b)
$g.InterpolationMode = "HighQualityBicubic"
$g.DrawImage($im, 0, 0, $b.Width, $b.Height)
$im.Dispose(); $g.Dispose()
$b.Save("$PWD\peace-tmp.png", "Png"); $b.Dispose()
Move-Item "$PWD\peace-tmp.png" $f -Force
```

Restul imaginilor pot rămâne la 2×: sunt afișate la jumătate, deci arată clar
pe ecrane dense.

## Prezumția de nevinovăție

Persoanele menționate pe site beneficiază de prezumția de nevinovăție. Acolo unde
există dosare penale, ele sunt în lucru sau au fost clasate. Textele afirmă direct
ce se știe și atribuie instituțiilor — Parchetul European, parchete, ministere —
constatările care le aparțin.
