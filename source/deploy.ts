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
import archiver from 'archiver'
import {execSync} from 'child_process'
import {
    camelCaseToDelimited,
    evaluate,
    evaluateDynamicData,
    EvaluationResult,
    File,
    isDirectory,
    isFile,
    Mapping,
    optionalRequire,
    PositiveEvaluationResult,
    PlainObject,
    represent,
    walkDirectoryRecursively
} from 'clientnode'
import {createReadStream, createWriteStream} from 'fs'
import {
    copyFile, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile
} from 'fs/promises'
import {tmpdir} from 'node:os'
import {basename, dirname, extname, join, relative, resolve} from 'path'
import {Stream} from 'stream'
import {Extract} from 'unzipper'
// endregion
// region types
interface MAKE_TEMPORARY_FILE_OPTIONS {
    directory: boolean
    encoding?: BufferEncoding | null
    extension: string
    prefix: string
}
interface SCOPE_TYPE extends Mapping<unknown> {
    description?: string
    documentationWebsite?: PlainObject
    files?: Array<string>
    main?: string
    name: string
    scripts?: Mapping
    version: string
}
// endregion
// region globals
/// region locations
const DOCUMENTATION_BUILD_PATH = resolve('./build/')
const DATA_PATH = resolve('./data/')
const API_DOCUMENTATION_PATHS = ['apiDocumentation/', 'api/']
let API_DOCUMENTATION_PATH_SUFFIX = '${name}/${version}/'
const DISTRIBUTION_BUNDLE_FILE_PATH = join(DATA_PATH, 'distributionBundle.zip')
const DISTRIBUTION_BUNDLE_DIRECTORY_PATH =
    join(DATA_PATH, 'distributionBundle')
/// endregion
const ALLOW_LOCAL_DOCUMENTATION_WEBSITE = false
const BUILD_DOCUMENTATION_PAGE_COMMAND_TEMPLATE =
    '`yarn build:web \'{__reference__: "${parametersFilePath}"}\'`'
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
const DOCUMENTATION_WEBSITE_NAME = 'documentation-website'
const DOCUMENTATION_WEBSITE_REPOSITORY =
    `git@github.com:thaibault/${DOCUMENTATION_WEBSITE_NAME}`
const PROJECT_PAGE_COMMIT_MESSAGE = 'Update project homepage content.'
let SCOPE: SCOPE_TYPE = {name: '__dummy__', version: '1.0.0'}
// endregion
// region functions
/**
 * Creates temporary directories or provides temporary not yet used file
 * locations.
 * @param givenOptions - Defines options to influence the file path creation.
 * @returns Determined file path.
 */
