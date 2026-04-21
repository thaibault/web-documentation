// -*- coding: utf-8 -*-
/** @module type */
'use strict'
/* !
    region header
    [Project page](https://torben.website/website-utilities)

    Copyright Torben Sickert (info["~at~"]torben.website) 16.12.2012

    License
    -------

    This library written by Torben Sickert stand under a creative commons
    naming 3.0 unported license.
    See https://creativecommons.org/licenses/by/3.0/deed.de
    endregion
*/
// region exports
export interface DefaultOptions {
    selectors: {
        aboutThisWebsiteLink: string
        aboutThisWebsiteSection: string

        codeWrapper: string
        code: string

        headlines: string
        tableOfContent: string
        tableOfContentLinks: string
    }

    showExample: {
        domNodeName: string
        htmlWrapper: string
        pattern: string
    }
}
export type Options = DefaultOptions
// endregion
