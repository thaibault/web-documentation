// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
'use strict'
/* !
    region header
    Copyright Torben Sickert (info["~at~"]tsickert.com) 16.12.2012

    License
    -------

    This library written by Torben Sickert stands under a creative commons
    naming 4.0 international license.
    See https://creativecommons.org/licenses/by/4.0/deed.de
    endregion
*/
// region imports
import type {File, Mapping} from 'clientnode'

import {
    afterAll, beforeAll, describe, expect, jest, test
} from '@jest/globals'

import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter'

import {importFilesystemAPI} from 'clientnode'
import {readFileSync} from 'fs'
import {mkdir, readFile, rm, stat, writeFile} from 'fs/promises'
import {basename, dirname, join, resolve} from 'path'
import {Readable} from 'stream'
import {Open} from 'unzipper'

import {
    checkRun,
    copyRepositoryFile,
    createDistributionBundle,
    determineDistributionFilePaths,
    determineRenderParameters,
    determineSourceURL,
    evaluatePathTemplate,
    generateAndPushNewDocumentationPage,
    hasAPIDocumentationScript,
    isFileIgnored,
    makeTemporaryFile,
    readReadmes,
    run,
    stream2buffer,
    tidyUp
} from './deployHelper'
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
/*
    NOTE: jsdom does not provide "setImmediate" which is used by the streams of
    the zip archive library.
*/
if (typeof globalThis.setImmediate === 'undefined') {
    const context = globalThis as unknown as Mapping<unknown>
    context.setImmediate = (
        callback: (...parameters: Array<unknown>) => void,
        ...parameters: Array<unknown>
    ) => setTimeout(callback, 0, ...parameters)
    context.clearImmediate = (id: ReturnType<typeof setTimeout>) => {
        clearTimeout(id)
    }
}
/*
    NOTE: Capture all log output to keep test output clean and to be able to
    assert expected log messages. Loggers write directly to the standard output
    when available and use the console otherwise.
*/
const LOG_MESSAGES: Array<string> = []

beforeAll(() => {
    for (const name of ['debug', 'error', 'info', 'log', 'warn'] as const)
        jest.spyOn(console, name).mockImplementation((
            ...parameters: Array<unknown>
        ) => {
            LOG_MESSAGES.push(parameters.map(String).join(' '))
        })

    jest.spyOn(process.stdout, 'write').mockImplementation((
        chunk: string | Uint8Array, ...parameters: Array<unknown>
    ): boolean => {
        LOG_MESSAGES.push(String(chunk))

        // NOTE: Loggers wait until their output has been written.
        const callback = parameters.find((parameter) =>
            typeof parameter === 'function'
        ) as (() => void) | undefined
        callback?.()

        return true
    })
})

afterAll(() => {
    jest.restoreAllMocks()
})
/**
 * Checks whether a log message containing given text has been emitted.
 * @param text - Text to search for.
 */