const makeTemporaryFile = async (
    givenOptions: Partial<MAKE_TEMPORARY_FILE_OPTIONS> = {}
): Promise<string> => {
    const options: MAKE_TEMPORARY_FILE_OPTIONS = {
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
const run = (command: string, options = {}): string =>
    execSync(command, {encoding: 'utf-8', shell: '/bin/bash', ...options})

/**
 * Converts a given stream into a buffer.
 * @param stream - To Convert.
 * @returns Converted buffer.
 */
const stream2buffer = async (stream: Stream): Promise<Buffer> => {
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
 * Renders a new index.html file and copies new assets to generate a new
 * documentation homepage.
 * @param temporaryDocumentationFolderPath - Location where to build
 * documentation build.
 * @param distributionBundleFilePath - Location where to save the exported
 * build artefacts.
 * @param hasAPIDocumentationCommand - Indicates whether there already exists
 * a ready to use api documentation.
 * @returns A promise resolving when build process has finished.
 */
const generateAndPushNewDocumentationPage = async (
    temporaryDocumentationFolderPath: string,
    distributionBundleFilePath: null | string,
    hasAPIDocumentationCommand: boolean
): Promise<void> => {
    console.info('Generate document website artefacts.')

    if (distributionBundleFilePath) {
        console.info('Prepare distribution files.')

        const newDistributionBundleFilePath = join(
            temporaryDocumentationFolderPath,
            relative('./', DOCUMENTATION_BUILD_PATH),
            relative('./', DISTRIBUTION_BUNDLE_FILE_PATH)
        )

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

    console.info('Prepare favicon file.')
    const faviconPath = 'favicon.png'
    if (await isFile(faviconPath))
        await copyFile(
            faviconPath,
            `${temporaryDocumentationFolderPath}/source/image/favicon.ico`
        )

    console.info('Render html.')

    let parameters: Mapping<unknown> = {}
    for (const [key, value] of Object.entries(
        SCOPE.documentationWebsite || {}
    ))
        parameters[camelCaseToDelimited(key).toUpperCase()] = value
    if (!parameters.TAGLINE && SCOPE.description)
        parameters.TAGLINE = SCOPE.description
    if (!parameters.NAME && SCOPE.name)
        parameters.NAME = SCOPE.name

    console.debug(`Found parameters "${represent(parameters)}" to render.`)

    let apiDocumentationPath: null | string = null
    if (hasAPIDocumentationCommand) {
        apiDocumentationPath =
            API_DOCUMENTATION_PATHS[1] + API_DOCUMENTATION_PATH_SUFFIX
        if (!(await isDirectory(apiDocumentationPath)))
            apiDocumentationPath = API_DOCUMENTATION_PATHS[1]
    }

    parameters = {
        ...parameters,
        CONTENT,
        API_DOCUMENTATION_PATH: apiDocumentationPath,
        DISTRIBUTION_BUNDLE_FILE_PATH:
            await isFile(DISTRIBUTION_BUNDLE_FILE_PATH) ?
                relative('./', DISTRIBUTION_BUNDLE_FILE_PATH) :
                null
    }

    for (const [key, value] of Object.entries(parameters))
        if (typeof value === 'string')
            parameters[key] = value.replace('!', '#%%%#')

    const serializedParameters: string =
        JSON.stringify(evaluateDynamicData(
            BUILD_DOCUMENTATION_PAGE_CONFIGURATION, {parameters, ...SCOPE}
        ))
    const parametersFilePath: string =
        await makeTemporaryFile({extension: '.json'})
    await writeFile(parametersFilePath, serializedParameters)

    const evaluationResult: EvaluationResult = evaluate(
        BUILD_DOCUMENTATION_PAGE_COMMAND_TEMPLATE,
        {parameters, parametersFilePath, ...SCOPE}
    )

    if (evaluationResult.error)
        throw new Error(evaluationResult.error)

    const buildDocumentationPageCommand =
        (evaluationResult as PositiveEvaluationResult).result

    console.debug(`Use final parameters "${serializedParameters}".`)
    console.info(`Run "${buildDocumentationPageCommand}".`)

    console.debug(
        run(
            buildDocumentationPageCommand,
            {cwd: temporaryDocumentationFolderPath}
        )
    )
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

    console.info('Copy all build artefacts.')

    const documentationBuildFolderPath = join(
        temporaryDocumentationFolderPath,
        relative('./', DOCUMENTATION_BUILD_PATH)
    )
    await walkDirectoryRecursively(
        documentationBuildFolderPath,
        (file: File): Promise<false | undefined> =>
            copyRepositoryFile(documentationBuildFolderPath, './', file)
    )

    await rm(temporaryDocumentationFolderPath, {recursive: true})

    console.debug(run('git add --all'))
    console.debug(
        run(`git commit --message "${PROJECT_PAGE_COMMIT_MESSAGE}" --all`)
    )
    console.debug(run('git push'))
    console.debug(run('git checkout main'))
}
/**
 * Creates a distribution bundle file as zip archiv.
 * @returns Path to build distribution bundle or "null" of building failed.
 */
const createDistributionBundle = async (): Promise<null | string> => {
    if (
        SCOPE.scripts &&
        (
            SCOPE.scripts['build:bundle:compatible'] ||
            SCOPE.scripts['build:bundle'] ||
            SCOPE.scripts.build
        )
    ) {
        const buildCommand =
            'yarn ' +
            (
                SCOPE.scripts['build:bundle:compatible'] ?
                    'build:bundle:compatible' :
                    SCOPE.scripts['build:bundle'] ?
                        'build:bundle' :
                        'build'
            )
        console.info(`Build distribution bundle via "${buildCommand}".`)
        console.debug(run(buildCommand))
    }

    console.info('Pack to a zip archive.')
    const distributionBundleFilePath: string =
        await makeTemporaryFile({extension: '.zip'})

    const filePaths = SCOPE.files || []
    if (SCOPE.main)
        filePaths.push(SCOPE.main)

    if (filePaths.length === 0)
        return null

    const determineFilePaths = async (
        filePaths: Array<string>
    ): Promise<Array<string>> => {
        let result: Array<string> = []

        for (let filePath of filePaths) {
            filePath = resolve(filePath)

            if (!(await isFileIgnored(filePath)))
                if (await isDirectory(filePath))
                    result = result.concat(await determineFilePaths(
                        (await readdir(filePath)).map((path: string): string =>
                            resolve(filePath, path)
                        )
                    ))
                else {
                    console.debug(`Add "${filePath}" to distribution bundle.`)

                    result.push(filePath)
                }
        }

        return result
    }

    const archive = archiver('zip', {zlib: {level: 9}})
    archive.pipe(createWriteStream(distributionBundleFilePath))

    const promise = new Promise<void>((
        resolve: () => void, reject: (reason: Error) => void
    ): void => {
        archive.on('error', (error: Error): void => {
            reject(error)
        })

        archive.on('warning', (error: Error): void => {
            console.warn(error)
        })

        archive.on('progress', ({entries: {total, processed}}): void => {
            if (total === processed)
                resolve()
        })
    })

    for (const filePath of await determineFilePaths(filePaths))
        archive.append(
            await stream2buffer(createReadStream(filePath)),
            {name: relative('./', filePath)}
        )

    await archive.finalize()

    await promise

    return distributionBundleFilePath
}
/**
 * Checks if given file path points to a file which should not be distributed
 * for generic reasons.
 * @param filePath - File path to check.
 * @returns Promise wrapping indicating boolean.
 */
const isFileIgnored = async (filePath: string): Promise<boolean> => (
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
const copyRepositoryFile = async (
    sourcePath: string, targetPath: string, file: File
): Promise<false | undefined> => {
    if (await isFileIgnored(file.path) || basename(file.name) === 'readme.md')
        return false

    targetPath = join(targetPath, relative(sourcePath, file.path))

    console.debug(`Copy "${file.path}" to "${targetPath}".`)

    if (file.stats?.isFile())
        await copyFile(file.path, targetPath)
    else
        await mkdir(targetPath)
}

/**
 * Merges all readme file.
 * @param file - File to check if it is a readme and should be added to the
 * output content.
 * @returns False or "null" indicating whether the readme file should be
 * ignored.
 */
const addReadme = async (file: File): Promise<false | undefined> => {
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

if (!run('git branch --all').includes('gh-pages')) {
    console.debug(run('git fetch --all'))
    try {
        /*
            NOTE: The issue here that other configuration might automatically
            add a new line at the end of the package manifest file.
        */
        console.debug(run('git checkout package.json'))
    } catch (_error) {
        // Do nothing regardless of an error.
    }
    console.debug(run('git checkout gh-pages'))
}

if (!run('git branch').includes('* main'))
    console.debug(run('git checkout main'))

if (
    run('git branch').includes('* main') &&
    run('git branch --all').includes('gh-pages')
) {
    SCOPE = optionalRequire(resolve('./package.json')) || SCOPE

    const evaluationResult: EvaluationResult = evaluate(
        `\`${API_DOCUMENTATION_PATH_SUFFIX}\``, SCOPE
    )

    if (evaluationResult.error)
        throw new Error(evaluationResult.error)

    API_DOCUMENTATION_PATH_SUFFIX =
        (evaluationResult as PositiveEvaluationResult).result

    console.info('Read and Compile all markdown files and transform to html.')

    await walkDirectoryRecursively('./', addReadme)

    let distributionBundleFilePath: null | string = null
    try {
        distributionBundleFilePath = await createDistributionBundle()
    } catch (error) {
        console.error(
            'Error occurred during building distribution bundle:', error
        )

        process.exitCode = 1
    }

    if (
        distributionBundleFilePath && await isFile(distributionBundleFilePath)
    ) {
        await mkdir(DATA_PATH, {recursive: true})
        await copyFile(
            distributionBundleFilePath,
            join(DATA_PATH, basename(distributionBundleFilePath))
        )
    }

    let hasAPIDocumentationCommand: boolean =
        Boolean(SCOPE.scripts) &&
        Object.prototype.hasOwnProperty.call(SCOPE.scripts, 'document')
    if (hasAPIDocumentationCommand)
        try {
            console.debug(run('yarn document'))
        } catch {
            hasAPIDocumentationCommand = false
        }

    console.debug(run('git checkout gh-pages'))

    const apiDocumentationDirectoryPath: string =
        resolve(API_DOCUMENTATION_PATHS[1])
    if (await isDirectory(apiDocumentationDirectoryPath))
        await rm(apiDocumentationDirectoryPath, {recursive: true})

    if (await isDirectory(API_DOCUMENTATION_PATHS[0]))
        await rename(
            resolve(API_DOCUMENTATION_PATHS[0]),
            apiDocumentationDirectoryPath
        )

    let temporaryDocumentationFolderPath = await makeTemporaryFile({
        directory: true, prefix: DOCUMENTATION_WEBSITE_NAME
    })
    const localDocumentationWebsitePath: string =
        resolve(`../${DOCUMENTATION_WEBSITE_NAME}`)

    if (
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        ALLOW_LOCAL_DOCUMENTATION_WEBSITE &&
        await isDirectory(localDocumentationWebsitePath)
    ) {
        console.info(`Copy local existing ${DOCUMENTATION_WEBSITE_NAME}.`)

        await walkDirectoryRecursively(
            localDocumentationWebsitePath,
            (file: File): Promise<false | undefined> =>
                copyRepositoryFile(
                    localDocumentationWebsitePath,
                    temporaryDocumentationFolderPath,
                    file
                )
        )

        /*

        const nodeModulesDirectoryPath: string =
            resolve(localDocumentationWebsitePath, 'node_modules')
        if (await isDirectory(nodeModulesDirectoryPath)) {
            // NOTE: Not working caused by nested symlinks.
            const temporaryDocumentationNodeModulesDirectoryPath: string =
                resolve(temporaryDocumentationFolderPath, 'node_modules')
            /*
                We copy just recursively reference files.

                NOTE: Symlinks doesn't work since some node modules need the
                right absolute location to work.

                NOTE: Coping complete "node_modules" folder takes to long.

                NOTE: Mounting "node_modules" folder needs root privileges.
            * /
            console.debug(run(`
                cp \
                    --dereference \
                    --recursive \
                    --reflink=auto \
                    '${nodeModulesDirectoryPath}' \
                    '${temporaryDocumentationNodeModulesDirectoryPath}'
            `))
        } else

        */
    } else {
        console.info(
            `No local existing ${DOCUMENTATION_WEBSITE_NAME} found getting it`,
            'remotely.'
        )

        console.debug(
            run(
                'unset GIT_WORK_TREE; git clone ' +
                `'${DOCUMENTATION_WEBSITE_REPOSITORY}'`,
                {cwd: temporaryDocumentationFolderPath}
            )
        )

        temporaryDocumentationFolderPath = resolve(
            temporaryDocumentationFolderPath, DOCUMENTATION_WEBSITE_NAME
        )
    }

    console.debug(
        run('corepack enable', {cwd: temporaryDocumentationFolderPath})
    )

    console.debug(
        run('corepack install', {cwd: temporaryDocumentationFolderPath})
    )
    console.debug(run(
        'yarn install',
        {
            cwd: temporaryDocumentationFolderPath,
            env: {...process.env, NODE_ENV: 'debug'}
        }
    ))
    console.debug(run('yarn clear', {cwd: temporaryDocumentationFolderPath}))

    await generateAndPushNewDocumentationPage(
        temporaryDocumentationFolderPath,
        distributionBundleFilePath,
        hasAPIDocumentationCommand
    )

    // region tidy up
    for (const path of [
        apiDocumentationDirectoryPath,
        DATA_PATH,
        temporaryDocumentationFolderPath
    ])
        if (await isDirectory(path))
            await rm(path, {recursive: true})
    // endregion

    if (
        Boolean(SCOPE.scripts) &&
        Object.prototype.hasOwnProperty.call(SCOPE.scripts, 'build')
    )
        // Prepare build artefacts for further local usage.
        console.debug(run('yarn build'))
}
