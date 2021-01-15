/**
 * This file is part of the node-appstore-connect distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * node-appstore-connect is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * node-appstore-connect is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {TokenProvider} from "../client/token-provider";
import {BuildStatus} from "./build-status";
import {BuildClientInterface} from "./build-client.interface";
import got from "got";
import {API_HOST} from "../constants";
import {BuildProcessingState} from "./build-processing-state";
import {BuildProcessingError} from "./build-processing-error";
import {WaitForBuildProcessingOptions} from "./wait-for-build-processing-options";
import {PlatformType} from "../client";
import {BuildUpdateOptions} from "./build-update-options";
import {BuildInterface} from "./build.interface";

export class BuildClient implements BuildClientInterface {

    /**
     * @param {TokenProvider} tokenProvider
     */
    constructor(private readonly tokenProvider: TokenProvider) {
    }

    /**
     * Gets the build Id for a build
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildNumber
     */
    public async getBuildId(appId: number, version: string, platform: PlatformType, buildNumber?: number): Promise<string> {

        const response = await got.get(`${API_HOST}/v1/builds`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'buffer',
            'searchParams':    {
                'fields[builds]':                     '',
                'filter[app]':                        appId,
                'filter[version]':                    buildNumber,
                'filter[preReleaseVersion.version]':  version,
                'filter[preReleaseVersion.platform]': platform.toUpperCase(),
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            throw new Error(`Error fetching build for app ${appId} with build number (version): ${buildNumber}, version: ${version}, platform: ${platform}. Status code: ${response.statusCode}`)
        }
        const json = JSON.parse(response.body.toString());
        const data = json.data;

        if (data.length > 1) {
            throw new Error(`Received too many results for app ${appId} with build number (version): ${buildNumber}, version: ${version}, platform: ${platform}`);
        }
        if (data.length === 0) {
            throw new Error(`Build not found for app ${appId} with build number (version): ${buildNumber}, version: ${version}, platform: ${platform}`)
        }

        return data[0].id;
    }

    /**
     * Gets status for a build
     *
     * @param {string} buildId
     *
     * @return {Promise<BuildStatus>}
     */
    public async getBuildStatusFromBuildId(buildId: string): Promise<BuildStatus> {
        const response = await got.get(`${API_HOST}/v1/builds`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'buffer',
            'searchParams':    {
                'fields[builds]': 'processingState',
                'filter[id]':     buildId,
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            throw new Error(`Error fetching build for build id: ${buildId}. Status code: ${response.statusCode}`)
        }
        const json = JSON.parse(response.body.toString());
        const data = json.data;

        if (data.length > 1) {
            throw new Error(`Received too many results for build id: ${buildId}`);
        }
        if (data.length === 0) {
            throw new Error(`Build not found for build id: ${buildId}`)
        }

        const build = data[0];

        return {
            processingState: build.attributes.processingState
        }
    }

    /**
     * Get's the build status for a build
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildNumber
     */
    public async getBuildStatus(appId: number, version: string, platform: PlatformType, buildNumber?: number): Promise<BuildStatus> {

        const response = await got.get(`${API_HOST}/v1/builds`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'buffer',
            'searchParams':    {
                'fields[builds]':                     'processingState',
                'filter[app]':                        appId,
                'filter[version]':                    buildNumber,
                'filter[preReleaseVersion.version]':  version,
                'filter[preReleaseVersion.platform]': platform.toUpperCase(),
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            throw new Error(`Error fetching build for app ${appId} with build number (version): ${buildNumber}, version: ${version}, platform: ${platform}. Status code: ${response.statusCode}`)
        }
        const json = JSON.parse(response.body.toString());
        const data = json.data;

        if (data.length > 1) {
            throw new Error(`Received too many results for app ${appId} with build number (version): ${buildNumber}, version: ${version}, platform: ${platform}`);
        }
        if (data.length === 0) {
            return {
                processingState: BuildProcessingState.UNKNOWN
            }
        }

        const build = data[0];

        return {
            processingState: build.attributes.processingState
        }
    }

    /**
     * Waits for build processing to complete. Throws error if build is invalid. Waits indefinitely if build does not exist.
     *
     * @param {number} appId
     * @param {PlatformType} platform
     * @param {string} version
     * @param {number} buildNumber
     * @param {WaitForBuildProcessingOptions} options
     * @throws {BuildProcessingError}
     *
     * @return {Promise<void>}
     */
    public waitForBuildProcessingToComplete(appId: number, platform: PlatformType, version: string, buildNumber: number, options?: WaitForBuildProcessingOptions): Promise<void> {

        const opt                                       = options || {};
        const useOptions: WaitForBuildProcessingOptions = {
            pollIntervalInSeconds: 60,
            maxTries:              60,
            initialDelayInSeconds: 0,
            onPollCallback:        () => {
            },
            ...opt
        }
        return new Promise<void>(async (resolve, reject) => {
            const status                             = await this.getBuildStatus(appId, version, platform, buildNumber);
            const waitStates: BuildProcessingState[] = [BuildProcessingState.UNKNOWN, BuildProcessingState.PROCESSING];
            const failStates: BuildProcessingState[] = [BuildProcessingState.FAILED, BuildProcessingState.INVALID];
            if (waitStates.includes(status.processingState)) {
                let tries = 0;
                useOptions.onPollCallback(status.processingState, tries);

                await new Promise((resolve) => {
                    setTimeout(resolve, useOptions.initialDelayInSeconds * 1000);
                });

                const intervalId = setInterval(async () => {

                    const status = await this.getBuildStatus(appId, version, platform, buildNumber);
                    useOptions.onPollCallback(status.processingState, tries);

                    if (failStates.includes(status.processingState)) {
                        clearInterval(intervalId);
                        reject(new BuildProcessingError(status.processingState));
                    }

                    if (status.processingState === BuildProcessingState.VALID) {
                        clearInterval(intervalId);
                        resolve();
                    }
                    tries++;
                    if (tries >= useOptions.maxTries) {
                        clearInterval(intervalId);
                        reject(new BuildProcessingError(BuildProcessingState.UNKNOWN, `Timed out waiting for processing to complete`));
                    }

                }, 1000 * useOptions.pollIntervalInSeconds)
            } else {
                if (failStates.includes(status.processingState)) {
                    reject(new BuildProcessingError(status.processingState));
                } else {
                    resolve();
                }
            }
        })
    }

    /**
     * Updates a build
     *
     * @param {string} buildId
     * @param {BuildUpdateOptions} options
     */
    public async updateBuild(buildId: string, options: BuildUpdateOptions): Promise<void> {
        const response = await got.patch(`${API_HOST}/v1/builds/${buildId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'throwHttpErrors': false,
            json:              {
                data: {
                    id:         buildId,
                    attributes: options,
                    type:       'builds'
                }
            }
        });

        if (response.statusCode >= 400) {
            throw new Error(`Error updating with id ${buildId}. Status code: ${response.statusCode}`)
        }
    }

    /**
     * Gets a build
     *
     * @param {string} buildId
     *
     * @returns {Promise<BuildInterface>}
     */
    public async getBuild(buildId: string): Promise<BuildInterface> {
        const response = await got.get(`${API_HOST}/v1/builds/${buildId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            throw new Error(`Error updating with id ${buildId}. Status code: ${response.statusCode}`)
        }

        const json       = response.body as any;
        const data       = json.data;

        // noinspection UnnecessaryLocalVariableJS
        const attributes: BuildInterface = {
            ...data.attributes,
            uploadedDate:   new Date(data.attributes.uploadedDate),
            expirationDate: new Date(data.attributes.expirationDate)
        };

        return attributes;
    }
}