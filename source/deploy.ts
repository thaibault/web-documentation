// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module deploy */
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
import {execSync} from 'child_process'
import Tools, {optionalRequire} from 'clientnode'
import {File, Mapping, PlainObject} from 'clientnode/type'
import {createReadStream, createWriteStream, WriteStream} from 'fs'
import {
    copyFile, mkdir, readdir, readFile, rename, rm, rmdir, writeFile
} from 'fs/promises'
import highlightModule from 'highlight.js'
import {marked} from 'marked'
import {basename, extname, resolve} from 'path'
import {pipeline} from 'stream'
import {createGunzip, createGzip, Gzip} from 'zlib'
// endregion
const {getLanguage, highlight} = highlightModule

interface SCOPE_TYPE extends Mapping<unknown> {
    description?:string
    documentationWebsite?:PlainObject
    files?:Array<string>
    main?:string
    name:string
    scripts?:Mapping
    version:string
}

marked.use({
    // A prefix url for any relative link.
    baseUrl: '',
    // If true, add <br> on a single line break (copies GitHub behavior on
    // comments, but not on rendered markdown files). Requires gfm be true.
    breaks: false,
    // If true, use approved GitHub Flavored Markdown (GFM) specification.
    gfm: true,
    // If true, include an id attribute when emitting headings (h1, h2, h3,
    // etc).
    headerIds: true,
    // A string to prefix the id attribute when emitting headings (h1, h2, h3,
    // etc).
    headerPrefix: 'doc-',
    // A function to highlight code blocks, see Asynchronous highlighting.
    highlight: (code:string, language:string):string => (
        highlight(
            code, {language: getLanguage(language) ? language : 'plaintext'}
        ).value
    ),
    // A string to prefix the className in a <code> block. Useful for syntax
    // highlighting.
    langPrefix: 'language-',
    // If true, autolinked email address is escaped with HTML character
    // references.
    mangle: true,
    // If true, conform to the original markdown.pl as much as possible. Don't
    // fix original markdown bugs or behavior. Turns off and overrides gfm.
    pedantic: false,
    // An object containing functions to render tokens to HTML. See
    // extensibility for more details.
    // // renderer: new Renderer(),
    // A function to sanitize the HTML passed into markdownString.
    sanitizer: Tools.identity,
    // If true, the parser does not throw any exception.
    silent: false,
    // If true, use smarter list behavior than those found in markdown.pl.
    smartLists: true,
    // If true, use "smart" typographic punctuation for things like quotes and
    // dashes.
    smartypants: true,
    // An object containing functions to create tokens from markdown. See
    // extensibility for more details.
    // tokenizer: new Tokenizer(),
    // A function which is called for every token. See extensibility for more
    // details.
    walkTokens: undefined,
    // If true, emit self-closing HTML tags for void elements (<br/>, <img/>,
    // etc.) with a "/" as required by XHTML.
    xhtml: true
})

const run = (command:string, options = {}):string =>
    execSync(command, {encoding: 'utf-8', shell: '/bin/bash', ...options})

// region globals
/// region locations
const DOCUMENTATION_BUILD_PATH = 'build/'
const DATA_PATH = 'data/'
const API_DOCUMENTATION_PATHS = ['apiDocumentation/', '/api/']
let API_DOCUMENTATION_PATH_SUFFIX = '${name}/${version}/'
const DISTRIBUTION_BUNDLE_FILE_PATH = `${DATA_PATH}distributionBundle.zip`
const DISTRIBUTION_BUNDLE_DIRECTORY_PATH = `${DATA_PATH}distributionBundle`
/// endregion
let BUILD_DOCUMENTATION_PAGE_COMMAND = 'yarn build ${parametersFilePath}'
const BUILD_DOCUMENTATION_PAGE_CONFIGURATION = {
    module: {
        preprocessor: {
            ejs: {
                options: {
                    locals: {__evaluate__: 'parameters'}
                }
            }
        }
    },
    /*
        NOTE: We habe to disable offline features since the domains cache is
        already in use for the main home page.
    */
    offline: null
}
let CONTENT = ''
const DOCUMENTATION_REPOSITORY =
    'git@github.com:"thaibault/documentationWebsite"'
