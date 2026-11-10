# PL-Bestandsmodell Generator

Web App der Projektierung Leitungsbau: Aus dem Shapefile Export des Leitungskatasters (dazu Werkleitungs DXF und Werkplan DXF) entsteht im Browser ein georeferenziertes 3D Bestandsmodell IFC 4.3 oder IFC 4 (Meter, LV95, LN02).

- Die Python Skripte des PL-Bestandsmodells laufen unverändert im Browser (Pyodide mit IfcOpenShell). Sie liegen verschlüsselt je Skriptstand in `app/skripte_<ID>.enc` (dazu `app/skripte_<ID>.json`), Passwort wie beim IFC Viewer. Die Liste der Stände steht in `app/staende.json` (`id`, `anzeige`, `datum`, `optionen`, `neuester`).
- Skriptstände (ab v1.5, 10.11.2026): Auswahl «Skriptstand» oben, vorgewählt der neueste. Geladen wird nur der gewählte Stand, beim Umschalten wird der Python Motor neu bestückt. Jedes Paket liegt eigen im Offline Cache, nach einmaligem Laden lässt sich offline umschalten. Stände: `2026-11-10` (Albisriederstrasse: TAZ Farben, IFC 4.3, Armaturen aus der Bauteilbibliothek, Höhenausgleich) und `2026-10-16` (bisheriges Paket, unverändert). Neue Felder (Farben, TAZ Stand, IFC Version, Armaturen, Höhen ausgleichen) erscheinen nur bei Ständen, die sie kennen.
- `app/skripte.enc` und `app/skripte.json` sind eine Kopie des Stands 16.10. für noch offene Seiten v1.4; entfernen, wenn v1.5 überall angekommen ist.
- Neuer Stand: im Server Repo `cagbay/shp2ifc` den Ordner `skripte/<ID>/` anlegen, Eintrag in `app/staende.json`, dann `werkzeuge/browser_packen.sh <ID> <Basis>`. Alte Pakete werden nie überschrieben. Seite und Pakete nur zusammen veröffentlichen.
- Projektdaten und die WVZ Bauteilbibliothek bleiben auf dem Gerät. Die Bibliothek wird einmal pro Gerät gewählt und im Browser gespeichert.
- Das Geländemodell swissALTI3D (0.5 m) holt die Seite für den Perimeter direkt bei swisstopo. LZW Kacheln liest `lzw.js`.
- Eigener Offline Cache (`sw.js`, Präfix `pl-bestand-`), unabhängig von Plattform und IFC Viewer.

(c) 2026 Caglar Baysal, alle Rechte vorbehalten. Drittsoftware: Pyodide (MPL 2.0), IfcOpenShell (LGPL 3.0), numpy, scipy, shapely, matplotlib, ezdxf, pyshp, openpyxl, tifffile, pytest (je eigene freie Lizenz). Geländemodell © swisstopo.
