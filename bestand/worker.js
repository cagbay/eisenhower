// PL-Bestandsmodell Generator: Rechenteil im Hintergrund (Web Worker mit Pyodide).
// Die Python Skripte des PL-Bestandsmodells laufen unverändert; Projektdaten verlassen das Gerät nicht.
// Nur die swissALTI3D Kacheln werden bei Bedarf direkt bei swisstopo geholt.
// (c) 2026 Caglar Baysal, alle Rechte vorbehalten.

const BASIS = new URL("./", self.location.href).href;
const STAC = "https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissalti3d/items";
const DTM_CACHE = "pl-bestand-swissalti3d";
let py = null;
let bibliothekGeladen = false;
let skripteBereit = false;
const kacheln = new Map();      // URL -> Uint8Array (im Speicher, für weitere Läufe)

const melde = (typ, daten = {}, transfer) => self.postMessage({ typ, ...daten }, transfer || []);
const log = (text) => melde("log", { text });

const WHEELS = [
  "ifcopenshell_pure_python-0.9.1-py3-none-any.whl",
  "ifcopenshell-0.9.1-cp313-cp313-pyodide_2025_0_wasm32.whl",
  "ifcopenshell_parse_schema_ifc4-0.9.1-cp313-cp313-pyodide_2025_0_wasm32.whl",
  "ifcopenshell_parse_schema_ifc4x3_add2-0.9.1-cp313-cp313-pyodide_2025_0_wasm32.whl",
  "ifcopenshell_parse_schema_ifc2x3-0.9.1-cp313-cp313-pyodide_2025_0_wasm32.whl",
  "pyshp-3.1.6-py3-none-any.whl",
  "ezdxf-1.4.4-py3-none-any.whl",
  "openpyxl-3.1.5-py2.py3-none-any.whl",
  "et_xmlfile-2.0.0-py3-none-any.whl",
  "isodate-0.7.2-py3-none-any.whl",
  "lark-1.3.1-py3-none-any.whl",
  "pytest-9.1.1-py3-none-any.whl",
  "pluggy-1.6.0-py3-none-any.whl",
  "iniconfig-2.3.1-py3-none-any.whl",
  "pygments-2.21.0-py3-none-any.whl",
  "tifffile-2026.9.15-py3-none-any.whl",
];

async function holeBytes(pfad) {
  const r = await fetch(BASIS + pfad, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${pfad}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// ------------------------------------------------------------------ Rechenkern
async function starten() {
  const t0 = performance.now();
  const schritt = (s, p) => melde("start", { text: s, prozent: p });
  schritt("Python wird geladen", 5);
  importScripts(BASIS + "py/pyodide.js", BASIS + "lzw.js");
  py = await self.loadPyodide({ indexURL: BASIS + "py/" });
  schritt("numpy, scipy und shapely werden geladen", 30);
  await py.loadPackage(["numpy", "scipy", "shapely", "micropip", "matplotlib", "pyparsing", "typing-extensions", "fonttools"],
    { messageCallback: () => {} });
  schritt("IfcOpenShell und weitere Pakete werden installiert", 65);
  py.globals.set("_wheels", WHEELS.map((w) => BASIS + "wheels/" + w));
  await py.runPythonAsync(`
import micropip
await micropip.install(list(_wheels), deps=False)
`);
  const sp = "/lib/python3.13/site-packages";
  // Kompatibilität: util/placement.py aus IfcOpenShell 0.9.0 (get_local_placement für formstuecke.py)
  py.FS.writeFile(sp + "/ifcopenshell/util/placement.py", await holeBytes("wheels/placement_0_9_0.py"));
  // swissALTI3D ist LZW komprimiert: Ersatz für imagecodecs mit Decoder in JavaScript (lzw.js)
  py.FS.mkdirTree(sp + "/imagecodecs");
  py.FS.writeFile(sp + "/imagecodecs/__init__.py", await holeBytes("wheels/imagecodecs_shim.py"));
  py.setStdout({ batched: (s) => log(s) });
  py.setStderr({ batched: (s) => log(s) });
  melde("motor", { sekunden: Math.round((performance.now() - t0) / 100) / 10 });
}

// ------------------------------------------------------------------ Skripte (verschlüsselt)
async function skripteLaden(rohSchluessel) {
  const info = JSON.parse(new TextDecoder().decode(await holeBytes("app/skripte.json")));
  const daten = await holeBytes("app/skripte.enc");
  const key = await crypto.subtle.importKey("raw", b64(rohSchluessel), "AES-GCM", false, ["decrypt"]);
  let zip;
  try { zip = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(info.iv) }, key, daten)); }
  catch { return false; }
  py.FS.writeFile("/tmp/skripte.zip", zip);
  await py.runPythonAsync(`
import zipfile, os, sys, io, runpy, subprocess, contextlib, types, shutil, json
os.makedirs("/app/bestand", exist_ok=True)
zipfile.ZipFile("/tmp/skripte.zip").extractall("/app/bestand")
os.remove("/tmp/skripte.zip")
sys.path.insert(0, "/app/bestand")
import matplotlib; matplotlib.use("Agg")

# Aufrufe "python skript.py ..." laufen im selben Python, nicht als eigener Prozess
def _run(cmd, capture_output=False, text=False, **kw):
    if cmd and cmd[0] == sys.executable:
        out, err = io.StringIO(), io.StringIO(); code = 0
        alt = sys.argv; sys.argv = list(cmd[1:])
        try:
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                runpy.run_path(cmd[1], run_name="__main__")
        except SystemExit as e:
            code = e.code if isinstance(e.code, int) else (0 if e.code is None else 1)
        except Exception:
            import traceback; err.write(traceback.format_exc()); code = 1
        finally:
            sys.argv = alt
        return types.SimpleNamespace(returncode=code, stdout=out.getvalue(), stderr=err.getvalue())
    return types.SimpleNamespace(returncode=1, stdout="", stderr="im Browser nicht verfügbar: " + " ".join(map(str, cmd)))
subprocess.run = _run

EIGENE = ("bestand_lauf", "shp2ifc", "formstuecke", "log300", "gem001", "ifc106", "tin", "dtm_holen")
def frisch():
    for m in EIGENE: sys.modules.pop(m, None)
    import bestand_lauf
    return bestand_lauf

def projekt_leeren():
    os.makedirs("/projekt", exist_ok=True)
    for n in os.listdir("/projekt"):
        if n == "Ausgabe": continue
        p = os.path.join("/projekt", n)
        shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
`);
  skripteBereit = true;
  return true;
}

