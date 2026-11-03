# PL-Bestandsmodell Generator

Web App der Projektierung Leitungsbau: Aus dem Shapefile Export des Leitungskatasters (dazu Werkleitungs DXF und Werkplan DXF) entsteht im Browser ein georeferenziertes 3D Bestandsmodell IFC4 (Meter, LV95, LN02).

- Die Python Skripte des PL-Bestandsmodells laufen unverändert im Browser (Pyodide mit IfcOpenShell). Sie liegen verschlüsselt in `app/skripte.enc`, Passwort wie beim IFC Viewer.
- Projektdaten und die WVZ Bauteilbibliothek bleiben auf dem Gerät. Die Bibliothek wird einmal pro Gerät gewählt und im Browser gespeichert.
- Das Geländemodell swissALTI3D (0.5 m) holt die Seite für den Perimeter direkt bei swisstopo. LZW Kacheln liest `lzw.js`.
- Eigener Offline Cache (`sw.js`, Präfix `pl-bestand-`), unabhängig von Plattform und IFC Viewer.

(c) 2026 Caglar Baysal, alle Rechte vorbehalten. Drittsoftware: Pyodide (MPL 2.0), IfcOpenShell (LGPL 3.0), numpy, scipy, shapely, matplotlib, ezdxf, pyshp, openpyxl, tifffile, pytest (je eigene freie Lizenz). Geländemodell © swisstopo.
