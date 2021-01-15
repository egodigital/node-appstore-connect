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

import {DownloadSalesReportSummaryOptions, GetAppDownloadsOptions, GetAppDownloadsResult, SalesReportRow} from "../sales";
import {SalesClient} from "../sales/sales-client";
import {TokenProvider} from "./token-provider";
import {ClientOptions} from "./client-options";
import {BuildClient} from "../build/build-client";
import {ReleaseClient} from "../release/release-client";
import {TestflightClient} from "../testflight/testflight-client";
import {BuildClientInterface} from "../build/build-client.interface";
import {
    CreateVersionOptions,
    EnsureVersionOptions,
    LocalizationInterface,
    ReviewDetailsInterface,
    SubmitForReviewOptions
} from "../release";
import {BuildInterface, BuildUpdateOptions, WaitForBuildProcessingOptions} from "../build";
import {ReleaseClientInterface} from "../release/release-client.interface";
import {TestflightAddBuildToExternalGroupOptions, TestflightCreateGroupOptions, TestflightNotifyBetaTestersOptions} from "../testflight";
import {TestflightClientInterface} from "../testflight/testflight-client.interface";
import {VersionUpdateOptions} from "../release";
import {PlatformType} from "./platform-type";

/**
 * A client for the App Store Connect API.
 */
export class Client implements BuildClientInterface, ReleaseClientInterface, TestflightClientInterface {

    /**
     * Creates an instance of a client to make requests to app store connect API
     *
     * @param {ClientOptions} clientOptions
     */
    public static create(clientOptions: ClientOptions) {
        const tokenProvider    = new TokenProvider(clientOptions);
        const salesClient      = new SalesClient(tokenProvider);
        const buildClient      = new BuildClient(tokenProvider);
        const releaseClient    = new ReleaseClient(tokenProvider);
        const testflightClient = new TestflightClient(tokenProvider, buildClient);
        return new Client(salesClient, buildClient, releaseClient, testflightClient);
    }

    public constructor(
        private readonly salesClient: SalesClient,
        private readonly buildClient: BuildClient,
        private readonly releaseClient: ReleaseClient,
        private readonly testflightClient: TestflightClient
    ) {
    }

    /**
     * Downloads a summary of a sales report.
     *
     * @param {DownloadSalesReportSummaryOptions} opts The options.
     *
     * @return {Promise<SalesReportRow[]>} The promise with the rows.
     */
    public async downloadSalesReportSummary(opts: DownloadSalesReportSummaryOptions): Promise<SalesReportRow[]> {
        return this.salesClient.downloadSalesReportSummary(opts);
    }

    /**
     * Returns a summary of app downloads.
     *
     * @param {GetAppDownloadsOptions} opts The options.
     *
     * @return {Promise<GetAppDownloadsResult>} The promise with the result.
     */
    public getAppDownloads(opts: GetAppDownloadsOptions): Promise<GetAppDownloadsResult> {
        return this.salesClient.getAppDownloads(opts);
    }

    /**
     * Attaches a build to a version for release
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildId
     */
    public attachBuildIdToVersion(appId: number, version: string, platform: PlatformType, buildId: string): Promise<void> {
        return this.releaseClient.attachBuildIdToVersion(appId, version, platform, buildId);
    }

    /**
     * Attaches a build to a version for release by version Id
     *
     * @param {string} versionId
     * @param {string} buildId
     */
    public attachBuildIdToVersionByVersionId(versionId: string, buildId: string): Promise<void> {
        return this.releaseClient.attachBuildIdToVersionByVersionId(versionId, buildId);
    }

    /**
     * Creates a version for release if it does not already exist
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {EnsureVersionOptions} options
     *
     * @return {Promise<void>}
     */
    public ensureVersionExists(appId: number, version: string, platform: PlatformType, options: EnsureVersionOptions): Promise<void> {
        return this.releaseClient.ensureVersionExists(appId, version, platform, options);
    }

    /**
     * Creates a new version for sale
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {CreateVersionOptions?} options
     *
     * @return {Promise<void>}
     */
    public createVersion(appId: number, version: string, platform: PlatformType, options?: CreateVersionOptions): Promise<void> {
        return this.releaseClient.createVersion(appId, version, platform, options);
    }

    /**
     * Submits app for review
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {SubmitForReviewOptions?} options
     */
    public submitForReview(appId: number, version: string, platform: PlatformType, options?: SubmitForReviewOptions): Promise<void> {
        return this.releaseClient.submitForReview(appId, version, platform, options);
    }

    /**
     * Submits app for review
     *
     * @param {string} versionId
     * @param {SubmitForReviewOptions?} options
     */
    public submitForReviewByVersionId(versionId: string, options?: SubmitForReviewOptions): Promise<void> {
        return this.releaseClient.submitForReviewByVersionId(versionId, options);
    }

    /**
     * Gets the app store version id for a version string
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     */
    public getVersionId(appId: number, version: string, platform: PlatformType): Promise<string> {
        return this.releaseClient.getVersionId(appId, version, platform);
    }

    /**
     * Gets the build Id for a build
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildNumber
     */
    public getBuildId(appId: number, version: string, platform: PlatformType, buildNumber?: number): Promise<string> {
        return this.buildClient.getBuildId(appId, version, platform, buildNumber);
    }

