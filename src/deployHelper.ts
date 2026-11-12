// -*- coding: utf-8 -*-
/** @module deployHelper */
'use strict'
/* !
    region header
    [Project page](https://tsickert.com/website-utilities)

    Copyright Torben Sickert (info["~at~"]tsickert.com) 16.12.2012

    License
    -------

    This library written by Torben Sickert stands under a creative commons
    naming 4.0 international license.
    See https://creativecommons.org/licenses/by/4.0/deed.de
    endregion
*/
// region imports
import type {
    EvaluationResult, File, Mapping, PositiveEvaluationResult
} from 'clientnode'
import type {ExecSyncOptionsWithStringEncoding} from 'child_process'
import type {Stream} from 'stream'

import {ZipArchive} from 'archiver'
import {execSync} from 'child_process'
import {
    camelCaseToDelimited,
    copy,
    evaluate,
    evaluateAsyncDynamicData,
    evaluateDynamicData,
    isDirectory,
    isFile,
    Logger,
    represent,
    walkDirectoryRecursively
} from 'clientnode'
import {createReadStream, createWriteStream} from 'fs'
import {
    copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile
} from 'fs/promises'
import {tmpdir} from 'node:os'
import {basename, dirname, extname, join, relative, resolve} from 'path'
import {Extract} from 'unzipper'
// endregion
// region types
export interface WebDocumentationConfiguration {
    name?: string
    languages?: Array<string>
    sourceURL?: string
    tagline?: string
    trackingCode?: string
    url?: string
}
export interface MakeTemporaryFileOptions {
    directory: boolean
    encoding?: BufferEncoding | null
    extension: string
    prefix: string
}
export interface PackageConfiguration extends Mapping<unknown> {
    description?: string
    webDocumentation?: WebDocumentationConfiguration
    files?: Array<string>
    homepage?: string
    main?: string
    name: string
    scripts?: Mapping
    version: string
}
export interface DeploymentState {
    apiDocumentationPathSuffix: string
    content: string
    hasAPIDocumentation: boolean
    locationsToTidyUp: Array<string>
    packageConfiguration: PackageConfiguration
}
// endregion
/*
    NOTE: All filesystem related helper expect "importFilesystemAPI" from
    "clientnode" to be already resolved.
*/
export const log =
    new Logger({name: 'web-documentation.deploy', level: 'debug'})
// region globals
/// region locations
/*
    NOTE: Locations are relative to the current working directory at usage
    time (the project to deploy).
*/
export const DOCUMENTATION_BUILD_PATH = 'dist'
export const DATA_PATH = 'data'
export const API_DOCUMENTATION_PATHS = ['apiDocumentation/', 'api/']
export const API_DOCUMENTATION_PATH_SUFFIX_TEMPLATE = '${name}/${version}/'
export const DISTRIBUTION_BUNDLE_FILE_PATH =
    join(DATA_PATH, 'distributionBundle.zip')
export const DISTRIBUTION_BUNDLE_DIRECTORY_PATH =
    join(DATA_PATH, 'distributionBundle')
/// endregion
export const BUILD_DOCUMENTATION_PAGE_COMMAND_TEMPLATE =
    '`yarn build:web \'{__reference__: "${parametersFilePath}"}\'`'
export const BUILD_DOCUMENTATION_PAGE_CONFIGURATION = {
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
        NOTE: We have to disable offline features since the domains cache is
        already in use for the main home page.
    */
    offline: null
}
export const PROJECT_PAGE_COMMIT_MESSAGE = 'Update project homepage content.'
// endregion
// region functions
/**
 * Creates temporary directories or provides temporary not yet used file
 * locations.
 * @param givenOptions - Defines options to influence the file path creation.
 * @returns Determined file path.
 */
export const makeTemporaryFile = async (
    givenOptions: Partial<MakeTemporaryFileOptions> = {}
): Promise<string> => {
    const options: MakeTemporaryFileOptions = {
        directory: false,
        encoding: 'utf8',
        extension: '',
        prefix: 'DW',
        ...givenOptions
    }

    const directoryPath: string =
        await mkdtemp(join(tmpdir(), options.prefix), options.encoding)

    if (options.directory)
        return directoryPath

    return join(directoryPath, `${options.prefix}${options.extension}`)
}
/**
 * Provides generic shell execution for given commands. When errors occur (none
 * zero return code) they will result in a thrown exception.
 * @param command - To execute.
 * @param options - To be forward the node's native "execSync" function.
 * @returns The resulting stdout. You need to forward them to console to make
 * it visible.
 */
