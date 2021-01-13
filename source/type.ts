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
// region imports
import {ProcedureFunction, $DomNode} from 'clientnode/type'
import {
    DomNodes as BaseDomNodes,
    Options as BaseOptions,
    StaticScope as BaseStaticScope
} from 'website-utilities/type'

import Documentation from './index'
// endregion
// region exports
export type DocumentationFunction =
    ((...parameter:Array<any>) => any) &
    {class:typeof Documentation}
export interface StaticScope extends BaseStaticScope {
    Documentation:DocumentationFunction
}
declare global {
    interface JQueryStatic extends StaticScope {}
}
export type DomNodes<Type = string> = BaseDomNodes<Type> & {
    aboutThisWebsiteLink:Type
    aboutThisWebsiteSection:Type
    codeWrapper:Type
    code:Type
    homeLink:Type
    mainSection:Type
    tableOfContentLinks:Type
}
export type $DomNodes = DomNodes<$DomNode> & {
    parent:$DomNode<HTMLElement>
    window:$DomNode<Window>
}
export type Options = Partial<BaseOptions> & {
    codeTableWrapper:string
    domNodes:DomNodes
    onExamplesLoaded:ProcedureFunction
    section:{
        aboutThisWebsite:{
            fadeInOptions:JQuery.EffectsOptions<HTMLElement>
            fadeOutOptions:JQuery.EffectsOptions<HTMLElement>
        }
        main:{
            fadeInOptions:JQuery.EffectsOptions<HTMLElement>
            fadeOutOptions:JQuery.EffectsOptions<HTMLElement>
        }
    }
    showExample:{
        domNodeName:string
        htmlWrapper:string
        pattern:string
    }
}
// endregion
// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
