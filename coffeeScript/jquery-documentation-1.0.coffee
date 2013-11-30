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

## standalone
## do ($=this.jQuery) ->
this.require.scopeIndicator = 'jQuery.Documentation'
this.require 'jquery-website-1.0.coffee', ($) ->
##

# endregion

# region plugins

    ###*
        @memberOf $
        @class
    ###
    class Documentation extends $.Website.class

    # region properties

        ###*
            Holds the class name to provide inspection features.

            @property {String}
        ###
        __name__: 'Documentation'

    # endregion

    # region public methods

        # region special

        ###*
            @description Initializes the interactive web application.

            @param {Object} options An options object.

            @returns {$.Documentation} Returns the current instance.
        ###
        initialize: (
            options={}, @_startUpAnimationIsComplete=false,
            @_activateLanguageSupport=false, @_languageHandler=null
        ) ->
            this._options =
                onExamplesLoaded: $.noop()
                domNodeSelectorPrefix: 'body.{1}'
                showExample:
                    pattern: '^ *showExample(: *([^ ]+))? *$'
                    domNodeName: '#comment'
                    htmlWrapper: '''
                        <div class="show-example-wrapper">
                            <h3>
                                Example:
                                <!--deDE:Beispiel:-->
                                <!--frFR:Exemple:-->
                            </h3>
                        </div>
                    '''
                domNode:
                    tableOfContentLinks: 'div.toc > ul > li a[href^="#"]'
                    aboutThisWebsiteLink: 'a[href="#about-this-website"]'
                    homeLink: 'a[href="#home"]'
                    aboutThisWebsiteSection: 'section.about-this-website'
                    mainSection: 'section.main-content'
                    codeWrapper: 'div.codehilite'
                    codeChildren: 'pre'
                trackingCode: 'UA-0-0'
                section:
                    aboutThisWebsite:
                        fadeOut: duration: 'slow'
                        fadeIn: duration: 'slow'
                    main:
                        fadeOut: duration: 'slow'
                        fadeIn: duration: 'slow'
            # NOTE: We will initialize language support after examples are
            # injected if activated via options.
            this._activateLanguageSupport = options.activateLanguageSupport
            options.activateLanguageSupport = false
            super options
            if not this._activateLanguageSupport?
                this._activateLanguageSupport =
                    this._parentOptions.activateLanguageSupport
            if not window.location.hash
                window.location.hash = this.$domNodes.homeLink.attr 'href'
            this.$domNodes.aboutThisWebsiteSection.hide()
            # NOTE: We have to render examples first to avoid having dots in
            # example code.
            this._showExamples()._makeCodeEllipsis()
            this.on this.$domNodes.tableOfContentLinks, 'click', ->
                $.scrollTo $(this).attr('href'), 'slow'
            # Handle section switch between documentation and
            # "about this website".
            this._options.section.aboutThisWebsite.fadeOut.always = =>
                this.$domNodes.mainSection.fadeIn(
                    this._options.section.main.fadeIn)
            this._options.section.main.fadeOut.always = =>
                this.$domNodes.aboutThisWebsiteSection.fadeIn(
                    this._options.section.aboutThisWebsite.fadeIn)
            this.on this.$domNodes.aboutThisWebsiteLink, 'click', =>
                this.$domNodes.mainSection.fadeOut(
                    this._options.section.main.fadeOut)
            this.on this.$domNodes.homeLink, 'click', (event) =>
                this.$domNodes.aboutThisWebsiteSection.fadeOut(
                    this._options.section.aboutThisWebsite.fadeOut)
            this

        # endregion

         # region event handler

        ###*
            @description This method triggers if all examples loaded.

            @returns {$.Documentation} Returns the current instance.
        ###
        _onExamplesLoaded: ->
            # NOTE: After injecting new dom nodes we have to grab them for
            # further controller logic.
            this.$domNodes = this.grabDomNode this._options.domNode
            # New injected dom nodes may take affect on language handler.
            if(this._startUpAnimationIsComplete and
               this._activateLanguageSupport)
                this._languageHandler = $.Lang this._options.language
            this
        ###*
            @description This method triggers if we change the current section.

            @returns {$.Documentation} Returns the current instance.
        ###
        _onSwitchSection: (hash) ->
            this.$domNodes.tableOfContentLinks.add(
                this.$domNodes.aboutThisWebsiteLink
            ).filter("a[href=\"#{hash}\"]").trigger 'click'
            super()
        ###*
            @description This method triggers if all startup animations are
                         ready.

            @returns {$.Documentation} Returns the current instance.
        ###
        _onStartUpAnimationComplete: ->
            if this._activateLanguageSupport and not this._languageHandler?
                this._languageHandler = $.Lang this._options.language
            # All start up effects are ready. Handle direct
            # section links.
            this._startUpAnimationIsComplete = true
            this.$domNodes.tableOfContentLinks.add(
                this.$domNodes.aboutThisWebsiteLink
            ).filter("a[href=\"#{window.location.href.substr(
                window.location.href.indexOf '#'
            )}\"]").trigger 'click'
            super()

        # endregion

        ###*
            @description This method makes dotes after code lines which are too
                         long. This prevents line wrapping.

            @returns {$.Documentation} Returns the current instance.
        ###
        _makeCodeEllipsis: ->
            self = this
            this.$domNodes.codeWrapper.children(
                this.$domNodes.codeChildren
            ).each ->
                $this = $ this
                newContent = ''
                codeLines = $this.html().split '\n'
                $.each codeLines, (index, value) ->
                    # NOTE: Wrap a div object tu grantee that $ will accept the
                    # input.
                    excess = $("<div>#{value}</div>").text().length - 79
                    if excess > 0
                        newContent += self._replaceExcessWithDots value, excess
                    else
                        newContent += value
                    if index + 1 isnt codeLines.length
                        newContent += "\n"
                $this.html newContent
            this
        ###*
            @description Replaces given html content with a shorter version
                         trimmed by given amount of excess.

            @param {String} content String to trim.
            @param {Number} excess Amount of excess.

            @returns {String} Returns the trimmed content.
        ###
        _replaceExcessWithDots: (content, excess) ->
            # Add space for ending dots.
            excess += 3
            newContent = ''
            try
                content = $ content
            catch error
                # NOTE: Wrap an element around to grantee that $ will accept
                # the input. We don't wrap an element in general to iterate
                # through separate dom nodes in next step if possible.
                content = $ "<wrapper>#{content}</wrapper>"
                wrapped = true
            $(content.get().reverse()).each ->
                # Wrap element to get not only the inner html. Wrap only if not
                # wrapped already.
                if wrapped
                    $wrapper = $ this
                else
                    $wrapper = $(this).wrap('<wrapper>').parent()
                contentSnippet = $wrapper.html()
                if not contentSnippet
                    contentSnippet = this.textContent
                if excess
                    if this.textContent.length < excess
                        excess -= this.textContent.length
                        contentSnippet = ''
                    else if this.textContent.length >= excess
                        this.textContent = "#{this.textContent.substr(
                            0, this.textContent.length - excess - 1
                        )}..."
                        excess = 0
                        contentSnippet = $wrapper.html()
                        if not contentSnippet
                            contentSnippet = this.textContent
                newContent = contentSnippet + newContent
            newContent
        ###*
            @description Shows marked example codes directly in browser.

            @returns {$.Documentation} Returns the current instance.
        ###
        _showExamples: ->
            self = this
            this.$domNodes.parent.find(':not(iframe)').contents().each ->
                if this.nodeName is self._options.showExample.domNodeName
                    match = this.textContent.match(new RegExp(
                        self._options.showExample.pattern))
                    if match
                        $codeDomNode = $(this).next()
                        code = $codeDomNode.find(
                            self.$domNodes.codeWrapper
                        ).text()
                        if not code
                            code = $codeDomNode.text()
                        if $.inArray(
                            match[2]?.toLowerCase(), ['javascript', 'js']
                        ) isnt -1
                            $codeDomNode.after($('<script>').attr(
                                'type', 'text/javascript'
                            ).text code)
                        else if match[2]? and $.inArray(
                            match[2].toLowerCase(), [
                                'css', 'cascadingstylesheets', 'stylesheets',
                                'sheets', 'style']
                        ) isnt -1
                            $codeDomNode.after($('<style>').attr(
                                'type', 'text/css'
                            ).text code)
                        else
                            $codeDomNode.after $(
                                self._options.showExample.htmlWrapper
                            ).append code
            this.fireEvent 'examplesLoaded'
            this

    # endregion

    # region handle $ extending

    $.Documentation = -> $.Tools().controller Documentation, arguments
    $.Documentation.class = Documentation

    # endregion

# endregion
