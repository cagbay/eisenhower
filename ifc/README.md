# IFC Viewer

Web App zum Ansehen von IFC Modellen im Browser und auf dem iPad. Die IFC Dateien werden nur auf dem Gerät verarbeitet und nirgends hochgeladen.

## Funktionen

- IFC2x3, IFC4 und IFC4x3 als .ifc oder .ifczip, mehrere Modelle gleichzeitig
- Struktur, Klassen, Suche und Eigenschaften (Psets, Mengen, Material)
- Messen mit Höhendifferenz und Gefälle, Schnitt, Zoomfenster, Röntgen, Kanten
- Modellfarben pro Datei, Nordpfeil, Koordinaten in LV95 und WGS84
- Luftbild, Landeskarte und Amtliche Vermessung von swisstopo als Gelände im 3D
- Pläne als PDF unter dem Modell: GeoPDF in LV95 werden automatisch platziert, andere Pläne mit zwei Passpunkten eingepasst
- Amtliche Vermessung als WMS von geodienste.ch unter dem Modell, im Bereich Karte, das Bild folgt der Ansicht
- Punktwolken als LAZ oder LAS in LV95, auch direkt als ZIP Download, mit Farbe nach Klasse, Höhe oder Intensität und Klassenfilter

## Auf GitHub Pages veröffentlichen

1. Auf github.com oben rechts **+** und **New repository** wählen.
2. Name zum Beispiel `ifc-viewer`, Sichtbarkeit **Public**, dann **Create repository**.
3. Auf der leeren Seite den Link **uploading an existing file** anklicken.
4. Alle Dateien aus diesem Paket hineinziehen, inklusive Ordner `icons`. Unten **Commit changes**.
5. Im Repository **Settings**, links **Pages**. Bei **Source** die Option **Deploy from a branch**, dann Branch **main** und Ordner **/ (root)** wählen und **Save**.
6. Nach ein bis zwei Minuten ist die App erreichbar unter `https://BENUTZERNAME.github.io/ifc-viewer/`.

## Auf dem iPad installieren

1. Die Adresse in **Safari** öffnen.
2. Auf **Teilen** tippen, dann **Zum Home-Bildschirm** und **Hinzufügen**.
3. Die App startet danach über ihr Symbol im Vollbild und funktioniert auch ohne Netz. Nur die swisstopo Karte braucht Internet.

## Aktualisieren

Neue `index.html` und `sw.js` im Repository hochladen und dabei die alten ersetzen. Die App lädt die neue Version im Hintergrund und zeigt sie beim nächsten Start.

## Hinweis

Ein öffentliches Repository zeigt nur den Programmcode der App. Modelle und Daten, die du in der App öffnest, verlassen das Gerät nicht.

Kartendaten: © swisstopo. Geometrie: web-ifc (That Open Company, MPL 2.0), 3D: three.js (MIT), PDF: pdf.js (Mozilla, Apache 2.0), LAZ: laz-perf (Hobu, Apache 2.0).
