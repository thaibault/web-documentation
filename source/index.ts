// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module documentation-website */
'use strict'
/* !
    region header
    [Project page](https://torben.website/documentationwebsite)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import Internationalisation from 'internationalisation'
import WebsiteUtilities from 'website-utilities'
import Tools, {$} from 'clientnode'
import {$DomNode} from 'clientnode/type'

import {
    DocumentationFunction, DomNodes, DefaultOptions, Options, $DomNodes
} from './type'
// endregion
// region declaration
declare var LANGUAGES:Array<string>
declare var OFFLINE:boolean
// endregion
// region plugins/classes
/**
 * This plugin holds all needed methods to extend a whole documentation site.
 * @property static:_defaultOptions - Options extended by the options given to
 * the initializer method.
 * @property static:_defaultOptions.onExamplesLoaded {Function} - Callback to
 * trigger when all example loaded.
 * @property static:_defaultOptions.domNodeSelectorPrefix {string} - Something
 * like "body.{1}" which resolves to "body.documentationWebsite" e.g. depending
 * how given option "name" is specified.
 * @property static:_defaultOptions.codeTableWrapper {string} - Markup to use
 * as wrapper for all code highlighted examples.
 * @property static:_defaultOptions.showExample {Object} - Options object to
 * configure code example representation.
 * @property static:_defaultOptions.showExample.pattern {string} - Regular
 * expression to introduce a code example section.
 * @property static:_defaultOptions.showExample.domNodeName {string} - Dom node
 * name to indicate a declarative example section.
 * @property static:_defaultOptions.showExample.htmlWrapper {string} - HTML
 * example wrapper.
 * @property static:_defaultOptions.domNode {Object} - Object with a mapping of
 * needed dom node descriptions to their corresponding selectors.
 * @property static:_defaultOptions.section {Object} - Configuration object for
 * section switches between the main page and legal notes descriptions.
 * @property static:_defaultOptions.section.aboutThisWebsite {Object} -
 * Configuration object for transitions concerning the legal notes section.
 * @property static:_defaultOptions.section.aboutThisWebsite.fadeOutOptions {Object} -
 * Fade out configurations.
 * @property static:_defaultOptions.section.aboutThisWebsite.fadeInOptions {Object} -
 * Fade in configurations.
 * @property static:_defaultOptions.section.main {Object} - Configuration
 * object for transitions concerning the main section.
 * @property static:_defaultOptions.section.main.fadeOutOptions {Object} - Fade
 * out configurations.
 * @property static:_defaultOptions.section.main.fadeInOptions {Object} - Fade
 * in configurations.
 *
 * @property options - Finally configured given options.
 *
 * @property startUpAnimationIsComplete - Indicates whether start up animations
 * has been completed.
 *
 * @property _activateLanguageSupport - Indicates whether a language switcher
 * should be activated.
 */
export class Documentation extends WebsiteUtilities {
    static _defaultOptions:DefaultOptions = {
        codeTableWrapper: '<div class="table-responsive">',
        domNodes: {
            aboutThisWebsiteLink: 'a[href="#about-this-website"]',
            aboutThisWebsiteSection: '.about-this-website',
            codeWrapper: '.codehilite',
            code: '.codehilite pre, code',
            homeLink: 'a[href="#home"]',
            mainSection: '.main-content',
            tableOfContentLinks: '.toc ul li a[href^="#"]'
        } as DomNodes,
        domNodeSelectorPrefix: 'body.{1}',
        name: 'Documentation',
        onExamplesLoaded: Tools.noop,
        section: {
            aboutThisWebsite: {
                fadeInOptions: {duration: 'fast'},
                fadeOutOptions: {duration: 'fast'}
            },
            main: {
                fadeInOptions: {duration: 'fast'},
                fadeOutOptions: {duration: 'fast'}
            }
        },
        showExample: {
            domNodeName: '#comment',
            htmlWrapper: `
                <div class="show-example-wrapper">
                    <h3>
                        Example:
                        <!--deDE:Beispiel:-->
                        <!--frFR:Exemple:-->
                    </h3>
                </div>
            `,
            pattern: '^ *showExample(: *([^ ]+))? *$'
        }
    } as DefaultOptions

    options:Options = null as unknown as Options

