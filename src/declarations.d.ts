// -*- coding: utf-8 -*-
/** @module declarations */
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
// region declarations
declare module '*/renderMarkdown' {
    import type {MarkedOptions} from 'marked'

    const createRenderer: (
        options: MarkedOptions
    ) => (markdown: string) => string

    export default createRenderer
}
// endregion
