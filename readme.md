<!-- !/usr/bin/env markdown
-*- coding: utf-8 -*-
region header
Copyright Torben Sickert (info["~at~"]tsickert.com) 16.12.2012

License
-------

This library written by Torben Sickert stands under a creative commons naming
3.0 unported license. See https://creativecommons.org/licenses/by/3.0/deed.de
endregion -->

<!--|deDE:Projektstatus-->
<!--|frFR:État du projet-->
Project status
--------------

[![npm](https://img.shields.io/npm/v/web-documentation?color=%23d55e5d&label=npm%20package%20version&logoColor=%23d55e5d&style=for-the-badge)](https://www.npmjs.com/package/web-documentation)
[![npm downloads](https://img.shields.io/npm/dy/web-documentation.svg?style=for-the-badge)](https://www.npmjs.com/package/web-documentation)

[![build](https://img.shields.io/github/actions/workflow/status/thaibault/web-documentation/build.yaml?style=for-the-badge)](https://github.com/thaibault/web-documentation/actions/workflows/build.yaml)
[![build push package](https://img.shields.io/github/actions/workflow/status/thaibault/web-documentation/build-package-and-push.yaml?label=build%20push%20package&style=for-the-badge)](https://github.com/thaibault/web-documentation/actions/workflows/build-package-and-push.yaml)

[![check types](https://img.shields.io/github/actions/workflow/status/thaibault/web-documentation/check-types.yaml?label=check%20types&style=for-the-badge)](https://github.com/thaibault/web-documentation/actions/workflows/check-types.yaml)
[![lint](https://img.shields.io/github/actions/workflow/status/thaibault/web-documentation/lint.yaml?label=lint&style=for-the-badge)](https://github.com/thaibault/web-documentation/actions/workflows/lint.yaml)
[![test](https://img.shields.io/github/actions/workflow/status/thaibault/web-documentation/test-coverage-report.yaml?label=test&style=for-the-badge)](https://github.com/thaibault/web-documentation/actions/workflows/test-coverage-report.yaml)

[![code coverage](https://img.shields.io/coverallsCoverage/github/thaibault/web-documentation?label=code%20coverage&style=for-the-badge)](https://coveralls.io/github/thaibault/web-documentation)

<!--|deDE:Einsatzmöglichkeiten-->
<!--|frFR:Cas d'utilisation-->
Use case
--------

Web-Documentation turns the "readme.md" of any npm project into a
multilingual project homepage and publishes it via GitHub Pages. You keep
writing plain markdown that GitHub renders as usual. The generated website
adds a header with tagline, language switch, download links, a generated table
of contents, live examples and a linked API documentation.
<!--deDE:
    Web-Documentation verwandelt die "readme.md" eines beliebigen npm-Projekts
    in eine mehrsprachige Projekt-Homepage und veröffentlicht sie über GitHub
    Pages. Sie schreiben weiterhin einfaches Markdown, das GitHub wie gewohnt
    darstellt. Die generierte Webseite ergänzt einen Kopfbereich mit Slogan,
    Sprachumschalter, Download-Links, ein automatisch erzeugtes
    Inhaltsverzeichnis, Live-Beispiele und eine verlinkte API-Dokumentation.
-->
<!--frFR:
    Web-Documentation transforme le "readme.md" de n'importe quel projet npm
    en une page d'accueil multilingue et la publie via GitHub Pages. Vous
    continuez à écrire du markdown simple que GitHub affiche comme d'habitude.
    Le site généré ajoute un en-tête avec slogan, sélecteur de langue, liens de
    téléchargement, une table des matières générée, des exemples interactifs et
    une documentation d'API liée.
-->

Features included:
<!--deDE:Enthaltene Funktionen:-->
<!--frFR:Fonctionnalités incluses:-->

- One command to build and publish the whole documentation website.<!--deDE:Ein Befehl erstellt und veröffentlicht die komplette Dokumentationswebseite.--><!--frFR:Une seule commande construit et publie l'ensemble du site de documentation.-->
- Multilingual content written as HTML comments directly inside markdown.<!--deDE:Mehrsprachige Inhalte als HTML-Kommentare direkt im Markdown.--><!--frFR:Contenu multilingue écrit sous forme de commentaires HTML directement dans le markdown.-->
- Executable live examples for HTML, CSS and JavaScript code blocks.<!--deDE:Ausführbare Live-Beispiele für HTML-, CSS- und JavaScript-Codeblöcke.--><!--frFR:Exemples interactifs exécutables pour les blocs de code HTML, CSS et JavaScript.-->
- Generated table of contents and syntax highlighting.<!--deDE:Automatisch erzeugtes Inhaltsverzeichnis und Syntaxhervorhebung.--><!--frFR:Table des matières générée et coloration syntaxique.-->
- Versioned API documentation if your project provides a "document" script.<!--deDE:Versionierte API-Dokumentation, sofern Ihr Projekt ein "document"-Skript bereitstellt.--><!--frFR:Documentation d'API versionnée si votre projet fournit un script "document".-->
- Downloadable ZIP bundle of your distributed files.<!--deDE:Herunterladbares ZIP-Archiv Ihrer ausgelieferten Dateien.--><!--frFR:Archive ZIP téléchargeable de vos fichiers distribués.-->
- Ready to use GitHub action for continuous deployment.<!--deDE:Einsatzbereite GitHub-Action für kontinuierliche Veröffentlichung.--><!--frFR:Action GitHub prête à l'emploi pour un déploiement continu.-->

<div class="wd-table-of-contents">
    <h2 id="content">Content<!--deDE:Inhalt--><!--frFR:Contenu--></h2>
    <!--wd-table-of-contents-->
</div>

<!--|deDE:Funktionsweise-->
<!--|frFR:Fonctionnement-->
How it works
------------

Running "web-documentation" inside your project performs these steps:
<!--deDE:Der Aufruf von "web-documentation" in Ihrem Projekt führt folgende Schritte aus:-->
<!--frFR:L'exécution de "web-documentation" dans votre projet effectue les étapes suivantes:-->

1. Checks out and pulls branch "main".<!--deDE:Wechselt auf den Branch "main" und aktualisiert ihn.--><!--frFR:Bascule sur la branche "main" et la met à jour.-->
2. Merges all "readme.*" files found in your project ("node_modules" and
   "build" excluded) into one markdown document.<!--deDE:Fügt alle im Projekt gefundenen "readme.*"-Dateien (ohne "node_modules" und "build") zu einem Markdown-Dokument zusammen.--><!--frFR:Fusionne tous les fichiers "readme.*" du projet (hors "node_modules" et "build") en un seul document markdown.-->
3. Runs "yarn build" if present and zips all files listed in "files" and
   "main" of your "package.json".<!--deDE:Führt "yarn build" aus, falls vorhanden, und packt alle in "files" und "main" Ihrer "package.json" gelisteten Dateien in ein ZIP-Archiv.--><!--frFR:Exécute "yarn build" s'il existe et compresse tous les fichiers listés dans "files" et "main" de votre "package.json".-->
4. Runs "yarn document" if present to generate the API documentation.<!--deDE:Führt "yarn document" aus, falls vorhanden, um die API-Dokumentation zu erzeugen.--><!--frFR:Exécute "yarn document" s'il existe pour générer la documentation d'API.-->
5. Fetches this website template (from a sibling folder "../web-documentation"
   or from GitHub), renders your content into it and commits the result to
   branch "gh-pages".<!--deDE:Lädt diese Webseiten-Vorlage (aus dem Nachbarordner "../web-documentation" oder von GitHub), rendert Ihren Inhalt hinein und committet das Ergebnis in den Branch "gh-pages".--><!--frFR:Récupère ce modèle de site (depuis le dossier voisin "../web-documentation" ou depuis GitHub), y injecte votre contenu et commite le résultat sur la branche "gh-pages".-->

<!--|deDE:Einstieg-->
<!--|frFR:Prise en main-->
Getting started
---------------

Add the package as development dependency and register a script:
<!--deDE:
    Fügen Sie das Paket als Entwicklungsabhängigkeit hinzu und registrieren
    Sie ein Skript:
-->
<!--frFR:
    Ajoutez le paquet comme dépendance de développement et déclarez un script:
-->

```bash
yarn add --dev web-documentation
```

```JSON
{
    "scripts": {
        "update:documentation": "web-documentation"
    }
}
```

Your repository needs a "gh-pages" branch which is served by GitHub Pages.
Create it once and run the script from a clean working copy:
<!--deDE:
    Ihr Repository benötigt einen "gh-pages"-Branch, der von GitHub Pages
    ausgeliefert wird. Legen Sie ihn einmalig an und starten Sie das Skript
    aus einer sauberen Arbeitskopie:
-->
<!--frFR:
    Votre dépôt a besoin d'une branche "gh-pages" servie par GitHub Pages.
    Créez-la une seule fois puis lancez le script depuis une copie de travail
    propre:
-->

```bash
git switch --orphan gh-pages
git commit --allow-empty --message 'Initial commit.'
git push --set-upstream origin gh-pages
git switch main

yarn update:documentation
```

<!--|deDE:Konfiguration-->
<!--|frFR:Configuration-->
Configuration
-------------

Everything is optional. Add a "webDocumentation" section to your
"package.json" to customize the generated website:
<!--deDE:
    Alles ist optional. Ergänzen Sie einen Abschnitt "webDocumentation" in
    Ihrer "package.json", um die generierte Webseite anzupassen:
-->
<!--frFR:
    Tout est optionnel. Ajoutez une section "webDocumentation" à votre
    "package.json" pour personnaliser le site généré:
-->

```JSON
{
    "webDocumentation": {
        "languages": ["enUS", "deDE", "frFR"],
        "name": "my-project",
        "sourceURL": "https://github.com/user/my-project",
        "tagline": "Short slogan.<!--deDE:Kurzer Slogan.--><!--frFR:Slogan court.-->",
        "url": "https://user.github.io/my-project"
    }
}
```

- "languages": Offered languages, the first one is the default. Defaults to only
  "enUS" which hides the language switch.<!--deDE:"languages": Angebotene Sprachen, die erste ist die Standardsprache. Standardmäßig nur "enUS", wodurch der Sprachumschalter ausgeblendet wird.--><!--frFR:"languages": Langues proposées, la première est la langue par défaut. Par défaut uniquement "enUS", ce qui masque le sélecteur de langue.-->
- "name": Title of the website. Defaults to the package name.<!--deDE:"name": Titel der Webseite. Standardmäßig der Paketname.--><!--frFR:"name": Titre du site. Par défaut le nom du paquet.-->
- "sourceURL": Link to the source code repository, used for the "fork me"
  banner and the source download links. Defaults to the "repository" of
  your "package.json".<!--deDE:"sourceURL": Link zum Quellcode-Repository, verwendet für das "Fork me"-Banner und die Quellcode-Download-Links. Standardmäßig das "repository" Ihrer "package.json".--><!--frFR:"sourceURL": Lien vers le dépôt du code source, utilisé pour la bannière "fork me" et les liens de téléchargement des sources. Par défaut le "repository" de votre "package.json".-->
- "tagline": Subtitle of the website. Defaults to the package description. It
  may contain translation comments as well.<!--deDE:"tagline": Untertitel der Webseite. Standardmäßig die Paketbeschreibung. Er darf ebenfalls Übersetzungskommentare enthalten.--><!--frFR:"tagline": Sous-titre du site. Par défaut la description du paquet. Il peut également contenir des commentaires de traduction.-->
- "url": Public address of the generated website, used for the title, API
  documentation and download links. Defaults to the "homepage" of your
  "package.json".<!--deDE:"url": Öffentliche Adresse der generierten Webseite, verwendet für den Titel, die API-Dokumentation und Download-Links. Standardmäßig die "homepage" Ihrer "package.json".--><!--frFR:"url": Adresse publique du site généré, utilisée pour le titre, la documentation d'API et les liens de téléchargement. Par défaut la "homepage" de votre "package.json".-->

Source download links follow the GitHub archive scheme
("&lt;sourceURL&gt;/zipball/main"). Without "url" and "homepage" the
website falls back to "https://tsickert.com/&lt;name&gt;", without
"sourceURL" and "repository" to "https://github.com/thaibault/&lt;name&gt;".
<!--deDE:
    Quellcode-Download-Links folgen dem GitHub-Archivschema
    ("&lt;sourceURL&gt;/zipball/main"). Ohne "url" und "homepage"
    verwendet die Webseite "https://tsickert.com/&lt;name&gt;", ohne
    "sourceURL" und "repository"
    "https://github.com/thaibault/&lt;name&gt;".
-->
<!--frFR:
    Les liens de téléchargement des sources suivent le schéma d'archive de
    GitHub ("&lt;sourceURL&gt;/zipball/main"). Sans "url" ni "homepage", le
    site utilise "https://tsickert.com/&lt;name&gt;", sans "sourceURL" ni
    "repository" "https://github.com/thaibault/&lt;name&gt;".
-->

<!--|deDE:Readme schreiben-->
<!--|frFR:Rédiger le readme-->
Writing your readme
-------------------

<!--|deDE:Mehrsprachigkeit-->
<!--|frFR:Multilinguisme-->
### Multiple languages

Write your content in the default language and append translations as HTML
comments prefixed with a language code. GitHub hides these comments, the
website switches between them via
[web-internationalization](https://tsickert.com/web-internationalization).
<!--deDE:
    Schreiben Sie Ihre Inhalte in der Standardsprache und hängen Sie
    Übersetzungen als HTML-Kommentare mit vorangestelltem Sprachkürzel an.
    GitHub blendet diese Kommentare aus, die Webseite wechselt zwischen ihnen
    mittels
    [web-internationalization](https://tsickert.com/web-internationalization).
-->
<!--frFR:
    Rédigez votre contenu dans la langue par défaut et ajoutez les traductions
    sous forme de commentaires HTML préfixés par un code de langue. GitHub
    masque ces commentaires, le site bascule entre eux grâce à
    [web-internationalization](https://tsickert.com/web-internationalization).
-->

A comment directly after a paragraph or inside an element translates what
precedes it. A comment starting with "|" translates the following element,
which is handy for headings:
<!--deDE:
    Ein Kommentar direkt nach einem Absatz oder innerhalb eines Elements
    übersetzt das Vorangehende. Ein Kommentar, der mit "|" beginnt, übersetzt
    das nachfolgende Element, was sich für Überschriften anbietet:
-->
<!--frFR:
    Un commentaire placé directement après un paragraphe ou à l'intérieur d'un
    élément traduit ce qui le précède. Un commentaire commençant par "|"
    traduit l'élément suivant, ce qui est pratique pour les titres:
-->

```Markdown
<!--|deDE:Beispiel-->
<!--|frFR:Exemple-->
Example
-------

A paragraph in American English.
<!--deDE:
    Ein Absatz auf Deutsch.
-->
<!--frFR:
    Un paragraphe en français.
-->

- A list item.<!--deDE:Ein Listeneintrag.--><!--frFR:Un élément de liste.-->
```

<!--|deDE:Live-Beispiele-->
<!--|frFR:Exemples interactifs-->
### Live examples

Put a "showExample" comment in front of a code block to render or execute it
below the code on the website:
<!--deDE:
    Setzen Sie einen "showExample"-Kommentar vor einen Codeblock, um ihn auf
    der Webseite unterhalb des Codes darzustellen oder auszuführen:
-->
<!--frFR:
    Placez un commentaire "showExample" devant un bloc de code pour l'afficher
    ou l'exécuter sous le code sur le site:
-->

- "showExample": Renders HTML inside an example box.<!--deDE:"showExample": Stellt HTML in einem Beispielrahmen dar.--><!--frFR:"showExample": Affiche le HTML dans un cadre d'exemple.-->
- "showExample:hidden": Injects HTML without example box.<!--deDE:"showExample:hidden": Fügt HTML ohne Beispielrahmen ein.--><!--frFR:"showExample:hidden": Injecte le HTML sans cadre d'exemple.-->
- "showExample:CSS": Applies the stylesheet to the page.<!--deDE:"showExample:CSS": Wendet das Stylesheet auf die Seite an.--><!--frFR:"showExample:CSS": Applique la feuille de style à la page.-->
- "showExample:JavaScript": Runs the code as JavaScript module.<!--deDE:"showExample:JavaScript": Führt den Code als JavaScript-Modul aus.--><!--frFR:"showExample:JavaScript": Exécute le code comme module JavaScript.-->

````Markdown
<!--showExample-->

```HTML
<p>Rendered below the code.</p>
```
````

<!--|deDE:Inhaltsverzeichnis-->
<!--|frFR:Table des matières-->
### Table of contents

Place this snippet where the generated table of contents should appear:
<!--deDE:
    Platzieren Sie dieses Snippet dort, wo das generierte Inhaltsverzeichnis
    erscheinen soll:
-->
<!--frFR:
    Placez cet extrait à l'endroit où la table des matières générée doit
    apparaître:
-->

```HTML
<div class="wd-table-of-contents">
    <h2 id="content">Content<!--deDE:Inhalt--><!--frFR:Contenu--></h2>
    <!--wd-table-of-contents-->
</div>
```

<!--|deDE:Kontinuierliche Veröffentlichung-->
<!--|frFR:Déploiement continu-->
Continuous deployment
---------------------

This repository is a composite GitHub action as well. It installs your
dependencies and runs "yarn update:documentation". The job needs write access
to push the "gh-pages" branch:
<!--deDE:
    Dieses Repository ist zugleich eine zusammengesetzte GitHub-Action. Sie
    installiert Ihre Abhängigkeiten und führt "yarn update:documentation" aus.
    Der Job benötigt Schreibrechte, um den Branch "gh-pages" zu pushen:
-->
<!--frFR:
    Ce dépôt est également une action GitHub composite. Elle installe vos
    dépendances et exécute "yarn update:documentation". Le job a besoin d'un
    accès en écriture pour pousser la branche "gh-pages":
-->

```YAML
name: Deploy documentation website

on:
  workflow_dispatch:

jobs:
  main:
    runs-on: ubuntu-latest
    container: node:lts
    permissions:
      contents: write

    steps:
      - uses: thaibault/web-documentation@main
```

<!--|deDE:Entwicklung-->
<!--|frFR:Développement-->
Development
-----------

To work on the website template itself, clone this repository next to your
project. The deploy script then uses your local copy instead of fetching it
from GitHub.
<!--deDE:
    Um an der Webseiten-Vorlage selbst zu arbeiten, klonen Sie dieses
    Repository neben Ihr Projekt. Das Deploy-Skript verwendet dann Ihre lokale
    Kopie, anstatt sie von GitHub zu laden.
-->
<!--frFR:
    Pour travailler sur le modèle de site lui-même, clonez ce dépôt à côté de
    votre projet. Le script de déploiement utilise alors votre copie locale au
    lieu de la récupérer depuis GitHub.
-->

```bash
yarn install
yarn serve # Preview with "node_modules/clientnode/readme.md" as content.
yarn test
```