// ------------------------------------------------------------------ Projekt
function dateienSchreiben(dateien) {
  py.runPython("projekt_leeren()");
  for (const d of dateien) py.FS.writeFile("/projekt/" + d.name, new Uint8Array(d.daten));
}

async function bibliothekSetzen(daten) {
  py.FS.writeFile("/tmp/bibliothek.zip", new Uint8Array(daten));
  const n = await py.runPythonAsync(`
import zipfile, os, shutil, glob
shutil.rmtree("/app/bibliothek", ignore_errors=True); os.makedirs("/app/bibliothek")
zipfile.ZipFile("/tmp/bibliothek.zip").extractall("/app/bibliothek"); os.remove("/tmp/bibliothek.zip")
len(glob.glob("/app/bibliothek/**/*.ifc", recursive=True))
`);
  bibliothekGeladen = n > 0;
  return n;
}

async function pruefen(dateien) {
  dateienSchreiben(dateien);
  const ergebnis = await py.runPythonAsync(`
import json, io, contextlib
B = frisch(); B.P = B.Protokoll()
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    e = B.finden("/projekt")
    fo = bb = None; dxf = werkplan = []
    if e["shp"]:
        fo, bb = B.pruefe_shape(e["shp"])
        if fo is not None and e["dxf"]:
            dxf, werkplan = B.pruefe_dxf(e["dxf"], bb)
    else:
        B.P.warnung("kein Shapefile Export (ZIP mit Leitung.shp) gefunden.")
json.dumps(dict(zeilen=B.P.zeilen, warnungen=B.P.warn, shp=bool(e["shp"] and fo is not None),
                shp_name=os.path.basename(e["shp"]) if e["shp"] else None,
                bbox=list(bb) if bb is not None else None,
                dxf=[os.path.basename(p) for p in dxf], werkplan=[os.path.basename(p) for p in werkplan],
                dtm=os.path.basename(e["dtm"]) if e["dtm"] else None,
                plankoten=[os.path.basename(p) for p in e["plankoten"]]))
`);
  return JSON.parse(ergebnis);
}

// ------------------------------------------------------------------ Geländemodell swissALTI3D (wie dtm_holen.py)
function lv95ZuWgs84(E, N) {
  const y = (E - 2600000) / 1e6, x = (N - 1200000) / 1e6;
  const lam = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y ** 3;
  const phi = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x ** 3;
  return [lam * 100 / 36, phi * 100 / 36];
}