    /**
     * Get's the build status for a build
     *
     * @param {string} buildId
     */
    public async getBuildStatusFromBuildId(buildId: string) {
        return this.buildClient.getBuildStatusFromBuildId(buildId);
    }

    /**
     * Get's the build status for a build
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildNumber
     */
    public getBuildStatus(appId: number, version: string, platform: PlatformType, buildNumber?: number) {
        return this.buildClient.getBuildStatus(appId, version, platform, buildNumber);
    }

    /**
     * Waits for build processing to complete. Throws error if build is invalid. Waits indefinitely if build does not exist.
     *
     * @param {number} appId
     * @param {PlatformType} platform
     * @param {string} version
     * @param {number} buildNumber
     * @param {WaitForBuildProcessingOptions} options
     *
     * @throws {BuildProcessingError}
     *
     * @return {Promise<void>}
     */
    public waitForBuildProcessingToComplete(appId: number, platform: PlatformType, version: string, buildNumber: number, options?: WaitForBuildProcessingOptions): Promise<void> {
        return this.buildClient.waitForBuildProcessingToComplete(appId, platform, version, buildNumber, options);
    }

    /**
     * Adds build to external test flight user group. App must be already approved for beta testing perform this function.
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {number} buildNumber
     * @param {string} groupId
     * @param {TestflightAddBuildToExternalGroupOptions?} options
     */
    public addBuildToExternalGroupByGroupId(appId: number, version: string, platform: PlatformType, buildNumber: number, groupId: string, options?: TestflightAddBuildToExternalGroupOptions): Promise<void> {
        return this.testflightClient.addBuildToExternalGroupByGroupId(appId, version, platform, buildNumber, groupId, options);
    }

    /**
     * Adds build to external test flight user group. App must be already approved for beta testing perform this function.
     *
     * @param {string} buildId
     * @param {string} groupId
     * @param {TestflightAddBuildToExternalGroupOptions?} options
     */
    public addBuildToExternalGroupByGroupIdAndBuildId(buildId: string, groupId: string, options?: TestflightAddBuildToExternalGroupOptions): Promise<void> {
        return this.testflightClient.addBuildToExternalGroupByGroupIdAndBuildId(buildId, groupId, options);
    }

    /**
     * Adds build to group by group name
     *
     * @param {number} appId
     * @param {string} buildId
     * @param {string} groupName
     * @param {TestflightAddBuildToExternalGroupOptions?} options
     */
    public addBuildToExternalGroupByBuildId(appId: number, buildId: string, groupName: string, options?: TestflightAddBuildToExternalGroupOptions): Promise<void> {
        return this.testflightClient.addBuildToExternalGroupByBuildId(appId, buildId, groupName, options);
    }

    /**
     * Notifies beta testers there is a new build
     *
     * @param {string} buildId
     * @param {TestflightNotifyBetaTestersOptions?} options
     */
    public notifyBetaTestersOfNewBuildByBuildId(buildId: string, options?: TestflightNotifyBetaTestersOptions): Promise<void> {
        return this.testflightClient.notifyBetaTestersOfNewBuildByBuildId(buildId, options);
    }

    /**
     * Creates or updates localizations by version id
     *
     * @param {string} versionId
     * @param {LocalizationInterface[]} localizations
     */
    public setVersionLocalizationsByVersionId(versionId: string, localizations: LocalizationInterface[]): Promise<void> {
        return this.releaseClient.setVersionLocalizationsByVersionId(versionId, localizations);
    }

    /**
     * Sets version review details
     *
     * @param {string} versionId
     * @param {ReviewDetailsInterface?} reviewDetails
     */
    public setVersionReviewDetailAttributesByVersionId(versionId: string, reviewDetails: ReviewDetailsInterface): Promise<void> {
        return this.releaseClient.setVersionReviewDetailAttributesByVersionId(versionId, reviewDetails);
    }

    /**
     * Updates a version
     *
     * @param {string} versionId
     * @param {VersionUpdateOptions} attributes
     */
    public updateVersionByVersionId(versionId: string, attributes: VersionUpdateOptions): Promise<void> {
        return this.releaseClient.updateVersionByVersionId(versionId, attributes)
    }

    /**
     * Creates an external beta testing group
     *
     * @param {number} appId
     * @param {string} groupName
     * @param {TestflightCreateGroupOptions?} options
     *
     * @returns Promise<string> A promise with the group id
     */
    public createExternalBetaTestersGroup(appId: number, groupName: string, options?: TestflightCreateGroupOptions): Promise<string> {
        return this.testflightClient.createExternalBetaTestersGroup(appId, groupName, options);
    }

    /**
     * Gets an external beta testing group ID by app ID and group name
     *
     * @param {number} appId
     * @param {string} groupName
     *
     * @returns Promise<string> A promise with the group id
     */
    public getExternalBetaTestersGroupId(appId: number, groupName: string): Promise<string> {
        return this.testflightClient.getExternalBetaTestersGroupId(appId, groupName);
    }

    /**
     * Updates a build
     *
     * @param {string} buildId
     * @param {BuildUpdateOptions} options
     */
    public updateBuild(buildId: string, options: BuildUpdateOptions): Promise<void> {
        return this.buildClient.updateBuild(buildId, options);
    }

    /**
     * Gets a build
     *
     * @param {string} buildId
     *
     * @returns {Promise<BuildInterface>}
     */
    public getBuild(buildId: string): Promise<BuildInterface> {
        return this.buildClient.getBuild(buildId);
    }

}