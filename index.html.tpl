<!DOCTYPE html>

<!-- region vim modline

vim: set tabstop=4 shiftwidth=4 expandtab:
vim: foldmethod=marker foldmarker=region,endregion:

endregion -->

<!-- region header

Copyright Torben Sickert 16.12.2012

License
   This library written by Torben Sickert stand under a creative commons
   naming 3.0 unported license.
   see http://creativecommons.org/licenses/by/3.0/deed.de

endregion -->

<% # region locations

<% IMAGE_PATH = 'image/'
<% IMAGE_APPLE_TOUCH_ICON_PATH = IMAGE_PATH + 'appleTouchIcon/'

<% LESS_PATH = 'less/'
<% STYLE_SHEET_PATH = 'cascardingStyleSheet/'

<% COFFEE_SCRIPT_PATH = 'coffeeScript/'
<% JAVA_SCRIPT_PATH = 'javaScript/'

<% DISTRIBUTION_BUNDLE_FILE_PATH = 'distributionBundle.zip'

<% if not URL:
    <% URL = 'http://thaibault.github.io/' + NAME
<% if not SOURCE_URL:
    <% SOURCE_URL = 'https://github.com/thaibault/' + NAME
<% if not LANGUAGES:
    <% LANGUAGES = 'deDE', 'enUS'

<% # endregion

<% # region runtime

<% START_UP_ANIMATION_NUMBER = 0

<% # endregion

<html lang="<% LANGUAGE %>">

<!-- region header -->

    <head>

    <!-- region meta informations -->

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="<% TAGLINE %>" />

    <!-- endregion -->

    <!-- region fav and touch icons -->

        <link rel="apple-touch-icon-precomposed" sizes="144x144" href="<% IMAGE_APPLE_TOUCH_ICON_PATH %>144x144-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<% IMAGE_APPLE_TOUCH_ICON_PATH %>114x114-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<% IMAGE_APPLE_TOUCH_ICON_PATH %>72x72-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" href="<% IMAGE_APPLE_TOUCH_ICON_PATH %>57x57-precomposed.png" />
        <link rel="shortcut icon" type="image/x-icon" href="<% IMAGE_PATH %>favicon.ico" />

    <!-- endregion -->

    <!-- region resources -->

        <link type="text/css" rel="stylesheet/less" media="screen" href="<% LESS_PATH %>documentation-1.0.less">
        <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
        <!--[if lt IE 9]><script src="<% JAVA_SCRIPT_PATH %>html5shiv-3.7.0.js"></script><![endif]-->
        <script type="text/javascript" src="<% JAVA_SCRIPT_PATH %>coffeeScript-1.6.3.js"></script>
        <script type="text/coffeescript" src="<% COFFEE_SCRIPT_PATH %>require-1.0.coffee"></script>
        <script type="text/coffeescript" src="<% COFFEE_SCRIPT_PATH %>main.coffee"></script>

    <!-- endregion -->

        <title><% NAME %></title>

    </head>

<!-- endregion -->