async function gelaendeHolen(bbox, puffer = 50) {
  const [x0, y0, x1, y1] = [bbox[0] - puffer, bbox[1] - puffer, bbox[2] + puffer, bbox[3] + puffer];
  const noetig = new Set();
  for (let e = Math.floor(x0 / 1000); e <= Math.floor(x1 / 1000); e++)
    for (let n = Math.floor(y0 / 1000); n <= Math.floor(y1 / 1000); n++) noetig.add(`${e}-${n}`);
  log(`\n===== Geländemodell swissALTI3D =====\nPerimeter mit ${puffer} m Puffer: ${noetig.size} Kacheln 1 x 1 km (${[...noetig].join(", ")})`);
  const [lo0, la0] = lv95ZuWgs84(x0, y0), [lo1, la1] = lv95ZuWgs84(x1, y1);
  let url = `${STAC}?bbox=${lo0.toFixed(6)},${la0.toFixed(6)},${lo1.toFixed(6)},${la1.toFixed(6)}&limit=100`;
  const beste = new Map();
  while (url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`swisstopo STAC ${r.status}`);
    const js = await r.json();
    for (const it of js.features || []) for (const a of Object.values(it.assets || {})) {
      const fn = a.href.split("/").pop();
      if (!fn.endsWith("_0.5_2056_5728.tif")) continue;
      const t = fn.split("_"), jahr = +t[1], k = t[2];
      if (noetig.has(k) && (!beste.has(k) || jahr > beste.get(k).jahr)) beste.set(k, { jahr, href: a.href, fn });
    }
    url = ((js.links || []).find((l) => l.rel === "next") || {}).href;
  }
  let cache = null;
  try { cache = await caches.open(DTM_CACHE); } catch { cache = null; }
  const ergebnis = [];
  let i = 0;
  for (const [k, v] of [...beste].sort()) {
    i++;
    let b = kacheln.get(v.href);
    let quelle = "Speicher";
    if (!b && cache) { const hit = await cache.match(v.href); if (hit) { b = new Uint8Array(await hit.arrayBuffer()); quelle = "Browser Cache"; } }
    if (!b) {
      melde("gelaende", { text: `Kachel ${k} (${v.jahr}) wird geladen, ${i} von ${beste.size}` });
      const r = await fetch(v.href);
      if (!r.ok) throw new Error(`Kachel ${k}: ${r.status}`);
      const buf = await r.arrayBuffer(); b = new Uint8Array(buf); quelle = "swisstopo";
      if (cache) { try { await cache.put(v.href, new Response(buf.slice(0))); } catch {} }
    }
    kacheln.set(v.href, b);
    log(`Kachel ${k}: ${v.fn} (${(b.length / 1e6).toFixed(1)} MB, aus ${quelle})`);
    ergebnis.push({ name: v.fn, daten: b });
  }
  const fehlt = [...noetig].filter((k) => !beste.has(k));
  if (fehlt.length) log(`WARNUNG: keine swissALTI3D Kachel für ${fehlt.join(", ")}`);
  return ergebnis;
}

// ------------------------------------------------------------------ Lauf
async function rechnen(dateien, o) {
  dateienSchreiben(dateien);
  if (o.gelaende && o.bbox) {
    try {
      const k = await gelaendeHolen(o.bbox);
      py.FS.mkdirTree("/projekt/swissALTI3D");
      for (const t of k) py.FS.writeFile("/projekt/swissALTI3D/" + t.name, t.daten);
    } catch (ex) {
      log(`WARNUNG: Geländemodell konnte nicht geholt werden (${ex.message || ex}). Terrain aus Scheitel + 1.5 m.`);
      melde("gelaende", { text: "Geländemodell nicht erreichbar, Lauf ohne", fehler: true });
    }
  }
  melde("gelaende", { text: "" });
  py.globals.set("_argv", ["bestand_lauf.py", "/projekt", "--projekt", o.projekt, "--ort", o.ort || o.projekt,
    "--messpunkte", o.messpunkte ? "ja" : "nein", "--formstuecke", o.formstuecke && bibliothekGeladen ? "ja" : "nein",
    ...(bibliothekGeladen ? ["--bibliothek", "/app/bibliothek"] : [])]);
  const rc = await py.runPythonAsync(`
B = frisch(); B.P = B.Protokoll()
sys.argv = list(_argv)
try:
    rc = B.main()
except SystemExit as ex:
    rc = ex.code if isinstance(ex.code, int) else 1
rc
`);
  const ordner = py.runPython(`
import glob
d = sorted(glob.glob("/projekt/Ausgabe/*/"), key=os.path.getmtime)
d[-1] if d else ""
`);
  const aus = [];
  if (ordner) for (const n of py.FS.readdir(ordner)) {
    if (n === "." || n === "..") continue;
    aus.push({ name: n, daten: py.FS.readFile(ordner + n).buffer });
  }
  return { rc, ordner: ordner.split("/").filter(Boolean).pop() || "", dateien: aus };
}

self.onmessage = async (ev) => {
  const m = ev.data;
  try {
    if (m.typ === "starten") await starten();
    else if (m.typ === "schluessel") {
      const ok = await skripteLaden(m.schluessel);
      melde(ok ? "entsperrt" : "gesperrt");
    }
    else if (m.typ === "bibliothek") melde("bibliothek", { anzahl: await bibliothekSetzen(m.daten) });
    else if (m.typ === "pruefen") melde("geprueft", { ergebnis: await pruefen(m.dateien) });
    else if (m.typ === "rechnen") {
      const t0 = performance.now();
      const e = await rechnen(m.dateien, m.optionen);
      melde("fertig", { ...e, sekunden: Math.round((performance.now() - t0) / 100) / 10 }, e.dateien.map((d) => d.daten));
    }
  } catch (ex) {
    melde("fehler", { text: String(ex && ex.message ? ex.message : ex).slice(-3000) });
  }
};
