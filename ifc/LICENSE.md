# IFC Viewer

© 2026 Caglar Baysal. Alle Rechte vorbehalten.

Der IFC Viewer (Programmcode, Gestaltung und Texte) ist urheberrechtlich geschützt. Nutzung, Vervielfältigung, Weitergabe und Veränderung sind nur mit schriftlicher Erlaubnis des Urhebers gestattet. Anfragen an cagbay@gmail.com.

Modelle, Pläne und Punktwolken, die im Viewer geöffnet werden, verlassen das Gerät nicht und bleiben im Eigentum ihrer Besitzer.

## Verwendete freie Bausteine

Der Viewer enthält die folgenden Bausteine Dritter. Für sie gelten ausschliesslich ihre eigenen Lizenzen, der obige Vorbehalt betrifft sie nicht.

| Baustein | Zweck | Lizenz | Quelle |
|---|---|---|---|
| three.js | 3D Darstellung | MIT | https://github.com/mrdoob/three.js |
| web-ifc | IFC Geometrie | Mozilla Public License 2.0 | https://github.com/ThatOpen/engine_web-ifc |
| pdf.js | PDF Darstellung | Apache License 2.0 | https://github.com/mozilla/pdf.js |
| laz-perf | LAZ Punktwolken | Apache License 2.0 | https://github.com/hobuinc/laz-perf |
| fflate | ZIP und GZIP | MIT | https://github.com/101arrowz/fflate |

### Hinweis zu web-ifc (MPL 2.0)

Die Datei `web-ifc-api.js` aus web-ifc 0.0.77 wurde minimal angepasst: Die WebAssembly Datei wird aus der App selbst übergeben (Haken für `wasmBinary` und `instantiateWasm`), statt sie aus dem Netz zu laden. Sonst ist der Code unverändert. Der Quelltext von web-ifc ist unter der oben genannten Adresse verfügbar, die angepasste Datei liegt im Ordner `thirdparty` neben dieser Datei.

### Kartendaten

Luftbild, Landeskarte, Höhen und Amtliche Vermessung: © swisstopo und geodienste.ch, gemäss deren Nutzungsbedingungen.