<!-- region body -->

    <body class="documentation">
        <div class="window-loading-cover"><div></div></div>

    <!-- region header -->

        <div class="header-wrap outer">
            <header class="inner">
                <% START_UP_ANIMATION_NUMBER += 1
                <a class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> forkme-banner" href="<% SOURCE_URL %>">
                    View on GitHub
                    <!--deDE:GitHub-Projekt-->
                    <!--frFR:GitHub-Project-->
                    <i class="icon-github"></i>
                </a>
                <% START_UP_ANIMATION_NUMBER += 1
                <h1 class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> project-title">
                    <a href="<% URL %>"><% NAME %></a>
                </h1>
                <% START_UP_ANIMATION_NUMBER += 1
                <h2 class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> project-tagline">
                    <% TAGLINE %>
                    <br />
                </h2>
                <section class="header-links">
                    <!--NOTE: This elements are shown in reverse order.-->
                    <% if FileHandler('api').is_directory():
                        <% START_UP_ANIMATION_NUMBER += 5 + len(LANGUAGES)
                    <% else:
                        <% START_UP_ANIMATION_NUMBER += 3 + len(LANGUAGES)
                    <% if FileHandler(location=DISTRIBUTION_BUNDLE_FILE_PATH, must_exist=False):
                        <a class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> zip-source-download" href="https://github.com/thaibault/<% NAME %>/zipball/master">src.zip</a>
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> zip-distribution-bundle-download" href="<% DISTRIBUTION_BUNDLE_FILE_PATH %>">app.zip</a>
                    <% else:
                        <a class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> zip-source-download" href="https://github.com/thaibault/<% NAME %>/zipball/master">.zip</a>
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> tar-gz-source-download" href="https://github.com/thaibault/<% NAME %>/tarball/master">.tar.gz</a>
                    <% START_UP_ANIMATION_NUMBER -= 1
                    <i class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> icon-download-tarball"></i>
                    <% for language in LANGUAGES:
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a href="#lang-<% language %>" class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>"><% language[:2] %></a>
                    <% if FileHandler('api').is_directory():
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <span class="glyphicon glyphicon-arrow-left arrow-left-api start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>"></span>
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a href="<% URL %>/api/" class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %>">
                            API Documentation
                            <!--deDE:API-Dokumentation-->
                            <!--frFR:Documentation de l'API-->
                        </a>
                        <% START_UP_ANIMATION_NUMBER += 4 + len(LANGUAGES)
                    <% else:
                        <% START_UP_ANIMATION_NUMBER += 2 + len(LANGUAGES)
                </section>
            </header>
        </div>

    <!-- endregion -->

    <!-- region sections -->

        <div class="main-content-wrap outer">

        <!-- region main content -->

            <section class="main-content inner">
                <% RENDERED_MARKDOWN %>
            </section>

        <!-- endregion -->

        <!-- region about this website -->

            <section class="about-this-website inner">
                <h1>
                    About this website
                    <!--deDE:Impressum-->
                    <!--frFR:Mentions légales-->
                </h1>
                <p>
                    Provider of
                    <!--deDE:Anbieter von -->
                    <!--frFR:Fournisseur de -->
                    <a href="http://thaibault.github.io/<% NAME %>">http://thaibault.github.io/<% NAME %></a>:
                    <br />
                    Torben Sickert
                    <br />
                    Christoph-Mang-Str. 14
                    <br />
                    79100 Freiburg
                    <br />
                    <a href="tel:004917610248185">Phone<!--deDE:Tel.--><!--frFR:Téléphone--> +49 (0) 176 <span>/</span> 10 248 185</a>
                    <br />
                    Email:
                    <a href="mailto:t.sickert@gmail.com">t.sickert@gmail.com</a>
                    <br />
                    Website:<!--deDE:Webseite:--><!--frFR:Site:-->
                    <a href="http://thaibault.github.io/website">http://thaibault.github.io/website</a>
                    <br />
                    <span class="glyphicon glyphicon-arrow-left arrow-left-home"></span>
                    <a href="#home">home<!--deDE:Startseite--><!--frFR:Maison--></a>
                </p>
            </section>
        </div>

        <!-- endregion -->

    <!-- endregion -->

    <!-- region footer -->

        <div class="footer-wrap outer">
            <footer class="inner">
                <% START_UP_ANIMATION_NUMBER += 1
                <p class="start-up-animation-number-<% START_UP_ANIMATION_NUMBER %> copyright">
                    <% NAME %> maintained by
                    <!--deDE:<% NAME %> betrieben von -->
                    <!--frFR:<% NAME %> exploité par -->
                    <a href="https://github.com/thaibault">thaibault</a>
                    &middot; &copy; 2013 Torben Sickert, Inc. &middot;
                    <a href="#about-this-website">about this website<!--deDE:Impressum--><!--frFR:Mentions légales--></a>
                </p>
            </footer>
        </div>

    <!-- endregion -->

        <a href="#top">top</a>
    </body>

<!-- endregion -->

</html>
