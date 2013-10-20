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

<% # endregion

<% # region runtime

<% START_UP_ANIMATION_NUMBER = 1

<% # endregion

<!-- region header -->

<html lang="<%LANGUAGE%>">
    <head>

    <!-- region meta informations -->

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="<%TAGLINE%>" />

    <!-- endregion -->

    <!-- region fav and touch icons -->

        <link rel="apple-touch-icon-precomposed" sizes="144x144" href="<%IMAGE_APPLE_TOUCH_ICON_PATH%>144x144-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<%IMAGE_APPLE_TOUCH_ICON_PATH%>114x114-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<%IMAGE_APPLE_TOUCH_ICON_PATH%>72x72-precomposed.png" />
        <link rel="apple-touch-icon-precomposed" href="<%IMAGE_APPLE_TOUCH_ICON_PATH%>57x57-precomposed.png" />
        <link rel="shortcut icon" type="image/x-icon" href="<%IMAGE_PATH%>favicon.ico" />

    <!-- endregion -->

    <!-- region resources -->

        <link type="text/css" rel="stylesheet/less" media="screen" href="<%LESS_PATH%>documentation-1.0.less">
        <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
        <!--[if lt IE 9]><script src="<%JAVA_SCRIPT_PATH%>html5shiv-3.6.2.js"></script><![endif]-->
        <script type="text/javascript" src="<%JAVA_SCRIPT_PATH%>coffeeScript-1.6.3.js"></script>
        <script type="text/coffeescript" src="<%COFFEE_SCRIPT_PATH%>require-1.0.coffee"></script>
        <script type="text/coffeescript" src="<%COFFEE_SCRIPT_PATH%>main.coffee"></script>

    <!-- endregion -->

        <title><%NAME%></title>

    </head>

<!-- endregion -->

<!-- region body -->

    <body class="documentation">
        <div class="window-loading-cover"><div></div></div>

    <!-- region header -->

        <div class="header-wrap outer">
            <header class="inner">
                <% START_UP_ANIMATION_NUMBER += 1
                <a class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> forkme-banner" href="https://github.com/thaibault/<%NAME%>">
                    View on GitHub
                    <!--deDE: GitHub-Projekt -->
                    <!--frFR: GitHub-Project -->
                    <i class="icon-github"></i>
                </a>
                <% START_UP_ANIMATION_NUMBER += 1
                <h1 class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> project-title">
                    <a href="http://thaibault.github.io/<%NAME%>"><%NAME%></a>
                </h1>
                <% START_UP_ANIMATION_NUMBER += 1
                <h2 class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> project-tagline">
                    <%TAGLINE%>
                    <br />
                </h2>
                <section class="header-links">
                    <% START_UP_ANIMATION_NUMBER += 1
                    <a href="#language-deDE" class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%>">de</a>
                    <% START_UP_ANIMATION_NUMBER += 1
                    <a href="#language-enUS" class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%>">en</a>
                    <% START_UP_ANIMATION_NUMBER += 1
                    <a href="#language-frFR" class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%>">fr</a>
                    <% START_UP_ANIMATION_NUMBER += 1
                    <i class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> icon-download-tarball"></i>
                    <% START_UP_ANIMATION_NUMBER += 2
                    <% if FileHandler(location=DISTRIBUTION_BUNDLE_FILE_PATH, must_exist=False):
                        <a class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> zip-source-download" href="https://github.com/thaibault/<%NAME%>/zipball/master">
                            src.zip
                        </a>
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> zip-distribution-bundle-download" href="<%DISTRIBUTION_BUNDLE_FILE_PATH%>">
                            app.zip
                        </a>
                    <% else:
                        <a class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> zip-source-download" href="https://github.com/thaibault/<%NAME%>/zipball/master">
                            .zip
                        </a>
                        <% START_UP_ANIMATION_NUMBER -= 1
                        <a class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> tar-gz-source-download" href="https://github.com/thaibault/<%NAME%>/tarball/master">
                            .tar.gz
                        </a>
                </section>
            </header>
        </div>

    <!-- endregion -->

    <!-- region sections -->

        <div class="main-content-wrap outer">

        <!-- region main content -->

            <% START_UP_ANIMATION_NUMBER += 1
            <section class="main-content inner start-up-animation-number-<%START_UP_ANIMATION_NUMBER%>">
                <%RENDERED_MARKDOWN%>
            </section>

        <!-- endregion -->

        <!-- region legal notes -->

            <section class="about-this-website inner">
                <h1>
                    About this website
                    <!--deDE:Impressum-->
                    <!--frFR:Mentions légales-->
                </h1>
                <p>
                    Provider of
                    <!--deDE:Anbieter von-->
                    <!--frFR:Fournisseur de-->
                    <a href="http://thaibault.github.io/<%NAME%>">
                        http://thaibault.github.io/<%NAME%>
                    </a>:
                    <br />
                    Torben Sickert
                    <br />
                    Christoph-Mang-Str. 14
                    <br />
                    79100 Freiburg
                    <br />
                    Tel. 0049 (0) 176 / 10248185
                    <br />
                    Email:
                    <a href="mailto:t.sickert@gmail.com">t.sickert@gmail.com</a>
                    <br />
                    Website:
                    <!--deDE:Webseite:-->
                    <!--frFR:Site:-->
                    <a href="http://thaibault.github.io/website">http://thaibault.github.io/website</a>
                    <br />
                    <span class="glyphicon glyphicon-arrow-left arrow-left-home"></span>
                    <a href="#home">
                        home
                        <!--deDE:Startseite-->
                        <!--frFR:Maison-->
                    </a>
                </p>
            </section>
        </div>

        <!-- endregion -->

    <!-- endregion -->

    <!-- region footer -->

        <div class="footer-wrap outer">
            <footer class="inner">
                <% START_UP_ANIMATION_NUMBER += 1
                <p class="start-up-animation-number-<%START_UP_ANIMATION_NUMBER%> copyright">
                    <%NAME%> maintained by
                    <!--deDE:<%NAME%> betrieben von -->
                    <!--frFR:<%NAME%> exploité par -->
                    <a href="https://github.com/thaibault">thaibault</a>
                    &middot; &copy; 2013 Torben Sickert, Inc. &middot;
                    <a href="#about-this-website">
                        about this website
                        <!--deDE:Impressum-->
                        <!--frFR:Mentions légales-->
                    </a>
                </p>
                <% START_UP_ANIMATION_NUMBER += 1
                <p class="pull-right"><a href="#top">top</a></p>
            </footer>
        </div>

    <!-- endregion -->

<!-- endregion -->

    </body>
</html>