export const run = (
    command: string, options: Partial<ExecSyncOptionsWithStringEncoding> = {}
): string =>
    execSync(command, {encoding: 'utf-8', shell: '/bin/bash', ...options})
/**
 * Checks if given command throws an error or not.
 * @param command - To execute.
 * @param options - To be forward the node's native "execSync" function.
 * @param runCommand - Function to execute given command with.
 * @returns Boolean indicating whether given command runs successful or not.
 */
export const checkRun = (
    command: string,
    options: Partial<ExecSyncOptionsWithStringEncoding> = {},
    runCommand: typeof run = run
): boolean => {
    try {
        runCommand(command, options)
        return true
    } catch (_error) {
        return false
    }
}
/**
 * Converts a given stream into a buffer.
 * @param stream - To Convert.
 * @returns Converted buffer.
 */
export const stream2buffer = async (stream: Stream): Promise<Buffer> => {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Array<Uint8Array> = []
        stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
        stream.on('end', () => {
            resolve(Buffer.concat(chunks))
        })
        stream.on('error', (error: Error) => {
            reject(error)
        })
    })
}
/**
 * Checks if given file path points to a file which should not be distributed
 * for generic reasons.
 * @param filePath - File path to check.
 * @returns Promise wrapping indicating boolean.
 */
export const isFileIgnored = async (filePath: string): Promise<boolean> => (
    basename(filePath, extname(filePath)).startsWith('.') &&
    !basename(filePath).startsWith('.yarn') ||
    basename(filePath, extname(filePath)) === 'dummyDocumentation' ||
    await isDirectory(filePath) &&
    ['node_modules', 'build'].includes(basename(filePath)) ||
    await isFile(filePath) &&
    basename(filePath) === 'params.json'
)
/**
 * Copy the website documentation design repository.
 * @param sourcePath - Location to copy from.
 * @param targetPath - Location where to copy given source.
 * @param file - Location to copy.
 * @returns Promise resolving when finished coping.
 */
export const copyRepositoryFile = async (
    sourcePath: string, targetPath: string, file: File
): Promise<false | undefined> => {
    if (
        await isFileIgnored(file.path) ||
        basename(file.name) === 'readme.md' ||
        // NOTE: Skip stale build artifacts of given documentation website.
        resolve(file.path) === resolve(sourcePath, DOCUMENTATION_BUILD_PATH)
    )
        return false

    targetPath = join(targetPath, relative(sourcePath, file.path))

    void log.debug(`Copy "${file.path}" to "${targetPath}".`)

    if (file.stats?.isFile())
        await copyFile(file.path, targetPath)
    else
        await mkdir(targetPath)
}
/**
 * Merges all readme files found in given directory recursively.
 * @param directoryPath - Location to search for readme files.
 * @returns Merged readme contents.
 */
export const readReadmes = async (directoryPath: string): Promise<string> => {
    let content = ''

    await walkDirectoryRecursively(
        directoryPath,
        async (file: File): Promise<false | undefined> => {
            if (await isFileIgnored(file.path))
                return false

            if (basename(file.name, extname(file.name)) === 'readme') {
                void log.info(`Handle "${file.path}".`)

                if (content)
                    content += '\n'

                content += await readFile(file.path, 'utf8')
            }
        }
    )

    return content
}
/**
 * Determines all files to distribute by expanding given file and directory
 * paths.
 * @param filePaths - File and directory paths to expand.
 * @returns Absolute paths of all files to distribute.
 */
export const determineDistributionFilePaths = async (
    filePaths: Array<string>
): Promise<Array<string>> => {
    let result: Array<string> = []

    for (let filePath of filePaths) {
        filePath = resolve(filePath)

        if (!(await isFileIgnored(filePath)))
            if (await isDirectory(filePath))
                result = result.concat(await determineDistributionFilePaths(
                    (await readdir(filePath)).map((path: string): string =>
                        resolve(filePath, path)
                    )
                ))
            else if (await isFile(filePath)) {
                void log.debug(`Add "${filePath}" to distribution bundle.`)

                result.push(filePath)
            } else
                void log.warn(
                    `Skip missing file "${filePath}" declared in package ` +
                    'configuration.'
                )
    }

    return result
}
/**
 * Creates a distribution bundle file as zip archiv.
 * @param packageConfiguration - Package configuration describing files to
 * distribute.
 * @returns Path to build distribution bundle or "null" if there is nothing to
 * distribute.
 */
