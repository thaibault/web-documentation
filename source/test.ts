// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
'use strict'
/* !
    region header
    Copyright Torben Sickert (info["~at~"]tsickert.com) 16.12.2012

    License
    -------

    This library written by Torben Sickert stands under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region imports
import type {Mapping} from 'clientnode'

import {beforeAll, describe, expect, jest, test} from '@jest/globals'

import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter'

import WebDocumentation, {api} from './index'
import createMarkdownRenderer from './renderMarkdown'
// endregion
// region environment
/*
    NOTE: jsdom does not implement "innerText" which is used to read example
    code and to write example styles.
*/
if (!('innerText' in HTMLElement.prototype))
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get(this: HTMLElement): string {
            return this.textContent
        },
        set(this: HTMLElement, value: string) {
            this.textContent = value
        }
    })
// endregion
// region fixtures
const FIXTURE = `
    <div class="wd-table-of-contents" style="display: none">
        <!--wd-table-of-contents-->
    </div>
    <div class="wd-section__home">
        <h1 id="first">First</h1>
        <h2 id="second">Second</h2>
        <h3 id="third">Third</h3>
        <h2 id="fourth">Fourth</h2>

        <!--showExample--><pre>
            &lt;p class="plain-example"&gt;plain&lt;/p&gt;
        </pre>
        <!--showExample:html--><pre><code>
            &lt;h2 id="inside-example"&gt;Inside&lt;/h2&gt;
        </code></pre>
        <!--showExample:hidden--><pre>
            &lt;p class="hidden-example"&gt;hidden&lt;/p&gt;
        </pre>
        <!--showExample:css--><pre>.styled-example {color: red}</pre>
        <!--showExample:js--><pre>globalThis.WD_TEST_MODULE = true</pre>
        <!--showExample:hidden--><pre>
            &lt;div class="script-example"&gt;
                &lt;script&gt;
                    window.WD_TEST_INLINE = true
                    document.currentScript.nextElementSibling?.remove()
                &lt;/script&gt;
                &lt;script&gt;window.WD_TEST_REMOVED = true&lt;/script&gt;
            &lt;/div&gt;
        </pre>
        <!--no example-->
        <pre>no example</pre>
        <p><code>short code line
second line</code></p>
        <!--showExample-->
    </div>
`
// endregion
describe('WebDocumentation', () => {
    let root: WebDocumentation
    const onExamplesLoaded = jest.fn()

    beforeAll(async () => {
        api.register()
        root = document.createElement('web-documentation') as WebDocumentation
        root.innerHTML = FIXTURE
        root.onExamplesLoaded = onExamplesLoaded
        document.body.appendChild(root)

        await root.renderState.promise
    })
    // region tests
    test('should be defined', () => {
        expect(root).toBeDefined()
        expect(api.component).toStrictEqual(WebDocumentation)
        expect(customElements.get('web-documentation'))
            .toStrictEqual(WebDocumentation)
    })

    describe('options', () => {
        test('should be extended by default options', () => {
            expect(root.options.selectors.code).toStrictEqual('code')
            expect(root.options.showExample.domNodeName)
                .toStrictEqual('#comment')
        })

        test('should be re-extended on option updates', async () => {
            await root.onUpdateAttribute(
                'options', '{showExample: {pattern: "^custom$"}}'
            )

            expect(root.options.showExample.pattern).toStrictEqual('^custom$')
            expect(root.options.selectors.code).toStrictEqual('code')

            await root.onUpdateAttribute(
                'options', `{showExample: {pattern: ${JSON.stringify(
                    WebDocumentation._defaultOptions.showExample.pattern
                )}}}`
            )

            expect(root.options.showExample.pattern).toStrictEqual(
                WebDocumentation._defaultOptions.showExample.pattern
            )
        })
    })

    test('grabDomNodes', () => {
        root.grabDomNodes()

        expect(root.tableOfContentDomNode)
            .toStrictEqual(root.querySelector('.wd-table-of-contents'))
        expect(root.aboutThisWebsiteSectionDomNode).toBeNull()
        expect(root.aboutThisWebsiteLinkDomNodes).toHaveLength(0)
        expect(root.codeDomNodes?.length).toBeGreaterThan(0)
        expect(root.headlineDomNodes?.length).toBeGreaterThanOrEqual(4)
    })

    describe('_showExamples', () => {
        test('should notify when examples are loaded', () => {
            expect(onExamplesLoaded).toHaveBeenCalled()
        })

        test('should wrap untyped examples', () => {
            const domNode = root.querySelector(
                '.wd-show-example-wrapper .plain-example'
            )

            expect(domNode).not.toBeNull()
            expect(domNode?.textContent).toStrictEqual('plain')
        })

        test('should wrap examples with unknown types', () => {
            expect(root.querySelector(
                '.wd-show-example-wrapper #inside-example'
            )).not.toBeNull()
        })

        test('should render hidden examples without wrapper', () => {
            const domNode = root.querySelector('.hidden-example')

            expect(domNode).not.toBeNull()
            expect(domNode?.closest('.wd-show-example-wrapper')).toBeNull()
        })

        test('should inject style examples', () => {
            const domNode = Array.from(root.querySelectorAll('style')).find(
                (domNode) => domNode.textContent.includes('.styled-example')
            )

            expect(domNode).toBeDefined()
            expect(domNode?.getAttribute('type')).toStrictEqual('text/css')
        })

        test('should not inject dom nodes for script examples', () => {
            const codeDomNode = Array.from(root.querySelectorAll('pre')).find(
                (domNode) => domNode.textContent.includes('WD_TEST_MODULE')
            )

            expect(codeDomNode?.nextSibling?.nodeType)
                .toStrictEqual(Node.TEXT_NODE)
        })

        test('should re-inject scripts of examples', () => {
            const window = globalThis as unknown as Mapping<unknown>

            expect(window.WD_TEST_INLINE).toStrictEqual(true)
            /*
                The second script has been removed by the first one so it has
                to be skipped.
            */
            expect(root.querySelectorAll('.script-example script'))
                .toHaveLength(1)
        })

        test('should ignore unrelated comments', () => {
            const codeDomNode = Array.from(root.querySelectorAll('pre')).find(
                (domNode) => domNode.textContent === 'no example'
            )

            expect(codeDomNode?.nextElementSibling?.nodeName)
                .toStrictEqual('P')
        })
    })

    describe('_makeCodeEllipsis', () => {
        test('should keep short code lines', () => {
            const domNode = Array.from(root.querySelectorAll('code')).find(
                (domNode) => domNode.textContent.startsWith('short code line')
            )

            expect(domNode?.innerHTML)
                .toStrictEqual('short code line\nsecond line')
        })

        test('should shorten long code lines', () => {
            const codeDomNodes = root.codeDomNodes
            const domNode = document.createElement('div')
            const longLine = 'a'.repeat(100)
            const highlightedLine =
                `<span class="hljs-keyword">const</span> ${'b'.repeat(60)} ` +
                `= <span class="hljs-string">'${'c'.repeat(40)}'</span>`
            const exactLine = 'd'.repeat(89)
            const multiLineComment =
                `<span class="hljs-comment">/* ${'e'.repeat(100)}\n */</span>`
            domNode.innerHTML =
                `<code>${longLine}\nshort</code>` +
                `<code>${highlightedLine}</code>` +
                `<code>${exactLine}</code>` +
                `<code>${multiLineComment}</code>`
            root.codeDomNodes = domNode.querySelectorAll('code')

            root._makeCodeEllipsis()

            const [
                longDomNode,
                highlightedDomNode,
                exactDomNode,
                multiLineDomNode
            ] = Array.from(root.codeDomNodes)

            expect(longDomNode.innerHTML)
                .toStrictEqual(`${'a'.repeat(86)}...\nshort`)

            expect(highlightedDomNode.textContent).toHaveLength(89)
            expect(highlightedDomNode.textContent.endsWith('...'))
                .toStrictEqual(true)
            expect(highlightedDomNode.querySelector('.hljs-keyword')
                ?.textContent).toStrictEqual('const')
            expect(highlightedDomNode.querySelector('.hljs-string')
                ?.textContent).toStrictEqual(`'${'c'.repeat(16)}`)

            expect(exactDomNode.innerHTML).toStrictEqual(exactLine)
            expect(multiLineDomNode.innerHTML)
                .toStrictEqual(multiLineComment)

            root.codeDomNodes = codeDomNodes
        })
    })

    describe('_replaceExcessWithDots', () => {
        test('should shorten plain text', () => {
            expect(root._replaceExcessWithDots('abcdefghij', 4))
                .toStrictEqual('abc...')
        })

        test('should remove whole trailing nodes', () => {
            expect(root._replaceExcessWithDots('abcdef<b>gh</b>', 4))
                .toStrictEqual('a...')
        })

        test('should shorten nested nodes without breaking tags', () => {
            expect(root._replaceExcessWithDots(
                'ab<i>cd<b>efgh</b></i>', 2
            )).toStrictEqual('ab<i>c</i>...')
        })

        test('should keep comments', () => {
            expect(root._replaceExcessWithDots('abcdef<!--x-->', 1))
                .toStrictEqual('ab<!--x-->...')
        })
    })

    describe('_hasBalancedTags', () => {
        test('should detect self-contained snippets', () => {
            expect(root._hasBalancedTags('plain')).toStrictEqual(true)
            expect(root._hasBalancedTags('<b>a</b> <span class="x">b</span>'))
                .toStrictEqual(true)
        })

        test('should detect snippets spanning multiple lines', () => {
            expect(root._hasBalancedTags('<span class="x">open'))
                .toStrictEqual(false)
            expect(root._hasBalancedTags('close</span>'))
                .toStrictEqual(false)
        })
    })

    describe('_generateTableOfContentsLinks', () => {
        test('should generate links to headlines', () => {
            const tableOfContentDomNode =
                root.querySelector<HTMLElement>('.wd-table-of-contents')

            expect(tableOfContentDomNode?.style.display)
                .toStrictEqual('initial')

            expect(
                Array.from(root.tableOfContentLinkDomNodes ?? []).map(
                    (domNode) => domNode.getAttribute('href')
                )
            ).toStrictEqual(['#first', '#second', '#third', '#fourth'])
            expect(
                tableOfContentDomNode?.querySelector('ul ul ul a')
                    ?.getAttribute('href')
            ).toStrictEqual('#third')
        })

        test('should skip headlines of examples', () => {
            expect(
                root.querySelector('.wd-table-of-contents')?.textContent
            ).not.toContain('Example')
            expect(
                root.querySelector('.wd-table-of-contents')?.textContent
            ).not.toContain('Inside')
        })

        test('should scroll to clicked headlines', () => {
            const targetDomNode = root.querySelector('#third') as HTMLElement
            const getBoundingClientRect =
                jest.spyOn(targetDomNode, 'getBoundingClientRect')

            const linkDomNode =
                root.querySelector('.wd-table-of-contents a[href="#third"]')
            const event = new MouseEvent(
                'click', {bubbles: true, cancelable: true}
            )
            linkDomNode?.dispatchEvent(event)

            expect(event.defaultPrevented).toStrictEqual(true)
            expect(getBoundingClientRect).toHaveBeenCalled()

            getBoundingClientRect.mockRestore()
        })

        test('should nest lists according to headline levels', () => {
            interface Item {
                text: string
                children: Array<Item>
            }
            const toTree = (listDomNode: Element): Array<Item> =>
                Array.from(listDomNode.children).map((itemDomNode) => {
                    const nestedListDomNode =
                        itemDomNode.querySelector(':scope > ul')

                    return {
                        text: itemDomNode.querySelector(':scope > a')
                            ?.textContent.trim() ?? '',
                        children: nestedListDomNode ?
                            toTree(nestedListDomNode) :
                            []
                    }
                })

            const tableOfContentDomNode = root.tableOfContentDomNode
            const headlineDomNodes = root.headlineDomNodes

            const domNode = document.createElement('div')
            domNode.innerHTML = `
                <div class="wd-table-of-contents">
                    <h2 id="content">Content</h2>
                    <!--wd-table-of-contents-->
                </div>
                <h1 id="a">A</h1>
                <h2 id="b">B</h2>
                <h3 id="c">C</h3>
                <h1 id="d">D</h1>
                <h3 id="e">E</h3>
                <h2 id="f">F</h2>
            `
            root.tableOfContentDomNode =
                domNode.querySelector('.wd-table-of-contents')
            root.headlineDomNodes = domNode.querySelectorAll('h1, h2, h3')

            root._generateTableOfContentsLinks()

            const listDomNode =
                root.tableOfContentDomNode?.querySelector(':scope > ul')

            expect(listDomNode).not.toBeNull()
            expect(toTree(listDomNode as Element)).toStrictEqual([
                {
                    text: 'A',
                    children: [{
                        text: 'B',
                        children: [{text: 'C', children: []}]
                    }]
                },
                {
                    text: 'D',
                    children: [
                        {text: 'E', children: []},
                        {text: 'F', children: []}
                    ]
                }
            ])
            // Lists are only nested inside items.
            expect(domNode.querySelector('ul > ul')).toBeNull()

            root.tableOfContentDomNode = tableOfContentDomNode
            root.headlineDomNodes = headlineDomNodes
        })

        test('should do nothing without table of contents', () => {
            const tableOfContentLinkDomNodes = root.tableOfContentLinkDomNodes
            const tableOfContentDomNode = root.tableOfContentDomNode

            root.tableOfContentDomNode = null
            root._generateTableOfContentsLinks()

            expect(root.tableOfContentLinkDomNodes)
                .toStrictEqual(tableOfContentLinkDomNodes)

            root.tableOfContentDomNode = tableOfContentDomNode
        })
    })
    // endregion
})
describe('renderMarkdown', () => {
    let html = ''

    beforeAll(() => {
        html = createMarkdownRenderer({gfm: true})(
            '<!--wd-table-of-contents-->\n\n' +
            '# Title\n\n' +
            '## Sub Title\n\n' +
            '```javascript\nconst value = 1\n```\n\n' +
            '```unknownLanguage\n<plain>\n```\n\n' +
            '---\n'
        )
    })
    // region tests
    test('should prefix heading ids', () => {
        expect(html).toContain('id="wd-heading-title"')
        expect(html).toContain('id="wd-heading-sub-title"')
    })

    test('should replace the table of contents indicator', () => {
        expect(html).not.toContain('<!--wd-table-of-contents-->')
        expect(html).toContain('<a href="#wd-heading-title">Title</a>')
        expect(html).toContain('<a href="#wd-heading-sub-title">Sub Title</a>')
    })

    test('should highlight known languages', () => {
        expect(html).toContain('class="language-javascript"')
        expect(html).toContain('hljs-keyword')
    })

    test('should fall back to plain text for unknown languages', () => {
        expect(html).toContain('&lt;plain&gt;')
    })

    test('should favor self-closing tags', () => {
        expect(html).toContain('<hr/>')
    })

    test('should isolate renderers from each other', () => {
        const renderWithoutBreaks = createMarkdownRenderer({breaks: false})
        const renderWithBreaks = createMarkdownRenderer({breaks: true})

        expect(renderWithoutBreaks('a\nb')).toStrictEqual('<p>a\nb</p>\n')
        expect(renderWithBreaks('a\nb')).toStrictEqual('<p>a<br/>b</p>\n')
    })
    // endregion
})