const PROJECT_PAGE_COMMIT_MESSAGE = 'Update project homepage content.'
let SCOPE:SCOPE_TYPE = {name: '__dummy__', version: '1.0.0'}
// endregion
// region functions
/**
 * Renders a new index.html file and copies new assets to generate a new
 * documentation homepage.
 * @param temporaryDocumentationFolderPath - Location where to build
 * documentation build.
 * @param distributionBundleFilePath - Location where to save the exported
 * build artefacts.
 * @param hasAPIDocumentationCommand - Indicates whether there already exists
 * a ready to use api documentation.
 *
 * @returns A promise resolving when build process has finished.
 */
const generateAndPushNewDocumentationPage = async (
    temporaryDocumentationFolderPath:string,
    distributionBundleFilePath:null|string,
    hasAPIDocumentationCommand:boolean
):Promise<void> => {
    console.info('Update documentation design.')

    if (distributionBundleFilePath) {
        const newDistributionBundleFilePath =
            temporaryDocumentationFolderPath +
            DOCUMENTATION_BUILD_PATH +
            DISTRIBUTION_BUNDLE_FILE_PATH

        await mkdir(newDistributionBundleFilePath, {recursive: true})
        await rename(distributionBundleFilePath, newDistributionBundleFilePath)

        const newDistributionBundleDirectoryPath =
            temporaryDocumentationFolderPath +
            DOCUMENTATION_BUILD_PATH +
            DISTRIBUTION_BUNDLE_DIRECTORY_PATH

        await mkdir(newDistributionBundleDirectoryPath, {recursive: true})

        createReadStream(distributionBundleFilePath)
            .pipe(createGunzip())
            .pipe(createWriteStream(newDistributionBundleDirectoryPath))
    }

    const faviconPath = 'favicon.png'
    if (await Tools.isFile(faviconPath))
        await copyFile(
            faviconPath,
            `${temporaryDocumentationFolderPath}/source/image/favicon.ico`
        )

    let parameters:Mapping<unknown> = {}
    for (const [key, value] of Object.entries(
        SCOPE.documentationWebsite || {}
    ))
        parameters[Tools.stringCamelCaseToDelimited(key)] = value
    if (!parameters.TAGLINE && SCOPE.description)
        parameters.TAGLINE = SCOPE.description
    if (!parameters.NAME && SCOPE.name)
        parameters.NAME = SCOPE.name

    console.debug(`Found parameters "${Tools.represent(parameters)}".`)

    let apiDocumentationPath:null|string = null
    if (hasAPIDocumentationCommand) {
        apiDocumentationPath =
            API_DOCUMENTATION_PATHS[1] + API_DOCUMENTATION_PATH_SUFFIX
        if (!(await Tools.isDirectory(apiDocumentationPath)))
            apiDocumentationPath = API_DOCUMENTATION_PATHS[1]
    }

    parameters = {
        ...parameters,
        CONTENT,
        CONTENT_FILE_PATH: null,
        RENDER_CONTENT: false,
        API_DOCUMENTATION_PATH: apiDocumentationPath,
        DISTRIBUTION_BUNDLE_FILE_PATH:
            (
                distributionBundleFilePath &&
                await Tools.isFile(distributionBundleFilePath)
            ) ?
                DISTRIBUTION_BUNDLE_FILE_PATH :
                null
    }

    for (const [key, value] of Object.entries(parameters))
        if (typeof value === 'string')
            parameters[key] = value.replace('!', '#%%%#')

    const serializedParameters:string =
        JSON.stringify(Tools.evaluateDynamicData(
            BUILD_DOCUMENTATION_PAGE_CONFIGURATION, {parameters, ...SCOPE}
        ))
    const parametersFilePath:string = run('mktemp --suffix .json')
    await writeFile(parametersFilePath, serializedParameters)
    BUILD_DOCUMENTATION_PAGE_COMMAND = Tools.stringEvaluate(
        BUILD_DOCUMENTATION_PAGE_COMMAND,
        {parameters, parametersFilePath, ...SCOPE}
    ).result

    console.debug(`Use parameters "${serializedParameters}".`)
    console.info(`Run "${BUILD_DOCUMENTATION_PAGE_COMMAND}".`)

    run(
        BUILD_DOCUMENTATION_PAGE_COMMAND,
        {cwd: temporaryDocumentationFolderPath}
    )
    await rm(parametersFilePath)

    for (const filePath of await readdir('./'))
        if (
            ![
                temporaryDocumentationFolderPath,
                `.${API_DOCUMENTATION_PATHS[1]}`
            ].includes(filePath) ||
            await isFileIgnored(filePath)
        )
            await rm(filePath)

    const documentationBuildFolderPath =
        temporaryDocumentationFolderPath + DOCUMENTATION_BUILD_PATH
    await Tools.walkDirectoryRecursively(
        documentationBuildFolderPath,
        (file:File):Promise<false|void> =>
            copyRepositoryFile(file, documentationBuildFolderPath)
    )

    await rmdir(temporaryDocumentationFolderPath, {recursive: true})

    run('git add --all')
    run(`git commit --message "${PROJECT_PAGE_COMMIT_MESSAGE}" --all`)
    run('git push')
    run('git checkout master')
}