export const createDistributionBundle = async (
    packageConfiguration: PackageConfiguration
): Promise<null | string> => {
    if (packageConfiguration.scripts?.build) {
        void log.info('Build distribution bundle via "yarn build".')
        void log.debug(run('yarn build'))
    }

    const filePaths = [...(packageConfiguration.files || [])]
    if (packageConfiguration.main)
        filePaths.push(packageConfiguration.main)

    if (filePaths.length === 0)
        return null

    void log.info('Pack to a zip archive.')
    const distributionBundleFilePath: string =
        await makeTemporaryFile({extension: '.zip'})

    const archive = new ZipArchive({zlib: {level: 9}})
    const outputStream = createWriteStream(distributionBundleFilePath)

    // NOTE: The archive is complete when its output has been flushed.
    const promise = new Promise<void>((
        resolve: () => void, reject: (reason: Error) => void
    ): void => {
        outputStream.on('close', resolve)
        outputStream.on('error', reject)
        archive.on('error', reject)
    })

    archive.on('warning', (error: Error): void => {
        void log.warn(error)
    })

    archive.pipe(outputStream)

    for (const filePath of await determineDistributionFilePaths(filePaths))
        archive.append(
            await stream2buffer(createReadStream(filePath)),
            {name: relative('./', filePath)}
        )

    await archive.finalize()

    await promise

    return distributionBundleFilePath
}
/**
 * Derives a browsable source code url from given package repository
 * declaration.
 * @param repository - Repository declaration as string (url or shorthand like
 * "github:user/project") or object holding an "url" property.
 * @returns Determined url or "null" if nothing could be derived.
 */
export const determineSourceURL = (repository: unknown): null | string => {
    let url: unknown = repository
    if (url !== null && typeof url === 'object')
        url = (url as {url?: unknown}).url

    if (typeof url !== 'string' || !url.trim())
        return null

    url = url.trim()
        .replace(/^git\+/, '')
        .replace(/^git@([^:]+):/, 'https://$1/')
        .replace(/^(?:git|ssh):\/\/(?:[^@/]+@)?/, 'https://')
        .replace(/^github:/, 'https://github.com/')
        .replace(/^gitlab:/, 'https://gitlab.com/')
        .replace(/^bitbucket:/, 'https://bitbucket.org/')
        .replace(/\.git$/, '')

    if (/^[^/:]+\/[^/:]+$/.test(url as string))
        // NOTE: Shorthand "user/project" refers to GitHub.
        return `https://github.com/${url as string}`

    return /^https?:\/\//.test(url as string) ? url as string : null
}
/**
 * Determines parameters to render the documentation website with.
 * @param packageConfiguration - Package configuration to derive parameters
 * from.
 * @returns Parameters with upper case delimited names.
 */
export const determineRenderParameters = (
    packageConfiguration: PackageConfiguration
): Mapping<unknown> => {
    const parameters: Mapping<unknown> = {}

    for (const [key, value] of Object.entries(
        packageConfiguration.webDocumentation || {}
    ))
        parameters[camelCaseToDelimited(key, '_').toUpperCase()] = value

    if (!parameters.TAGLINE && packageConfiguration.description)
        parameters.TAGLINE = packageConfiguration.description
    if (!parameters.NAME && packageConfiguration.name)
        parameters.NAME = packageConfiguration.name
    if (!parameters.URL && packageConfiguration.homepage)
        parameters.URL = packageConfiguration.homepage.replace(/\/+$/, '')
    if (!parameters.SOURCE_URL) {
        const sourceURL = determineSourceURL(packageConfiguration.repository)
        if (sourceURL)
            parameters.SOURCE_URL = sourceURL
    }

    return parameters
}
/**
 * Evaluates given path template against given package configuration.
 * @param template - Template string to evaluate.
 * @param packageConfiguration - Scope to evaluate against.
 * @returns Evaluated path.
 */
