// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module documentation-website */
'use strict'
/* !
    region header
    [Project page](https://github.com/documentation-website)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import {
    camelCaseToDelimited,
    createDomNodes,
    extend,
    format,
    getAll,
    getParents,
    getText,
    globalContext,
    Logger,
    Mapping,
    NOOP,
    wrap
} from 'clientnode'
import {func, object} from 'clientnode/property-types'
import {property} from 'web-component-wrapper/decorator'
import {WebComponentAPI} from 'web-component-wrapper/type'
import {Web} from 'web-component-wrapper/Web'
import {api as websiteUtilitiesAPI} from 'website-utilities'
import {api as webInternationalizationAPI} from 'web-internationalization'

import {DefaultOptions, Options} from './type'
// endregion
export const log = new Logger({name: 'documentation-website'})
// region plugins/classes
/**
 * This plugin holds all needed methods to extend a whole documentation site.
 * @property _defaultOptions - Options extended by the options given to the
 * initializer method.
 * @property _defaultOptions.selectors - Object with a mapping of needed dom
 * node descriptions to their corresponding selectors.
 * @property _defaultOptions.showExample - Options object to configure code
 * example representation.
 * @property _defaultOptions.showExample.pattern - Regular expression to
 * introduce a code example section.
 * @property _defaultOptions.showExample.domNodeName - Dom node name to
 * indicate a declarative example section.
 * @property _defaultOptions.showExample.htmlWrapper - HTML example wrapper.
 * @property _defaultOptions.section - Configuration object for section
 * switches between the main page and legal notes descriptions.
 * @property options - Finally configured given options.
 */
export class WebDocumentation<
    TElement = HTMLElement,
    ExternalProperties extends Mapping<unknown> = Mapping<unknown>,
    InternalProperties extends Mapping<unknown> = Mapping<unknown>