/**
 * Creates a distribution bundle file as zip archiv.
 */
const createDistributionBundle = async ():Promise<null|string> => {
    if (
        SCOPE.scripts &&
        (SCOPE.scripts['build:export'] || SCOPE.scripts.build)
    )
        run(`yarn ${SCOPE.scripts['build:export'] ? 'build:export' : 'build'}`)

    console.info('Pack to a zip archive.')
    const distributionBundleFilePath:string = run('mktemp')

    const filePaths = SCOPE.files || []
    if (SCOPE.main)
        filePaths.push(SCOPE.main)

    if (filePaths.length === 0)
        return null

    const gzip:Gzip = createGzip()
    const destination:WriteStream =
        createWriteStream(distributionBundleFilePath)

    const add = async (filePaths:Array<string>):Promise<void> => {
        for (const filePath of filePaths) {
            console.debug(`Add "${filePath}" to distribution bundle.`)

            if (!(await isFileIgnored(filePath)))
                if (await Tools.isDirectory(filePath))
                    await add(await readdir('./'))
                else
                    pipeline(
                        createReadStream(filePath),
                        gzip,
                        destination,
                        (error:Error|null) => {
                            if (error) {
                                console.error('An error occurred:', error)

                                process.exitCode = 1
                            }
                        }
                    )
        }
    }

    await add(filePaths)

    return distributionBundleFilePath
}
/**
 * Checks if given file path points to a file which should not be distributed
 * for generic reasons.
 * @param filePath - File path to check.
 *
 * @returns Promise wrapping indicating boolean.
 */
const isFileIgnored = async (filePath:string):Promise<boolean> => (
    basename(filePath, extname(filePath)).startsWith('.') ||
    basename(filePath, extname(filePath)) === 'dummyDocumentation' ||
    await Tools.isDirectory(filePath) &&
    ['node_modules', 'build'].includes(basename(filePath)) ||
    await Tools.isFile(filePath) &&
    basename(filePath) === 'params.json' ||
    ['pyc', 'pyo'].includes(extname(filePath).substring(1))
)

/**
 * Copy the website documentation design repository.
 * @param source - Location to copy.
 * @param targetPath - Location where to copy given source.
 *
 * @returns Promise resolving when finished coping.
 */
const copyRepositoryFile = async (source:File, targetPath:string):Promise<
    false|void
> => {
    if (
        await isFileIgnored(source.path) ||
        basename(source.name) === 'readme.md'
    )
        return false

    console.debug('Copy "%s" to "%s".', source.path, targetPath)

    if (source.stats!.isFile())
        await copyFile(source.path, targetPath)
    else
        await mkdir(targetPath)
}

/**
 * Merges all readme file.
 * @param file - File to check if it is a readme and should be added to the
 * output content.
 *
 * @returns Nothing.
 */