const expectLogged = (text: string) => {
    expect(LOG_MESSAGES.some((message) => message.includes(text)))
        .toStrictEqual(true)
}
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
            expectLogged('Skipping example script "inline"')
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
describe('deployHelper', () => {
    let directoryPath = ''

    /**
     * Creates given files (with their parent directories) in the temporary
     * test directory.
     * @param files - Mapping from relative file paths to their content.
     * @returns A promise resolving when all files have been written.
     */
    const createFiles = async (files: Mapping): Promise<void> => {
        for (const [path, content] of Object.entries(files)) {
            const filePath = join(directoryPath, path)

            await mkdir(dirname(filePath), {recursive: true})
            await writeFile(filePath, content)
        }
    }
    /**
     * Creates a file object as provided by directory traversing.
     * @param path - Location to describe.
     * @returns Corresponding file object.
     */
    const toFile = async (path: string): Promise<File> => ({
        directoryPath: dirname(path),
        directoryEntry: null,
        error: null,
        name: basename(path),
        path,
        stats: await stat(path)
    })

    beforeAll(async () => {
        await importFilesystemAPI()

        directoryPath = await makeTemporaryFile({directory: true})
    })

    afterAll(async () => {
        await rm(directoryPath, {recursive: true})
    })
    // region tests
    describe('makeTemporaryFile', () => {
        test('should create temporary directories', async () => {
            const path = await makeTemporaryFile({
                directory: true, prefix: 'DWTest'
            })

            expect(basename(path).startsWith('DWTest')).toStrictEqual(true)
            expect((await stat(path)).isDirectory()).toStrictEqual(true)

            await rm(path, {recursive: true})
        })

        test('should provide unused file paths', async () => {
            const path = await makeTemporaryFile({extension: '.json'})

            expect(basename(path)).toStrictEqual('DW.json')
            await expect(stat(path)).rejects.toThrow()
            expect((await stat(dirname(path))).isDirectory())
                .toStrictEqual(true)

            await rm(dirname(path), {recursive: true})
        })
    })

    describe('run', () => {
        test('should return standard output', () => {
            expect(run('echo test')).toStrictEqual('test\n')
            expect(run('pwd', {cwd: directoryPath}).trim())
                .toContain(basename(directoryPath))
        })

        test('should throw on failing commands', () => {
            expect(() => run('exit 1', {stdio: 'ignore'})).toThrow()
        })

        test('checkRun should indicate success', () => {
            expect(checkRun('true')).toStrictEqual(true)
            expect(checkRun('false', {stdio: 'ignore'})).toStrictEqual(false)
        })
    })

    describe('stream2buffer', () => {
        test('should concatenate all chunks', async () => {
            expect((await stream2buffer(Readable.from([
                Buffer.from('a'), Buffer.from('b')
            ]))).toString()).toStrictEqual('ab')
        })

        test('should reject on stream errors', async () => {
            const stream = new Readable({
                read() {
                    this.destroy(new Error('broken'))
                }
            })

            await expect(stream2buffer(stream)).rejects.toThrow('broken')
        })
    })

    describe('isFileIgnored', () => {
        beforeAll(async () => {
            await createFiles({
                'build/file.js': '',
                'node_modules/file.js': '',
                'params.json': '{}',
                'readme.md': ''
            })
        })

        test('should ignore hidden files except yarn ones', async () => {
            expect(await isFileIgnored('.git')).toStrictEqual(true)
            expect(await isFileIgnored('.eslintrc.json')).toStrictEqual(true)
            expect(await isFileIgnored('.yarnrc.yml')).toStrictEqual(false)
            expect(await isFileIgnored('.yarn')).toStrictEqual(false)
        })

        test('should ignore dummy documentation', async () => {
            expect(await isFileIgnored('dummyDocumentation.md'))
                .toStrictEqual(true)
        })

        test('should ignore build artifacts', async () => {
            expect(await isFileIgnored(join(directoryPath, 'build')))
                .toStrictEqual(true)
            expect(await isFileIgnored(join(directoryPath, 'node_modules')))
                .toStrictEqual(true)
            expect(await isFileIgnored(join(directoryPath, 'params.json')))
                .toStrictEqual(true)
        })

        test('should accept regular files', async () => {
            expect(await isFileIgnored(join(directoryPath, 'readme.md')))
                .toStrictEqual(false)
            // Only existing directories are ignored by name.
            expect(await isFileIgnored(join(directoryPath, 'missing/build')))
                .toStrictEqual(false)
        })
    })

    describe('copyRepositoryFile', () => {
        let sourcePath = ''
        let targetPath = ''

        beforeAll(async () => {
            sourcePath = join(directoryPath, 'copySource')
            targetPath = join(directoryPath, 'copyTarget')

            await createFiles({
                'copySource/dist/index.html': '',
                'copySource/file.txt': 'content',
                'copySource/readme.md': '# Readme',
                'copySource/sub/.hidden': ''
            })
            await mkdir(targetPath)
        })

        test('should copy files', async () => {
            expect(await copyRepositoryFile(
                sourcePath,
                targetPath,
                await toFile(join(sourcePath, 'file.txt'))
            )).toBeUndefined()

            expect(await readFile(join(targetPath, 'file.txt'), 'utf8'))
                .toStrictEqual('content')
        })

        test('should create directories', async () => {
            await copyRepositoryFile(
                sourcePath, targetPath, await toFile(join(sourcePath, 'sub'))
            )

            expect((await stat(join(targetPath, 'sub'))).isDirectory())
                .toStrictEqual(true)
        })

        test('should skip readme and ignored files', async () => {
            expect(await copyRepositoryFile(
                sourcePath,
                targetPath,
                await toFile(join(sourcePath, 'readme.md'))
            )).toStrictEqual(false)
            expect(await copyRepositoryFile(
                sourcePath,
                targetPath,
                await toFile(join(sourcePath, 'sub/.hidden'))
            )).toStrictEqual(false)
            expect(await copyRepositoryFile(
                sourcePath, targetPath, await toFile(join(sourcePath, 'dist'))
            )).toStrictEqual(false)

            await expect(stat(join(targetPath, 'readme.md'))).rejects
                .toThrow()
        })
    })

    describe('readReadmes', () => {
        test('should merge all not ignored readme files', async () => {
            const path = join(directoryPath, 'readmes')
            await createFiles({
                'readmes/readme.md': 'main',
                'readmes/sub/readme.txt': 'sub',
                'readmes/sub/other.md': 'other',
                'readmes/node_modules/readme.md': 'dependency'
            })

            const content = await readReadmes(path)

            expect(content.split('\n').sort())
                .toStrictEqual(['main', 'sub'])
        })

        test('should provide empty content without readme files', async () => {
            const path = join(directoryPath, 'noReadmes')
            await createFiles({'noReadmes/file.txt': ''})

            expect(await readReadmes(path)).toStrictEqual('')
        })
    })

    describe('determineDistributionFilePaths', () => {
        test('should expand directories and skip missing files', async () => {
            const path = join(directoryPath, 'distribution')
            await createFiles({
                'distribution/index.js': '',
                'distribution/lib/a.js': '',
                'distribution/lib/node_modules/b.js': '',
                'distribution/lib/.hidden': ''
            })

            expect((await determineDistributionFilePaths([
                join(path, 'index.js'),
                join(path, 'lib'),
                join(path, 'missing.js')
            ])).sort()).toStrictEqual([
                join(path, 'index.js'), join(path, 'lib/a.js')
            ])
            expectLogged(`Skip missing file "${join(path, 'missing.js')}"`)
        })
    })

    describe('createDistributionBundle', () => {
        let path = ''
        const workingDirectoryPath = process.cwd()

        beforeAll(async () => {
            path = join(directoryPath, 'bundle')
            await createFiles({
                'bundle/index.js': 'main',
                'bundle/lib/a.js': 'a'
            })

            // NOTE: Archive entries are named relative to working directory.
            process.chdir(path)
        })

        afterAll(() => {
            process.chdir(workingDirectoryPath)
        })

        test('should pack declared files', async () => {
            const files = ['lib']
            const bundleFilePath = await createDistributionBundle({
                files, main: 'index.js', name: 'test', version: '1.0.0'
            })

            expect(bundleFilePath).not.toBeNull()
            // Given configuration should not be modified.
            expect(files).toStrictEqual(['lib'])

            const directory = await Open.file(bundleFilePath as string)

            expect(directory.files.map(({path}) => path).sort())
                .toStrictEqual(['index.js', 'lib/a.js'])
            expect((await directory.files.find(({path}) =>
                path === 'index.js'
            )?.buffer())?.toString()).toStrictEqual('main')

            await rm(dirname(bundleFilePath as string), {recursive: true})
        })

        test('should provide nothing without files to pack', async () => {
            expect(await createDistributionBundle({
                name: 'test', version: '1.0.0'
            })).toBeNull()
        })
    })

    describe('determineRenderParameters', () => {
        test('should derive parameters from package configuration', () => {
            expect(determineRenderParameters({
                description: 'Description',
                name: 'test',
                version: '1.0.0',
                webDocumentation: {
                    languages: ['enUS', 'deDE'],
                    trackingCode: 'UA-0'
                }
            })).toStrictEqual({
                LANGUAGES: ['enUS', 'deDE'],
                NAME: 'test',
                TAGLINE: 'Description',
                TRACKING_CODE: 'UA-0'
            })
        })

        test('should prefer explicit documentation values', () => {
            expect(determineRenderParameters({
                description: 'Description',
                name: 'test',
                version: '1.0.0',
                webDocumentation: {name: 'Test', tagline: 'Tagline'}
            })).toStrictEqual({NAME: 'Test', TAGLINE: 'Tagline'})
        })

        test('should derive urls from homepage and repository', () => {
            expect(determineRenderParameters({
                homepage: 'https://example.com/test/',
                name: 'test',
                repository: {
                    type: 'git', url: 'git+https://github.com/user/test.git'
                },
                version: '1.0.0'
            })).toStrictEqual({
                NAME: 'test',
                SOURCE_URL: 'https://github.com/user/test',
                URL: 'https://example.com/test'
            })
        })

        test('should prefer explicit urls', () => {
            expect(determineRenderParameters({
                homepage: 'https://example.com/test',
                name: 'test',
                repository: 'user/test',
                version: '1.0.0',
                webDocumentation: {
                    sourceURL: 'https://git.example.com/test',
                    url: 'https://docs.example.com'
                }
            })).toStrictEqual({
                NAME: 'test',
                SOURCE_URL: 'https://git.example.com/test',
                URL: 'https://docs.example.com'
            })
        })
    })

    describe('determineSourceURL', () => {
        test('should derive browsable urls', () => {
            const github = 'https://github.com/user/test'
            const gitlab = 'https://gitlab.com/user/test'

            for (const [repository, expected] of [
                [undefined, null],
                ['', null],
                [{url: 'git+https://github.com/user/test.git'}, github],
                [gitlab, gitlab],
                ['git@github.com:user/test.git', github],
                ['git+ssh://git@github.com/user/test.git', github],
                ['github:user/test', github],
                ['gitlab:user/test', gitlab],
                ['user/test', github],
                ['file:../test', null]
            ] as Array<[unknown, null | string]>)
                expect(determineSourceURL(repository)).toStrictEqual(expected)
        })
    })

    describe('evaluatePathTemplate', () => {
        test('should evaluate against package configuration', () => {
            expect(evaluatePathTemplate(
                '${name}/${version}/', {name: 'test', version: '1.0.0'}
            )).toStrictEqual('test/1.0.0/')
        })

        test('should throw on invalid templates', () => {
            expect(() => evaluatePathTemplate(
                '${unknown.property}', {name: 'test', version: '1.0.0'}
            )).toThrow()
        })
    })

    describe('hasAPIDocumentationScript', () => {
        test('should detect document scripts', () => {
            expect(hasAPIDocumentationScript({
                name: 'test', scripts: {document: 'jsdoc'}, version: '1.0.0'
            })).toStrictEqual(true)
            expect(hasAPIDocumentationScript({
                name: 'test', scripts: {build: 'tsc'}, version: '1.0.0'
            })).toStrictEqual(false)
            expect(hasAPIDocumentationScript({name: 'test', version: '1.0.0'}))
                .toStrictEqual(false)
        })
    })

    describe('generateAndPushNewDocumentationPage', () => {
        const workingDirectoryPath = process.cwd()

        /**
         * Creates a project to deploy and a documentation website to render.
         * @param name - Unique name to separate test locations.
         * @returns Paths of created project and website.
         */
        const prepare = async (
            name: string
        ): Promise<{projectPath: string, websitePath: string}> => {
            await createFiles({
                [`${name}/project/.git/HEAD`]: 'ref',
                [`${name}/project/api/index.html`]: 'api',
                [`${name}/project/favicon.png`]: 'icon',
                [`${name}/project/node_modules/dependency/index.js`]: '',
                [`${name}/project/readme.md`]: '# Old',
                [`${name}/project/source.ts`]: '',
                [`${name}/website/dist/index.html`]: 'page',
                [`${name}/website/dist/readme.md`]: 'skipped',
                [`${name}/website/dist/style/main.css`]: 'style',
                [`${name}/website/src/image/logo.png`]: ''
            })

            return {
                projectPath: join(directoryPath, name, 'project'),
                websitePath: join(directoryPath, name, 'website')
            }
        }
        /**
         * Creates a mocked command runner which captures the rendering
         * parameters handed over to the documentation website build.
         * @param failingCommands - Commands which should fail.
         * @returns Mocked runner and captured rendering parameters.
         */
        const createRunCommand = (failingCommands: Array<string> = []) => {
            const result: {parameters: Mapping<unknown> | null} =
                {parameters: null}

            const runCommand = jest.fn<typeof run>((command: string) => {
                if (failingCommands.includes(command))
                    throw new Error(`Command "${command}" failed.`)

                const parametersFilePath =
                    /__reference__: "([^"]+)"/.exec(command)?.[1]
                if (parametersFilePath)
                    result.parameters = (JSON.parse(
                        readFileSync(parametersFilePath, 'utf8')
                    ) as {
                        module: {
                            preprocessor: {
                                ejs: {options: {locals: Mapping<unknown>}}
                            }
                        }
                    }).module.preprocessor.ejs.options.locals

                return ''
            })

            return {result, runCommand}
        }
        /**
         * Determines all commands given mocked runner was called with.
         * @param runCommand - Mocked runner.
         * @returns List of commands.
         */
        const getCommands = (
            runCommand: ReturnType<typeof createRunCommand>['runCommand']
        ): Array<string> =>
            runCommand.mock.calls.map(([command]) => command)

        afterAll(() => {
            process.chdir(workingDirectoryPath)
        })

        test('should render, copy artifacts and push', async () => {
            const {projectPath, websitePath} = await prepare('generate')
            await createFiles({
                'generate/project/api/test/1.0.0/index.html': 'api',
                'generate/bundleSource/index.js': 'main'
            })

            process.chdir(join(directoryPath, 'generate/bundleSource'))
            const bundleFilePath = await createDistributionBundle({
                main: 'index.js', name: 'test', version: '1.0.0'
            })

            process.chdir(projectPath)

            const {result, runCommand} =
                createRunCommand(['git config user.email'])

            await generateAndPushNewDocumentationPage(
                websitePath,
                bundleFilePath,
                {
                    apiDocumentationPathSuffix: 'test/1.0.0/',
                    content: '# Readme!',
                    hasAPIDocumentation: true,
                    locationsToTidyUp: [],
                    packageConfiguration: {
                        description: 'Description!',
                        name: 'test',
                        version: '1.0.0'
                    }
                },
                runCommand
            )

            process.chdir(workingDirectoryPath)
            // region rendering
            expect(result.parameters).toStrictEqual({
                API_DOCUMENTATION_PATH: 'api/test/1.0.0/',
                CONTENT: '# Readme#%%%#',
                DISTRIBUTION_BUNDLE_FILE_PATH: 'data/distributionBundle.zip',
                HAS_API_DOCUMENTATION: true,
                NAME: 'test',
                TAGLINE: 'Description#%%%#'
            })

            const buildCall = runCommand.mock.calls.find(([command]) =>
                command.startsWith('yarn build:web')
            )
            expect(buildCall?.[1]).toStrictEqual({cwd: websitePath})
            // endregion
            // region commands
            expect(getCommands(runCommand).filter((command) =>
                !command.startsWith('yarn build:web')
            )).toStrictEqual([
                'git config user.email',
                'git config user.email "github_actor@example.com"',
                'git config user.name',
                'git add --all --force -- \'data\' \'index.html\' ' +
                '\'style\'',
                'git add --all',
                'git commit --message "Update project homepage content." ' +
                '--all',
                'git push',
                'git checkout main'
            ])
            // endregion
            // region files
            expect(await readFile(join(projectPath, 'index.html'), 'utf8'))
                .toStrictEqual('page')
            expect(
                await readFile(join(projectPath, 'style/main.css'), 'utf8')
            ).toStrictEqual('style')
            expect(await readFile(
                join(projectPath, 'data/distributionBundle/index.js'), 'utf8'
            )).toStrictEqual('main')
            expect((await stat(join(
                projectPath, 'data/distributionBundle.zip'
            ))).isFile()).toStrictEqual(true)

            // Former project files have been replaced.
            for (const path of ['readme.md', 'source.ts', 'favicon.png'])
                await expect(stat(join(projectPath, path))).rejects.toThrow()
            // Ignored files and api documentation have been kept.
            for (const path of [
                '.git/HEAD',
                'api/test/1.0.0/index.html',
                'node_modules/dependency/index.js'
            ])
                expect((await stat(join(projectPath, path))).isFile())
                    .toStrictEqual(true)

            await expect(stat(websitePath)).rejects.toThrow()
            await expect(stat(bundleFilePath as string)).rejects.toThrow()
            // endregion
        })

        test('should handle missing bundle and api version', async () => {
            const {projectPath, websitePath} = await prepare('generateMinimal')

            process.chdir(projectPath)

            const {result, runCommand} = createRunCommand()

            await generateAndPushNewDocumentationPage(
                websitePath,
                null,
                {
                    apiDocumentationPathSuffix: 'test/1.0.0/',
                    content: '',
                    hasAPIDocumentation: true,
                    locationsToTidyUp: [],
                    packageConfiguration: {name: 'test', version: '1.0.0'}
                },
                runCommand
            )

            process.chdir(workingDirectoryPath)

            expect(result.parameters).toMatchObject({
                API_DOCUMENTATION_PATH: 'api/',
                DISTRIBUTION_BUNDLE_FILE_PATH: null,
                NAME: 'test'
            })
            // Existing git identity is kept.
            expect(getCommands(runCommand)).not.toContain(
                'git config user.email "github_actor@example.com"'
            )
            await expect(stat(join(projectPath, 'data'))).rejects.toThrow()
        })

        test('should skip api documentation if not available', async () => {
            const {projectPath, websitePath} = await prepare('generateNoAPI')

            process.chdir(projectPath)

            const {result, runCommand} = createRunCommand()

            await generateAndPushNewDocumentationPage(
                websitePath,
                null,
                {
                    apiDocumentationPathSuffix: 'test/1.0.0/',
                    content: '',
                    hasAPIDocumentation: false,
                    locationsToTidyUp: [],
                    packageConfiguration: {name: 'test', version: '1.0.0'}
                },
                runCommand
            )

            process.chdir(workingDirectoryPath)

            expect(result.parameters).toMatchObject({
                API_DOCUMENTATION_PATH: null, HAS_API_DOCUMENTATION: false
            })
        })
    })

    describe('tidyUp', () => {
        const workingDirectoryPath = process.cwd()
        let path = ''

        beforeAll(async () => {
            path = join(directoryPath, 'tidyUp')
            await mkdir(path)

            process.chdir(path)
        })

        afterAll(() => {
            process.chdir(workingDirectoryPath)
        })

        test('should remove locations and restore state', async () => {
            await createFiles({'tidyUp/temporary/file.txt': ''})
            const apiDocumentationPath = resolve('api')

            const runCommand = jest.fn<typeof run>((command: string) => {
                if (command === 'git branch')
                    return '  main\n* gh-pages\n'

                if (command.startsWith('git checkout \''))
                    throw new Error('Nothing to checkout.')

                return ''
            })

            await tidyUp(
                {
                    apiDocumentationPathSuffix: '',
                    content: '',
                    hasAPIDocumentation: true,
                    locationsToTidyUp: [join(path, 'temporary')],
                    packageConfiguration: {name: 'test', version: '1.0.0'}
                },
                runCommand
            )

            await expect(stat(join(path, 'temporary'))).rejects.toThrow()
            expect(runCommand.mock.calls.map(([command]) => command))
                .toStrictEqual([
                    `git checkout '${apiDocumentationPath}'`,
                    'git branch',
                    'git checkout main'
                ])
            expectLogged('Nothing to checkout.')
        })

        test('should do nothing on main branch', async () => {
            const runCommand = jest.fn<typeof run>(() => '* main\n')

            await tidyUp(
                {
                    apiDocumentationPathSuffix: '',
                    content: '',
                    hasAPIDocumentation: false,
                    locationsToTidyUp: [],
                    packageConfiguration: {name: 'test', version: '1.0.0'}
                },
                runCommand
            )

            expect(runCommand.mock.calls.map(([command]) => command))
                .toStrictEqual(['git branch'])
        })
    })
    // endregion
})
