#!/usr/bin/env coffee

# region vim modline

# vim: set tabstop=4 shiftwidth=4 expandtab:
# vim: foldmethod=marker foldmarker=region,endregion:

# endregion

# region header

# Copyright Torben Sickert 16.12.2012

# License
#    This library written by Torben Sickert stand under a creative commons
#    naming 3.0 unported license.
#    see http://creativecommons.org/licenses/by/3.0/deed.de

# endregion

# TODO adapt to support less source maps.
## standalone
##
this.less =
    env: 'development'
    async: false
    fileAsync: false
    poll: 1000
    functions: {}
    dumpLineNumbers: 'all'
    relativeUrls: false
    rootpath: ''
    logLevel: 0
    #sourceMap: true
##

## standalone
## this.jQuery ($) ->
##     $.Documentation googleTrackingCode: '<%GOOGLE_TRACKING_CODE%>'
this.require.noConflict = true
this.require(
    [['jQuery.Documentation', 'jquery-documentation-1.0.coffee']],
($) ->
    ###
        Embed $ and require full compatible to all other
        JavaScripts.
        The global scope is clean after this sequence. The given
        function is called when the dom-tree was loaded.
    ###
    ###
        NOTE: "jQuery.noConflict()" should become "true" for parameter
        "removeAll", because we will end up in race conditions by finishing
        tests and removing the main $ object.
    ###
    $.noConflict(true) ($) -> $.Documentation
        googleTrackingCode: '<%GOOGLE_TRACKING_CODE%>', logging: true
)
##