const addReadme = async (file:File):Promise<false|void> => {
    if (await isFileIgnored(file.path))
        return false

    if (basename(file.name, extname(file.name)) === 'readme') {
        console.info(`Handle "${file.path}".`)

        if (CONTENT)
            CONTENT += '\n'

        CONTENT += await readFile(file.path, 'utf8')
    }
}
// endregion
if (
    run('git branch').includes('* master') &&
    run('git branch --all').includes('gh-pages')
) {
    SCOPE = optionalRequire('./package.json') || SCOPE

    API_DOCUMENTATION_PATH_SUFFIX = Tools.stringEvaluate(
        API_DOCUMENTATION_PATH_SUFFIX, SCOPE
    ).result

    const temporaryDocumentationFolderPath = 'documentationWebsite'
    if (await Tools.isDirectory(temporaryDocumentationFolderPath))
        await rmdir(temporaryDocumentationFolderPath, {recursive: true})

    console.info('Compile all readme markdown files to html.')

    await Tools.walkDirectoryRecursively('./', addReadme)

    CONTENT = marked.parse(CONTENT)

    const distributionBundleFilePath:null|string =
        await createDistributionBundle()
    if (
        distributionBundleFilePath &&
        await Tools.isFile(distributionBundleFilePath)
    ) {
        await mkdir(DATA_PATH, {recursive: true})
        await rename(distributionBundleFilePath, DATA_PATH)
    }

    let hasAPIDocumentationCommand:boolean =
        Boolean(SCOPE.scripts) &&
        Object.prototype.hasOwnProperty.call(SCOPE.scripts, 'document')
    if (hasAPIDocumentationCommand)
        try {
            run('yarn document')
        } catch (error) {
            hasAPIDocumentationCommand = false
        }

    run('git checkout gh-pages')
    run('git pull')

    const apiDocumentationDirectoryPath = `.${API_DOCUMENTATION_PATHS[1]}`
    if (await Tools.isDirectory(apiDocumentationDirectoryPath))
        await rmdir(apiDocumentationDirectoryPath, {recursive: true})

    await rename(API_DOCUMENTATION_PATHS[0], apiDocumentationDirectoryPath)

    const localDocumentationWebsitePath =
        `../${basename(temporaryDocumentationFolderPath)}`
    if (await Tools.isDirectory(localDocumentationWebsitePath)) {
        await mkdir(temporaryDocumentationFolderPath, {recursive: true})

        await Tools.walkDirectoryRecursively(
            localDocumentationWebsitePath,
            (file:File):Promise<false|void> =>
                copyRepositoryFile(file, temporaryDocumentationFolderPath)
        )

        const nodeModulesDirectoryPath =
            resolve(localDocumentationWebsitePath, 'node_modules')
        if (await Tools.isDirectory(nodeModulesDirectoryPath)) {
            const temporaryDocumentationNodeModulesDirectoryPath:string =
                resolve(temporaryDocumentationFolderPath, 'node_modules')
            /*
                We copy just recursively reference files.

                NOTE: Symlinking doesn't work since some node modules
                need the right absolute location to work.

                NOTE: Coping complete "node_modules" folder takes to
                long.

                NOTE: Mounting "node_modules" folder needs root
                privileges.
            */
            run(`
                cp
                --dereference
                --recursive
                --reflink=auto
                '${nodeModulesDirectoryPath}'
                '${temporaryDocumentationNodeModulesDirectoryPath}'
            `)
        } else
            run('yarn --production=false')

        run('yarn clear', {cwd: temporaryDocumentationFolderPath})
    } else
        run(`
            unset GIT_WORK_TREE;
            git clone '${DOCUMENTATION_REPOSITORY}';
            yarn --production=false
        `)

    await generateAndPushNewDocumentationPage(
        temporaryDocumentationFolderPath,
        distributionBundleFilePath,
        hasAPIDocumentationCommand
    )

    if (await Tools.isDirectory(apiDocumentationDirectoryPath))
        await rmdir(apiDocumentationDirectoryPath, {recursive: true})
}


// region vim modline
// vim: set tabstop=4 shiftwidth=4 expandtab:
// vim: foldmethod=marker foldmarker=region,endregion:
// endregion