> extends Web<TElement, ExternalProperties, InternalProperties> {
    static content = `
        <website-utilities
            options="{sectionNames: ['home', 'about-this-website']}"
        >
            <web-internationalization>
                <slot>Please provide a template to transclude.</slot>
            </web-internationalization>
        </website-utilities>
    `

    static _name = 'WebDocumentation'

    static _defaultOptions: DefaultOptions = {
        selectors: {
            aboutThisWebsiteLink: 'a[href="#about-this-website"]',
            aboutThisWebsiteSection: '.section__about-this-website',

            codeWrapper: 'pre',
            code: 'code',

            headlines:
                '.section__main h1, .section__main h2, ' +
                '.section__main h3, .section__main h4, ' +
                '.section__main h5, .section__main h6',
            tableOfContent: '.doc-toc',
            tableOfContentLinks: '.doc-toc ul li a[href^="#"]'
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
                    {1}
                </div>
            `,
            pattern: '^ *showExample(: *([^ ]+))? *$'
        }
    }

    readonly self = WebDocumentation

    // region domNodes
    aboutThisWebsiteLinkDomNodes: NodeListOf<HTMLElement> | null = null
    aboutThisWebsiteSectionDomNode: HTMLDivElement | null = null

    codeDomNodes: NodeListOf<HTMLElement> | null = null

    headlineDomNodes: NodeListOf<HTMLElement> | null = null
    tableOfContentDomNode: HTMLElement | null = null
    tableOfContentLinkDomNodes: NodeListOf<HTMLAnchorElement> | null = null
    // endregion
    @property({type: object})
        options = {} as Options

    @property({type: func})
        onExamplesLoaded: (this: WebDocumentation) => void = NOOP
    // region public
    /// region live-cycle
    /**
     * Defines dynamic getter and setter interface and resolves configuration
     * object. Initializes the map implementation.
     */
    constructor() {
        super()
        /*
            Babels property declaration transformation overwrites defined
            properties at the end of an implicit constructor. So we have to
            redefined them as long as we want to declare expected component
            interface properties to enable static type checks.
        */
        this.defineGetterAndSetterInterface()
    }
    /**
     * Triggered when ever a given attribute has changed and triggers to update
     * configured dom content.
     * @param name - Attribute name which was updates.
     * @param newValue - New updated value.
     */
    onUpdateAttribute(name: string, newValue: string) {
        super.onUpdateAttribute(name, newValue)

        if (name === 'options')
            this.options = extend<Options>(
                true,
                {},
                this.self._defaultOptions,
                this.options
            )
    }
    /**
     * Updates controlled dom elements.
     * @param reason - Why an update has been triggered.
     */
    async render(reason?: string): Promise<void> {
        await super.render(reason)

        if (Object.keys(this.options).length === 0)
            this.onUpdateAttribute('options', '{}')

        this.grabDomNodes()

        /*
            NOTE: We have to render examples first to avoid having dots in
            example code.
        */
        this._showExamples()

        // TODO we may need to delay internationalization until this has been
        // finished rendering

        this._makeCodeEllipsis()

        this._generateTableOfContentsLinks()
    }
    /// endregion
    grabDomNodes(): void {
        this.aboutThisWebsiteLinkDomNodes = this.root.querySelectorAll(
            this.options.selectors.aboutThisWebsiteLink
        )
        this.aboutThisWebsiteSectionDomNode = this.root.querySelector(
            this.options.selectors.aboutThisWebsiteSection
        )

        this.codeDomNodes =
            this.root.querySelectorAll(this.options.selectors.code)

        this.headlineDomNodes =
            this.root.querySelectorAll(this.options.selectors.headlines)
        this.tableOfContentDomNode =
            this.root.querySelector(this.options.selectors.tableOfContent)
    }
    // endregion
    // region protected methods
    /// region event handler
    /// endregion
    /**
     * Generates a table of contents via creating links referring to headlines.
     */
    _generateTableOfContentsLinks(): void {
        if (!this.tableOfContentDomNode)
            return

        let listItems = '<ul>'
        let level = 0
        let firstLevel = 0
        let first = true
        for (const domNode of this.headlineDomNodes ?? []) {
            if (getParents(domNode).some((domNode: Node) =>
                (domNode as Partial<Element>).classList?.contains(
                    'show-example-wrapper'
                )
            ))
                return

            const newLevel: number =
                parseInt(domNode.nodeName.replace(/\D/g, ''))

            if (first)
                firstLevel = newLevel

            if (newLevel > level)
                listItems += '<ul>'
            else if (newLevel < level)
                listItems += '</ul>'

            listItems += `
                <li>
                    <a href="#${domNode.getAttribute('id') ?? 'unknown'}">
                        ${domNode.innerText}
                    </a>
                </li>
            `

            level = newLevel
            first = false
        }
        // Close remaining inner lists.
        while (level < firstLevel) {
            listItems += '</ul>'
            level += 1
        }

        listItems += '</ul>'

        this.tableOfContentDomNode.append(listItems)

        this.tableOfContentLinkDomNodes =
            this.tableOfContentDomNode.querySelectorAll<HTMLAnchorElement>('a')

        this.tableOfContentDomNode.style.display = 'initial'
    }
    /**
     * This method makes dotes after code lines which are too long. This
     * prevents line wrapping.
     */
    _makeCodeEllipsis(): void {
        const lengthLimit = 89 // 79

        for (const domNode of this.codeDomNodes ?? []) {
            let newContent = ''
            const codeLines: Array<string> = domNode.innerHTML.split('\n')

            let subIndex = 0
            for (const value of codeLines) {
                /*
                    NOTE: Wrap a div object to grantee that $ will accept the
                    input.
                */
                const excess: number =
                    getText(createDomNodes(`<div>${value}</div>`)).length -
                    lengthLimit
                if (excess > 0)
                    newContent += this._replaceExcessWithDots(value, excess)
                else
                    newContent += value
                if (subIndex + 1 !== codeLines.length)
                    newContent += '\n'

                subIndex += 1
            }

            domNode.innerHTML = newContent
        }
    }
    /**
     * Replaces given html content with a shorter version trimmed by given
     * amount of excess.
     * @param content - String to trim.
     * @param excess - Amount of excess.
     * @returns Returns the trimmed content.
     */
    _replaceExcessWithDots(content: string, excess: number): string {
        // Add space for ending dots.
        excess += '...'.length
        let newContent = ''
        const contentDomNodes =
            getAll(createDomNodes(`<wrapper>${content}</wrapper>`))
        contentDomNodes.reverse()
        for (const domNode of contentDomNodes) {
            const wrapper = createDomNodes<HTMLElement>('<wrapper><wrapper>')
            wrap(domNode, wrapper)

            const textContent = domNode.textContent || ''

            let contentSnippet = wrapper.innerHTML
            if (!contentSnippet)
                contentSnippet = textContent

            if (excess)
                if (textContent.length < excess) {
                    excess -= textContent.length
                    contentSnippet = ''
                } else if (textContent.length >= excess) {
                    /*
                        NOTE: We have to ensure that no HTML tag will be
                        shortened: We work on "textContent" property only.
                    */
                    domNode.textContent =
                        textContent.substring(
                            0, textContent.length - excess - 1
                        ) +
                        '...'

                    excess = 0

                    contentSnippet = wrapper.innerHTML
                    if (!contentSnippet)
                        contentSnippet = domNode.textContent
                }
            newContent = contentSnippet + newContent
        }

        return newContent
    }
    /**
     * Shows marked example codes directly in browser.
     */
    _showExamples(): void {
        for (const domNode of getAll(this.root))
            if (domNode.nodeName === this.options.showExample.domNodeName) {
                const match: null | RegExpMatchArray =
                    (domNode.textContent || '').match(
                        new RegExp(this.options.showExample.pattern)
                    )
                const codeDomNode = domNode.nextSibling as HTMLElement | null
                if (match && codeDomNode) {
                    const codeWrapper: HTMLElement | null =
                        codeDomNode.querySelector(
                            this.options.selectors.codeWrapper
                        )
                    let code = codeWrapper?.innerText

                    if (!code)
                        code = codeDomNode.innerText

                    try {
                        let domNode: HTMLElement | string = ''
                        if (match.length > 2 && match[2])
                            if (
                                ['javascript', 'javascripts', 'js']
                                    .includes(match[2].toLowerCase())
                            ) {
                                domNode = (globalContext.document as Document)
                                    .createElement('script')
                                domNode.setAttribute('type', 'text/javascript')
                                domNode.innerText = code
                            } else if ([
                                'css', 'cascadingstylesheet',
                                'cascadingstylesheets', 'stylesheet',
                                'stylesheets', 'sheet', 'sheets', 'style',
                                'styles'
                            ].includes(match[2].toLowerCase())) {
                                domNode = (globalContext.document as Document)
                                    .createElement('style')
                                domNode.setAttribute('type', 'text/css')
                                domNode.innerText = code
                            } else if (match[2].toLowerCase() === 'hidden')
                                domNode = code
                            else
                                domNode = createDomNodes(format(
                                    this.options.showExample.htmlWrapper,
                                    code
                                ))
                        else
                            domNode = createDomNodes(format(
                                this.options.showExample.htmlWrapper,
                                code
                            ))

                        codeDomNode.after(domNode)
                    } catch (error) {
                        log.critical(
                            `Error while integrating code "${code}":`,
                            String(error)
                        )
                    }
                }
            }


        this.onExamplesLoaded.call(this)
    }
    // endregion
}
export const api: WebComponentAPI<
    HTMLElement, Mapping<unknown>, Mapping<unknown>, typeof Web
> = {
    component: WebDocumentation,
    register: (
        tagName: string = camelCaseToDelimited(WebDocumentation._name)
    ) => {
        websiteUtilitiesAPI.register()
        webInternationalizationAPI.register()

        customElements.define(tagName, WebDocumentation)
    }
}
export default WebDocumentation

if ((globalContext as Mapping<boolean>).AUTO_DEFINE_WEB_DOCUMENTATION)
    api.register()
// endregion
