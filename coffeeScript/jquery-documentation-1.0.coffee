#!/usr/bin/env require

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
    Copyright see require on https://github.com/thaibault/require

    Conventions see require on https://github.com/thaibault/require

    @author t.sickert@gmail.com (Torben Sickert)
    @version 1.0 stable
    @fileOverview
    This module provides common reusable logic a simple project documentation
    web page.
###

## standalone do ($=this.jQuery) ->
this.require([['jQuery.Website', 'jquery-website-1.0.coffee']], ($) ->

# endregion

# region plugins

    ###*
        @memberOf $
        @class
    ###
    class Documentation extends $.Website.class

    # region properties

        ###*
            Saves default options for manipulating the default behaviour.

            @property {Object}
        ###
        _options:
            domNodeSelectorPrefix: 'body.{1}'
            domNodes:
                tableOfContentLinks: 'div.toc a[href^="#"]'
                legalNotesLink: 'a[href="#about-this-website"]'
                homeLink: 'a[href="#home"]'
                legalNotesContent: 'section.about-this-website'
                mainContent: 'section.main-content'
                codeLines:
                    'table.codehilitetable tr td.code div.codehilite pre span'
            trackingCode: 'UA-0-0'
        __name__: 'Documentation'

    # endregion

    # region public methods

        # region special

        ###*
            @description Initializes the interactive web application.

            @param {Object} options An options object.

            @returns {$.Documentation} Returns the current instance.
        ###
        initialize: (options) ->
            super options
            this._domNodes.legalNotesContent.hide()
            this._makeCodeEllipsis()
            this.on this._domNodes.tableOfContentLinks, 'click', ->
                $.scrollTo $(this).attr('href'), 'slow'
            this.on this._domNodes.legalNotesLink, 'click', =>
                this._domNodes.mainContent.fadeOut 'slow', =>
                    this._domNodes.legalNotesContent.fadeIn 'slow'
            this.on this._domNodes.homeLink, 'click', (event) =>
                event.preventDefault()
                this._domNodes.legalNotesContent.fadeOut 'slow', =>
                    this._domNodes.mainContent.fadeIn 'slow'

        # endregion

         # region event handler

        ###*
            @description This method triggers if we change the current section.

            @returns {$.Documentation} Returns the current instance.
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

            @returns {$.Documentation} Returns the current instance.
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

        ###*
            @description This method makes dotes after code lines which are too
                         long. This prevents line wrapping.

            @returns {$.Documentation} Returns the current instance.
        ###
        _makeCodeEllipsis: ->
            this._domNodes.codeLines.each(->
                if $(this).text().length > 80
                    $(this).text(
                        "#{$(this).text().substr(0, 76)}..."))
            this

    # endregion

    ###* @ignore ###
    $.Documentation = ->
        self = new Documentation
        self._controller.apply self, arguments
    ###* @ignore ###
    $.Documentation.class = Documentation

# endregion

## standalone
)
