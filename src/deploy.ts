// #!/usr/bin/env babel-node
// -*- coding: utf-8 -*-
/** @module deploy */
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
import type {File} from 'clientnode'

import type {DeploymentState, PackageConfiguration} from './deployHelper'

import {
    importFilesystemAPI,
    isDirectory,
    optionalImport,
    walkDirectoryRecursively
} from 'clientnode'
import {rename, rm} from 'fs/promises'
import {resolve} from 'path'

import {
    API_DOCUMENTATION_PATH_SUFFIX_TEMPLATE,
    API_DOCUMENTATION_PATHS,
    copyRepositoryFile,
    createDistributionBundle,
    DATA_PATH,
    evaluatePathTemplate,
    generateAndPushNewDocumentationPage,
    hasAPIDocumentationScript,
    log,
    makeTemporaryFile,
    readReadmes,
    run,
    tidyUp
} from './deployHelper'
// endregion
export type {WebDocumentationConfiguration} from './deployHelper'

await importFilesystemAPI()
// region globals
const ALLOW_LOCAL_DOCUMENTATION_WEBSITE = true
const RUN_FINAL_BUILD = false
const DOCUMENTATION_WEBSITE_NAME = 'web-documentation'
const DOCUMENTATION_WEBSITE_REPOSITORY =
    // `git@github.com:thaibault/${DOCUMENTATION_WEBSITE_NAME}`
    `https://github.com/thaibault/${DOCUMENTATION_WEBSITE_NAME}.git`

const STATE: DeploymentState = {
    apiDocumentationPathSuffix: API_DOCUMENTATION_PATH_SUFFIX_TEMPLATE,
    content: '',
    hasAPIDocumentation: false,
    locationsToTidyUp: [],
    packageConfiguration: {name: '__dummy__', version: '1.0.0'}
}
// endregion
// region functions
/**
 * Main procedure.
 * @returns A promise resolving to nothing when finished.
 */
const main = async (): Promise<void> => {
    if (!run('git branch --all').includes('gh-pages')) {
        void log.debug(run('git fetch --all'))
        try {
            /*
                NOTE: The issue here that other configuration might
                automatically add a new line at the end of the package manifest
                file.
            */
            void log.debug(run('git checkout package.json'))
        } catch (_error) {
            // Do nothing regardless of an error.
        }
        void log.debug(run('git checkout gh-pages'))
    }

    if (!run('git branch').includes('* main'))
        void log.debug(run('git checkout main'))

    void log.debug(run('git pull'))

    if (
        run('git branch').includes('* main') &&
        run('git branch --all').includes('gh-pages')
    ) {
        STATE.packageConfiguration =
            (
                /*
                    eslint-disable
                    @typescript-eslint/no-unnecessary-type-assertion
                */
                await optionalImport(
                    resolve('./package.json'), {with: {type: 'json'}}
                ) as {default?: PackageConfiguration} | null
                /*
                    eslint-enable
                    @typescript-eslint/no-unnecessary-type-assertion
                */
            )?.default ||
            STATE.packageConfiguration

        STATE.apiDocumentationPathSuffix = evaluatePathTemplate(
            STATE.apiDocumentationPathSuffix, STATE.packageConfiguration
        )

        void log.info(
            'Read and Compile all markdown files and transform to html.'
        )

        STATE.content = await readReadmes('./')

        let distributionBundleFilePath: null | string = null
        try {
            distributionBundleFilePath =
                await createDistributionBundle(STATE.packageConfiguration)
        } catch (error) {
            void log.error(
                'Error occurred during building distribution bundle:', error
            )

            process.exitCode = 1
        }

        STATE.hasAPIDocumentation =
            hasAPIDocumentationScript(STATE.packageConfiguration)
        if (STATE.hasAPIDocumentation) {
            void log.info('API documentation creation script detected.')
            try {
                void log.debug(run('yarn document'))
                void log.info('API documentation created.')
            } catch (error) {
                void log.warn(error)
                STATE.hasAPIDocumentation = false
            }
        }

        void log.debug(run('git checkout gh-pages'))
        void log.debug(run('git pull'))

        const apiDocumentationDirectoryPath: string =
            resolve(API_DOCUMENTATION_PATHS[1])
        if (await isDirectory(apiDocumentationDirectoryPath))
            await rm(apiDocumentationDirectoryPath, {recursive: true})

        if (await isDirectory(API_DOCUMENTATION_PATHS[0])) {
            await rename(
                resolve(API_DOCUMENTATION_PATHS[0]),
                apiDocumentationDirectoryPath
            )

            STATE.locationsToTidyUp.push(apiDocumentationDirectoryPath)
        }

        let temporaryDocumentationFolderPath = await makeTemporaryFile({
            directory: true, prefix: DOCUMENTATION_WEBSITE_NAME
        })
        const localDocumentationWebsitePath: string =
            resolve(`../${DOCUMENTATION_WEBSITE_NAME}`)

        if (
            /* eslint-disable @typescript-eslint/no-unnecessary-condition */
            ALLOW_LOCAL_DOCUMENTATION_WEBSITE &&
            /* eslint-enable @typescript-eslint/no-unnecessary-condition */
            await isDirectory(localDocumentationWebsitePath)
        ) {
            void log.info(`Copy local existing ${DOCUMENTATION_WEBSITE_NAME}.`)

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
                void log.debug(run(`
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
            void log.info(
                `No local existing ${DOCUMENTATION_WEBSITE_NAME} found`,
                'getting it remotely.'
            )

            void log.debug(
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

        void log.debug(
            run('corepack enable', {cwd: temporaryDocumentationFolderPath})
        )

        void log.debug(
            run('corepack install', {cwd: temporaryDocumentationFolderPath})
        )

        try {
            void log.debug(run(
                'yarn install',
                {
                    cwd: temporaryDocumentationFolderPath,
                    env: {...process.env, NODE_ENV: 'debug'}
                }
            ))
        } catch (error) {
            void log.warn(error)
        }

        void log.debug(
            run('yarn clear', {cwd: temporaryDocumentationFolderPath})
        )

        await generateAndPushNewDocumentationPage(
            temporaryDocumentationFolderPath, distributionBundleFilePath, STATE
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
            /* eslint-disable @typescript-eslint/no-unnecessary-condition */
            RUN_FINAL_BUILD &&
            /* eslint-enable @typescript-eslint/no-unnecessary-condition */
            Boolean(STATE.packageConfiguration.scripts) &&
            Object.prototype.hasOwnProperty.call(
                STATE.packageConfiguration.scripts, 'build'
            )
        )
            // Prepare build artifacts for further local usage.
            void log.debug(run('yarn build'))
    }
}
// endregion

try {
    await main()
} catch (error) {
    await tidyUp(STATE)
    throw error
}
