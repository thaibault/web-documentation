import {Marked} from 'marked'
import {gfmHeadingId} from 'marked-gfm-heading-id'
import {markedHighlight} from 'marked-highlight'
import highlightJSModule from 'highlight.js'
import {markedXhtml} from 'marked-xhtml'

const {getLanguage, highlight} = highlightJSModule

const TOC_INDICATOR_HTML = '<!--wd-table-of-contents-->'

const marked = new Marked(
    markedHighlight({
        /*
            A string to prefix the className in a <code> block. Useful for
            syntax highlighting.
        */
        langPrefix: 'language-',
        highlight: (code, lang, info) =>
            highlight(
                code, {language: getLanguage(lang) ? lang : 'plaintext'}
            ).value
    })
)

export default (options) => {
    marked.setOptions(options)
    // Include an id attribute when emitting headings (h1, h2, h3, ...).
    marked.use(gfmHeadingId(
        {prefix: 'wd-heading-'},
        {
            hooks: {
                postprocess(html) {
                    const headings = getHeadingList()
                    const tableOfContents = `
                        <ul>${
                            headings
                                .map(({id, raw, level}) =>
                                    `<li><a href="#${id}">${raw}</a></li>`
                                )
                                .join('\n')
                        }</ul>
                    `

                    return html.replace(TOC_INDICATOR_HTML, tableOfContents)
                }
            }
        }
    ))
    // Favors self-closing xhtml tags.
    marked.use(markedXhtml())

    return marked.parse
}
