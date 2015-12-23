doctype html

<% # region header

<% # Copyright Torben Sickert 16.12.2012

<% # License
<% # =======

<% # This library written by Torben Sickert stand under a creative commons naming
<% # 3.0 unported license. see http://creativecommons.org/licenses/by/3.0/deed.de

<% # endregion

<% # region language

<% LANGUAGES = LANGUAGES if LANGUAGES else ('deDE', 'enUS', 'frFR')

<% # endregion

<%  # region location

<% IMAGE_PATH = 'image/'

<% LESS_PATH = 'less/'
<% CASCADING_STYLE_SHEET_PATH = 'cascadingStyleSheet/'

<% COFFEE_SCRIPT_PATH = 'coffeeScript/'
<% JAVA_SCRIPT_PATH = 'javaScript/'

<% DISTRIBUTION_BUNDLE_FILE_PATH = 'distributionBundle.zip'

<% # endregion

<% # region runtime

<% URL = URL if URL else 'http://torben.website/%s' % NAME
<% if not SOURCE_URL:
    <% SOURCE_URL = 'https://github.com/thaibault/%s' % NAME
<% START_UP_ANIMATION_NUMBER = 0

<% # endregion

html(lang='<% LANGUAGE %>')

    // region head

    head
        title <% NAME %>

        // region meta in formations

        meta(charset='utf-8')
        meta(
            name='viewport' content='width=device-width, initial-scale=1.0')
        meta(
            name='description'
            content='<% RegularExpression('^(.+?)<!--.+-->$').sub('\1', TAGLINE) %>')

        // endregion

        // region fav and touch icons

        link(
            rel='shortcut icon' type='image/x-icon'
            href='<% IMAGE_PATH %>favicon.ico')

        // endregion

        // region pre load resources

        link(
            type='text/css' rel='stylesheet'
            href='<% CASCADING_STYLE_SHEET_PATH %>main.css')

        // endregion

    // endregion

    // region body

    body(class='documentation')
        .website-window-loading-cover.tools-visible-on-javascript-enabled
            div

        // region header

        .header-wrap.outer: header.inner
            <% START_UP_ANIMATION_NUMBER += 1
            a.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.forkme-banner(
                href='<% SOURCE_URL %>'
            )
                | View on GitHub
                //deDE:GitHub-Projekt
                //frFR:GitHub-Project
                i.icon-github
            <% START_UP_ANIMATION_NUMBER += 1
            h1.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.project-title
                a(href='<% URL %>') <% NAME %>
            <% START_UP_ANIMATION_NUMBER += 1
            h2.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.project-tagline
                | <% TAGLINE %>
                br
            section.header-links
                //NOTE: This elements are shown in reverse order.
                <% if FileHandler('api').is_directory():
                    <% START_UP_ANIMATION_NUMBER += 5 + length(LANGUAGES)
                <% else:
                    <% START_UP_ANIMATION_NUMBER += 3 + length(LANGUAGES)
                <% if FileHandler(location=DISTRIBUTION_BUNDLE_FILE_PATH, must_exist=false):
                    a.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.zip-source-download(
                        href='https://github.com/thaibault/<% NAME %>/zipball/master'
                    ) src.zip
                    <% START_UP_ANIMATION_NUMBER -= 1
                    a.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.zip-distribution-bundle-download(
                        href='<% DISTRIBUTION_BUNDLE_FILE_PATH %>'
                    ) app.zip
                <% else:
                    a.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.zip-source-download(
                        href='https://github.com/thaibault/<% NAME %>/zipball/master'
                    ) .zip
                    <% START_UP_ANIMATION_NUMBER -= 1
                    a.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.tar-gz-source-download(
                        href='https://github.com/thaibault/<% NAME %>/tarball/master'
                    ) .tar.gz
                <% START_UP_ANIMATION_NUMBER -= 1
                i.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.icon-download-arrow
                <% for language in LANGUAGES:
                    <% START_UP_ANIMATION_NUMBER -= 1
                    a.tools-visible-on-javascript-enabled.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>(
                        href='#lang-<% language %>'
                    ) <% language[:2] %>
                <% if FileHandler('api').is_directory():
                    <% START_UP_ANIMATION_NUMBER -= 1
                    span.glyphicon.glyphicon-arrow-left.arrow-left-api.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>
                    <% START_UP_ANIMATION_NUMBER -= 1
                    a.api-link.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>(
                        href='<% URL %>/api/'
                    )
                        langreplace
                            | API
                            span
                                = ' '
                                | Documentation
                        //deDE:API<span>-Dokumentation</span>
                        //frFR:<span>Documentation de l'</span>API
                    <% START_UP_ANIMATION_NUMBER += 4 + length(LANGUAGES)
                <% else:
                    <% START_UP_ANIMATION_NUMBER += 2 + length(LANGUAGES)

        // endregion

        // region sections

        .main-content-wrap.outer

            // region main content

            section.main-content.inner<% '' if 'CONTENT_IN_JADE' in locals() and CONTENT_IN_JADE else '.' %>
                <% CONTENT.replace('\n', '\n                ') %>

            // endregion

            // region about this website

            section.about-this-website.inner
                h2(id='about-this-website')
                    | About this website
                    //deDE:Impressum--><!--frFR:Mentions légales
                p
                    | Provider of
                    //deDE:Anbieter von
                    //frFR:Fournisseur de
                    a(href='http://thaibault.github.io/<% NAME %>')
                        | http://thaibault.github.io/<% NAME %>
                    | :
                    br
                    | Torben Sickert
                    br
                    | Christoph-Mang-Str. 14
                    br
                    | 79100 Freiburg
                    br
                    | Phone:
                    //deDE:Tel.:
                    //frFR:Téléphone:
                    = ' '
                    a(href='tel:004917610248185')
                        | +49 (0) 176
                        span /
                        | 10 248 185
                    br
                    | Email:
                    //deDE:E-Mail:
                    = ' '
                    a(href='mailto:t.sickert@gmail.com')
                        | t.sickert@gmail.com
                    br
                    | Website:
                    = ' '
                    //deDE:Webseite:
                    //frFR:Site:
                    a(href='http://thaibault.github.io/website')
                        | http://thaibault.github.io/website
                    br
                    span.glyphicon.glyphicon-arrow-left.arrow-left-home.tools-visible-on-javascript-enabled
                    a.tools-visible-on-javascript-enabled(href='#home')
                        | home
                        //deDE:Startseite
                        //frFR:Maison
                <% include('aboutThisWebsite.jade')

            // endregion

        // endregion

        // region footer

        .footer-wrap.outer
            footer.inner
                <% START_UP_ANIMATION_NUMBER += 1
                p.website-start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>.copyright
                    | <% NAME %> maintained by
                    //deDE:<% NAME %> betrieben von
                    //frFR:<% NAME %> exploité par
                    = ' '
                    a(href='https://github.com/thaibault') thaibault
                    = ' '
                    | &middot; &copy; 2013 Torben Sickert &middot;
                    = ' '
                    a(href='#about-this-website')
                        | about this website
                        //deDE:Impressum
                        //frFR:Mentions légales

        // endregion

        a(href='#top')
            | top
            //deDE:nach oben
            //frFR:ascendant

        // region post load resources

        script(type='text/javascript' src='<% JAVA_SCRIPT_PATH %>main.js')

        // endregion

    // endregion

//-
    region vim modline

    vim: set tabstop=4 shiftwidth=4 expandtab:
    vim: foldmethod=marker foldmarker=region,endregion:

    endregion