    _activateLanguageSupport:boolean = false
    // region public methods
    // / region special
    /**
     * Initializes the interactive web application.
     * @param options - An options object.
     * @returns Returns the current instance.
     */
    async initialize(options:Partial<Options> = {}):Promise<Documentation> {
        /*
            NOTE: We will initialize language support after examples are
            injected if activated via options.
        */
        this._activateLanguageSupport = options.activateLanguageSupport!
        options.activateLanguageSupport = false

        await super.initialize(Tools.extend(
            true, {} as Options, Documentation._defaultOptions, options
        ))

        if (!this._activateLanguageSupport)
            this._activateLanguageSupport =
                this.options.activateLanguageSupport

        if (!$.global.location?.hash)
            $.global.location.hash = this.$domNodes.homeLink.attr('href')!

        this.$domNodes.aboutThisWebsiteSection.hide()
        /*
            NOTE: We have to render examples first to avoid having dots in
            example code.
        */
        this._showExamples()
        this._makeCodeEllipsis()

        this.on(
            this.$domNodes.tableOfContentLinks,
            'click',
            (event:Event):void => {
                const hashReference:null|string = $(event.target).attr('href')
                if (hashReference && hashReference !== '#')
                    $.scrollTo(hashReference, 'slow')
                else
                    this.scrollToTop()
            }
        )
        // Handle section switch between documentation and legal notes section.
        this.options.section.aboutThisWebsite.fadeOutOptions.always =
            ():$DomNode =>
                this.$domNodes.mainSection.fadeIn(
                    this.options.section.main.fadeInOptions
                )
        this.options.section.main.fadeOutOptions.always = ():$DomNode =>
            this.$domNodes.aboutThisWebsiteSection.fadeIn(
                this.options.section.aboutThisWebsite.fadeInOptions
            )

        this.on(this.$domNodes.aboutThisWebsiteLink, 'click', ():$DomNode =>
            this.scrollToTop().$domNodes.mainSection.fadeOut(
                this.options.section.main.fadeOutOptions
            )
        )
        this.on(this.$domNodes.homeLink, 'click', ():$DomNode =>
            this.scrollToTop().$domNodes.aboutThisWebsiteSection.fadeOut(
                this.options.section.aboutThisWebsite.fadeOutOptions
            )
        )

        return this
    }
    // / endregion
    // endregion
    // region protected methods
    // / region event handler
    /**
     * This method triggers if all examples loaded.
     * @returns Returns the current instance.
     */
    async _onExamplesLoaded():Promise<void> {
        /*
            NOTE: After injecting new dom nodes we have to grab them for
            further controller logic.
        */
        this.$domNodes = this.grabDomNode(this.options.domNodes)
        // New injected dom nodes may take affect on language handler.
        if (
            this.startUpAnimationIsComplete &&
            this._activateLanguageSupport &&
            !this.languageHandler
        )
            this.languageHandler = (
                await $(this.$domNodes.parent)
                    .Internationalisation(this.options.language)
            ).data(this.options.name)
    }
    /**
     * This method triggers if we change the current section.
     * @param sectionName - New section which should be switched to.
     * @returns Returns the current instance.
     */
    _onSwitchSection(sectionName:string):void {
        this.$domNodes.tableOfContentLinks
            .add(this.$domNodes.aboutThisWebsiteLink)
            .add(this.$domNodes.homeLink)
            .filter(`a[href="#${sectionName}"]`)
            .trigger('click')

        super._onSwitchSection(sectionName)
    }
    /**
     * This method triggers if all startup animations are ready.
     * @returns Promise resolving when language handler has been initialized.
     */
    async _onStartUpAnimationComplete():Promise<void> {
        if (this._activateLanguageSupport && !this.languageHandler)
            this.languageHandler = (
                await $(this.$domNodes.parent)
                    .Internationalisation(this.options.language)
            ).data(this.options.name)

        // All start up effects are ready. Handle direct section links.
        this.startUpAnimationIsComplete = true

        if ($.global.location)
            this.$domNodes.tableOfContentLinks
                .add(this.$domNodes.aboutThisWebsiteLink)
                .filter(
                    'a[href="' +
                    $.global.location.href.substr(
                        $.global.location.href.indexOf('#')
                    ) +
                    '"]'
                )
                .trigger('click')

        super._onStartUpAnimationComplete()
    }
    // / endregion
    /**
     * This method makes dotes after code lines which are too long. This
     * prevents line wrapping.
     * @returns Returns the current instance.
     */
    _makeCodeEllipsis():void {
        this.$domNodes.code.each((index:number, domNode:HTMLElement):void => {
            const $domNode:$DomNode = $(domNode)
            const tableParent:$DomNode = $domNode.closest('table')
            if (tableParent.length)
                tableParent.wrap(this.options.codeTableWrapper)
            let newContent:string = ''
            const codeLines:Array<string> = $domNode.html().split('\n')
            let subIndex:number = 0
            for (const value of codeLines) {
                /*
                    NOTE: Wrap a div object to grantee that $ will accept the
                    input.
                */
                const excess:number = $(`<div>${value}</div>`).text(
                ).length - 79
                if (excess > 0)
                    newContent += this._replaceExcessWithDots(value, excess)
                else
                    newContent += value
                if (subIndex + 1 !== codeLines.length)
                    newContent += '\n'
                subIndex += 1
            }
            $domNode.html(newContent)
        })
    }
    /**
     * Replaces given html content with a shorter version trimmed by given
     * amount of excess.
     * @param content - String to trim.
     * @param excess - Amount of excess.
     * @returns Returns the trimmed content.
     */
    _replaceExcessWithDots(content:string, excess:number):string {
        // Add space for ending dots.
        excess += 3
        let newContent:string = ''
        const $content:$DomNode = $(`<wrapper>${content}</wrapper>`)
        for (const domNode of $content.contents().get().reverse()) {
            const $wrapper:$DomNode =
                $(domNode).wrap('<wrapper>').parent() as $DomNode

            const textContent:string = domNode.textContent || ''

            let contentSnippet:string = $wrapper.html()
            if (!contentSnippet)
                contentSnippet = textContent

            if (excess)
                if (textContent.length < excess) {
                    excess -= textContent.length
                    contentSnippet = ''
                } else if (textContent.length >= excess) {
                    /*
                        NOTE: We have to ensure that no html tag will be
                        shorten: We work on "textContent" property only.
                    */
                    domNode.textContent =
                        textContent.substr(
                            0, textContent.length - excess - 1
                        ) +
                        '...'

                    excess = 0

                    contentSnippet = $wrapper.html()
                    if (!contentSnippet)
                        contentSnippet = domNode.textContent
                }
            newContent = contentSnippet + newContent
        }

        return newContent
    }
    /**
     * Shows marked example codes directly in browser.
     * @returns Returns the current instance.
     */
    _showExamples():void {
        this.$domNodes.parent!
            .find(':not(iframe)')
            .contents()
            .each((index:number, domNode:Node):void => {
                if (
                    domNode.nodeName === this.options.showExample.domNodeName
                ) {
                    const match:null|RegExpMatchArray =
                        (domNode.textContent || '').match(
                            new RegExp(this.options.showExample.pattern)
                        )
                    if (match) {
                        const $codeDomNode:$DomNode<Node> = $(domNode).next()

                        let code:string = $codeDomNode
                            .find(this.$domNodes.codeWrapper)
                            .text()

                        if (!code)
                            code = $codeDomNode.text()

                        try {
                            if (match.length > 2 && match[2])
                                if (
                                    ['javascript', 'javascripts', 'js']
                                        .includes(match[2].toLowerCase())
                                )
                                    $codeDomNode.after(
                                        $('<script>')
                                            .attr('type', 'text/javascript')
                                            .text(code)
                                    )
                                else if ([
                                    'css', 'cascadingstylesheet',
                                    'cascadingstylesheets', 'stylesheet',
                                    'stylesheets', 'sheet', 'sheets', 'style',
                                    'styles'
                                ].includes(match[2].toLowerCase()))
                                    $codeDomNode.after(
                                        $('<style>')
                                            .attr('type', 'text/css')
                                            .text(code)
                                    )
                                else if (match[2].toLowerCase() === 'hidden')
                                    $codeDomNode.after(code)
                                else
                                    $codeDomNode.after(
                                        $(
                                            this.options.showExample
                                                .htmlWrapper
                                        ).append(code)
                                    )
                            else
                                $codeDomNode.after(
                                    $(this.options.showExample.htmlWrapper)
                                        .append(code)
                                )
                        } catch (error) {
                            this.critical(
                                `Error while integrating code "${code}": ` +
                                error
                            )
                        }
                    }
                }
            })
        this.fireEvent('examplesLoaded')
    }
    // endregion
}
export default Documentation
// endregion
// region handle $ extending
$.Documentation = ((...parameter:Array<unknown>):unknown =>
    Tools.controller(Documentation, parameter)
) as DocumentationFunction
$.Documentation.class = Documentation
if (!'TODO' && typeof OFFLINE !== 'undefined' && OFFLINE) {
    /*
    const offlineHandler:Object = require('offline-plugin/runtime')
    offlineHandler.install({
        // NOTE: Tell the new service worker to take control immediately.
        onUpdateReady: ():void => offlineHandler.applyUpdate()
    })
    */
}
// NOTE: We make jQuery available to make bootstrapping examples with deferred
// script loading simpler.
;($.global as unknown as {$documentationWebsite:JQueryStatic})
    .$documentationWebsite = $
// endregion
// region bootstrap
$.noConflict(true)(($:JQueryStatic):Documentation =>
    $.Documentation({
        language: {
            selection: typeof LANGUAGES === 'undefined' ? [] : LANGUAGES,
            sessionDescription: 'documentationWebsite{1}'
        }
    })
)
// endregion
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
