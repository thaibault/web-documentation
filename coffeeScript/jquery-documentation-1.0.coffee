## require

# region modline

# vim: set tabstop=4 shiftwidth=4 expandtab:
# vim: foldmethod=marker foldmarker=region,endregion:

# endregion

# region header

# Copyright Torben Sickert 16.12.2012

# License
#    This library written by Torben Sickert stand under a creative commons
#    naming 3.0 unported license.
#    see http://creativecommons.org/licenses/by/3.0/deed.de

###!
    jQuery plugin for "jquery-1.9.1".

    Copyright see require on https://github.com/thaibault/require

    Conventions see require on https://github.com/thaibault/require

    @author t.sickert@gmail.com (Torben Sickert)
    @version 1.0 stable
    @fileOverview
    This module provides common reusable logic a simple project documentation
    web page.
###

###*
    @name jQuery
    @see www.jquery.com
###
## standalone
## ((jQuery) ->
this.window.require([
    ['jQuery.Website', 'jquery-website-1.0.coffee'],
    ['jQuery.fn.carousel', 'bootstrap-2.3.1']],
(jQuery) ->
##

# endregion

# region plugins

    ###*
        @memberOf jQuery
        @class
    ###
    class Documentation extends jQuery.Website.class

    # region private properties

        __name__: 'Documentation'

    # endregion

    # region protected properties 

        ###*
            Saves default options for manipulating the default behaviour.

            @property {Object}
        ###
        _options:
            domNodeSelectorPrefix: 'body.{1}'
            domNodes:
                tableOfContentLinks: 'div.toc a[href^="#"]'
                legalNotesLink: 'a[href="#about-this-website"]'
                homeLink: 'a[href="#"]'
                legalNotesContent: 'section.about-this-website'
                mainContent: 'section.main-content'
            trackingCode: 'UA-0-0'
        ###*
            Holds all needed dom nodes.

            @property {Object}
        ###
        _domNodes: {}

    # endregion

    # region public methods

        # region special methods

        ###*
            @description Initializes the interactive web app.

            @param {Object} options An options object.

            @returns {jQuery.Tools} Returns the current instance.
        ###
        initialize: (options) ->
            super options
            this._domNodes.legalNotesContent.hide()
            this.on this._domNodes.tableOfContentLinks, 'click', ->
                jQuery.scrollTo jQuery(this).attr('href'), 'slow'
            this.on this._domNodes.legalNotesLink, 'click', =>
                this._domNodes.mainContent.fadeOut 'slow', =>
                    this._domNodes.legalNotesContent.fadeIn 'slow'
            this.on this._domNodes.homeLink, 'click', =>
                this._domNodes.legalNotesContent.fadeOut 'slow', =>
                    this._domNodes.mainContent.fadeIn 'slow'

        # endregion

        # region event handler

        ###*
            @description This method triggers if we change the current section.

            @returns {jQuery.Tools} Returns the current instance.
        ###
        _onSwitchSection: (hash) ->
            if hash isnt '#about-this-website'
                this._domNodes.legalNotesContent.fadeOut 'slow', =>
                    this._domNodes.mainContent.fadeIn 'slow'
            this._domNodes.tableOfContentLinks.add(
                this._domNodes.legalNotesLink
            ).filter("a[href=\"#{hash}\"]").trigger 'click'
            super()
        ###*
            @description This method triggers if all startup animations are
                         ready.

            @returns {jQuery.Tools} Returns the current instance.
        ###
        _onStartUpAnimationComplete: ->
            # All start up effects are ready. Handle direct
            # section links.
            this._domNodes.tableOfContentLinks.add(
                this._domNodes.legalNotesLink
            ).filter("a[href=\"#{window.location.href.substr(
                window.location.href.indexOf '#'
            )}\"]").trigger 'click',
            super()

        # endregion

    # endregion

    ###* @ignore ###
    jQuery.Documentation = ->
        self = new Documentation
        self._controller.apply self, arguments
    ###* @ignore ###
    jQuery.Documentation.class = Documentation

# endregion

## standalone ).call this, this.jQuery
)