export const evaluatePathTemplate = (
    template: string, packageConfiguration: PackageConfiguration
): string => {
    const evaluationResult: EvaluationResult =
        evaluate(`\`${template}\``, {scope: packageConfiguration})

    if (evaluationResult.error)
        throw new Error(evaluationResult.error)

    return (evaluationResult as PositiveEvaluationResult).result
}
/**
 * Checks whether given package configuration provides a script to generate an
 * api documentation.
 * @param packageConfiguration - Package configuration to check.
 * @returns Indicates whether a "document" script exists.
 */
export const hasAPIDocumentationScript = (
    packageConfiguration: PackageConfiguration
): boolean =>
    Boolean(packageConfiguration.scripts) &&
    Object.prototype.hasOwnProperty.call(
        packageConfiguration.scripts, 'document'
    )
/**
 * Renders a new index.html file and copies new assets to generate a new
 * documentation homepage.
 * @param temporaryDocumentationFolderPath - Location where to build
 * documentation build.
 * @param distributionBundleFilePath - Location where to save the exported
 * build artifacts.
 * @param state - Collected deployment state.
 * @param runCommand - Function to execute shell commands with.
 * @returns A promise resolving when build process has finished.
 */
export const generateAndPushNewDocumentationPage = async (
    temporaryDocumentationFolderPath: string,
    distributionBundleFilePath: null | string,
    state: DeploymentState,
    runCommand: typeof run = run
): Promise<void> => {
    void log.info('Generate document website artifacts.')

    /*
        NOTE: We have to determine the bundles final location before rendering
        since the check for its existence has to run against the just build
        artifact and not against a potential leftover from a previous run.
    */
    const newDistributionBundleFilePath: null | string =
        distributionBundleFilePath ?
            join(
                temporaryDocumentationFolderPath,
                relative('./', DOCUMENTATION_BUILD_PATH),
                relative('./', DISTRIBUTION_BUNDLE_FILE_PATH)
            ) :
            null

    if (distributionBundleFilePath && newDistributionBundleFilePath) {
        void log.info('Prepare distribution files.')

        await mkdir(dirname(newDistributionBundleFilePath), {recursive: true})
        await copyFile(
            distributionBundleFilePath, newDistributionBundleFilePath
        )
        await rm(distributionBundleFilePath)

        const newDistributionBundleDirectoryPath = join(
            temporaryDocumentationFolderPath,
            relative('./', DOCUMENTATION_BUILD_PATH),
            relative('./', DISTRIBUTION_BUNDLE_DIRECTORY_PATH)
        )

        await mkdir(newDistributionBundleDirectoryPath, {recursive: true})

        await new Promise<void>((
            resolve: () => void, reject: (reason: Error) => void
        ) => {
            createReadStream(newDistributionBundleFilePath)
                .pipe(Extract({path: newDistributionBundleDirectoryPath}))
                .on('close', () => {
                    resolve()
                })
                .on('error', (error: Error) => {
                    reject(error)
                })
        })
    }

    void log.info('Prepare favicon file.')
    const faviconPath = 'favicon.png'
    if (await isFile(faviconPath))
        await copyFile(
            faviconPath,
            `${temporaryDocumentationFolderPath}/src/image/favicon.ico`
        )

    void log.info('Render html.')

    let parameters: Mapping<unknown> =
        determineRenderParameters(state.packageConfiguration)

    void log.debug(`Found parameters "${represent(parameters)}" to render.`)

    let apiDocumentationPath: null | string = null
    if (state.hasAPIDocumentation) {
        apiDocumentationPath =
            API_DOCUMENTATION_PATHS[1] + state.apiDocumentationPathSuffix
        if (!(await isDirectory(apiDocumentationPath)))
            apiDocumentationPath = API_DOCUMENTATION_PATHS[1]
    }

    parameters = {
        ...parameters,
        CONTENT: state.content,
        API_DOCUMENTATION_PATH: apiDocumentationPath,
        HAS_API_DOCUMENTATION: state.hasAPIDocumentation,
        DISTRIBUTION_BUNDLE_FILE_PATH:
            newDistributionBundleFilePath &&
            await isFile(newDistributionBundleFilePath) ?
                relative('./', DISTRIBUTION_BUNDLE_FILE_PATH) :
                null
    }

    for (const [key, value] of Object.entries(parameters))
        if (typeof value === 'string')
            parameters[key] = value.replace('!', '#%%%#')

    const evaluationOptions =
        {scope: {parameters, ...state.packageConfiguration}}
    const serializedParameters: string = JSON.stringify(
        await evaluateAsyncDynamicData(
            /*
                NOTE: Evaluation replaces dynamic values in place so we have
                to keep the template configuration untouched.
            */
            evaluateDynamicData(
                copy(BUILD_DOCUMENTATION_PAGE_CONFIGURATION), evaluationOptions
            ),
            evaluationOptions
        )
    )
    const parametersFilePath: string =
        await makeTemporaryFile({extension: '.json'})
    await writeFile(parametersFilePath, serializedParameters)

    const evaluationResult: EvaluationResult = evaluate(
        BUILD_DOCUMENTATION_PAGE_COMMAND_TEMPLATE,
        {
            scope: {
                parameters, parametersFilePath, ...state.packageConfiguration
            }
        }
    )

    if (evaluationResult.error)
        throw new Error(evaluationResult.error)

    const buildDocumentationPageCommand =
        (evaluationResult as PositiveEvaluationResult).result

    void log.debug(`Use final parameters "${serializedParameters}".`)
    void log.info(`Run "${buildDocumentationPageCommand}".`)
    void log.debug(runCommand(
        buildDocumentationPageCommand, {cwd: temporaryDocumentationFolderPath}
    ))
    await rm(parametersFilePath)

    for (const filePath of await readdir('./'))
        if (!(
            [
                resolve(temporaryDocumentationFolderPath),
                resolve(API_DOCUMENTATION_PATHS[1])
            ].includes(resolve(filePath)) ||
            await isFileIgnored(filePath)
        ))
            await rm(filePath, {recursive: true})

    void log.info('Copy all build artifacts.')

    const documentationBuildFolderPath = join(
        temporaryDocumentationFolderPath,
        relative('./', DOCUMENTATION_BUILD_PATH)
    )
    const copiedTopLevelPaths: Array<string> = []
    await walkDirectoryRecursively(
        documentationBuildFolderPath,
        async (file: File): Promise<false | undefined> => {
            const result = await copyRepositoryFile(
                documentationBuildFolderPath, './', file
            )

            if (
                result !== false &&
                resolve(dirname(file.path)) ===
                    resolve(documentationBuildFolderPath)
            )
                copiedTopLevelPaths.push(file.name)

            return result
        }
    )

    await rm(temporaryDocumentationFolderPath, {recursive: true})

    if (!checkRun('git config user.email', {}, runCommand))
        void log.debug(
            runCommand('git config user.email "github_actor@example.com"')
        )
    if (!checkRun('git config user.name', {}, runCommand))
        void log.debug(runCommand('git config user.name "github_actor"'))

    /*
        NOTE: Force adding build artifacts since a (stale) project specific
        ignore file (e.g. "*.js") would silently drop them otherwise.
    */
    if (copiedTopLevelPaths.length > 0)
        void log.debug(runCommand(
            'git add --all --force -- ' +
            copiedTopLevelPaths
                .sort()
                .map((path) => `'${path.replace(/'/g, `'\\''`)}'`)
                .join(' ')
        ))
    void log.debug(runCommand('git add --all'))
    void log.debug(runCommand(
        `git commit --message "${PROJECT_PAGE_COMMIT_MESSAGE}" --all`
    ))
    void log.debug(runCommand('git push'))
    void log.debug(runCommand('git checkout main'))
}
/**
 * Removes build files.
 * @param state - Collected deployment state.
 * @param runCommand - Function to execute shell commands with.
 * @returns A promise resolving to nothing when finished.
 */
export const tidyUp = async (
    state: DeploymentState, runCommand: typeof run = run
): Promise<void> => {
    for (const path of state.locationsToTidyUp)
        await rm(path, {recursive: true})

    const oldAPIDocumentationDirectoryPath =
        resolve(API_DOCUMENTATION_PATHS[1])
    if (
        state.hasAPIDocumentation &&
        !(await isDirectory(oldAPIDocumentationDirectoryPath))
    )
        try {
            runCommand(`git checkout '${oldAPIDocumentationDirectoryPath}'`)
        } catch (error) {
            void log.warn(error)
        }

    if (!runCommand('git branch').includes('* main'))
        void log.debug(runCommand('git checkout main'))
}
// endregion
