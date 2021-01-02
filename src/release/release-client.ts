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
import {SubmitForReviewOptions} from "./submit-for-review-options";
import {ApiError, PlatformType} from "../client";
import {ReleaseClientInterface} from "./release-client.interface";
import got from "got";
import {API_HOST} from "../constants";
import {CreateVersionOptions} from "./create-version-options";
import {EnsureVersionOptions} from "./ensure-version-options";
import {LocalizationInterface} from "./localization.interface";
import {LocalizationAttributesInterface} from "./localization-attributes.interface";
import {ReleaseNotesInterface} from "./release-notes.interface";
import {ReviewDetailsInterface} from "./review-details.interface";
import {VersionUpdateOptions} from "./version-update-options";

export class ReleaseClient implements ReleaseClientInterface {

    /**
     * @param {TokenProvider} tokenProvider
     */
    constructor(private readonly tokenProvider: TokenProvider) {
    }

    /**
     * Creates a version for release if it does not already exist
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {EnsureVersionOptions?} options
     *
     * @return {Promise<void>}
     */
    public async ensureVersionExists(appId: number, version: string, platform: PlatformType, options?: EnsureVersionOptions): Promise<void> {

        const opts                             = options || {};
        const useOptions: EnsureVersionOptions = {
            updateVersionStringIfUnreleasedVersionExists: false,
            ...opts
        }

        const response = await got.get(`${API_HOST}/v1/apps/${appId}/appStoreVersions`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'searchParams':    {
                'fields[apps]':          '',
                'filter[versionString]': version,
                'filter[platform]':      platform,
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error fetching version for app ${appId} with version: ${version}, platform: ${platform}. Status code: ${response.statusCode}. Errors: ${errors}`)
        }
        const data = (response.body as any).data;

        if (data.length > 1) {
            throw new Error(`Received too many results for app ${appId}, version: ${version}, platform: ${platform}`);
        }
        if (data.length === 0) {
            try {
                await this.createVersion(appId, version, platform, useOptions.createOptions);
            } catch (e) {
                const error: ApiError = e;
                if (error.statusCode === 409 && useOptions.updateVersionStringIfUnreleasedVersionExists) {
                    await this._updateVersionCode(appId, version, platform)
                } else {
                    throw e;
                }
            }
        }
    }

    private async _updateVersionReleaseType(versionId: string, autoRelease: boolean): Promise<void>{
        const patchResponse = await got.patch(`${API_HOST}/v1/appStoreVersions/${versionId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'json':            {
                "data": {
                    "id":         versionId,
                    "type":       "appStoreVersions",
                    "attributes": {
                        "releaseType": autoRelease ? "AFTER_APPROVAL" : "MANUAL"
                    },
                }
            },
            'throwHttpErrors': false,
        });

        if (patchResponse.statusCode >= 400) {
            const errors = (patchResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error when trying to update release type for versionId: ${versionId}. Status code: ${patchResponse.statusCode}. Errors: ${errors}`)
        }
    }

    private async _updateVersionCode(appId: number, version: string, platform: PlatformType) {

        const statusesThatCanBeUpdated = [
            "DEVELOPER_REMOVED_FROM_SALE",
            "DEVELOPER_REJECTED",
            "INVALID_BINARY",
            "METADATA_REJECTED",
            "PENDING_CONTRACT",
            "PENDING_DEVELOPER_RELEASE",
            "PREPARE_FOR_SUBMISSION",
            "REJECTED",
            "REMOVED_FROM_SALE",
            "WAITING_FOR_EXPORT_COMPLIANCE"
        ]

        const getResponse = await got.get(`${API_HOST}/v1/apps/${appId}/appStoreVersions`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'searchParams':    {
                'fields[apps]':          '',
                'filter[platform]':      platform,
                'filter[appStoreState]': statusesThatCanBeUpdated.join(','),
            },
            'throwHttpErrors': false,
        });

        if (getResponse.statusCode >= 400) {
            const errors = (getResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error fetching version for app ${appId} with version: ${version}, platform: ${platform}. Status code: ${getResponse.statusCode}. Errors: ${errors}`)
        }
        const data = (getResponse.body as any).data;
        if (data.length > 1) {
            throw new Error(`Received too many results for app ${appId}, version: ${version}, platform: ${platform} when trying to update the version number`);
        }
        if (data.length === 0) {
            throw new Error(`Version could not found for app ${appId}, platform: ${platform} when trying to update version to ${version}`)
        }

        const appStoreVersion   = data[0];
        const appStoreVersionId = appStoreVersion.id;

        const patchResponse = await got.patch(`${API_HOST}/v1/appStoreVersions/${appStoreVersionId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'json':            {
                "data": {
                    "id":         appStoreVersionId,
                    "type":       "appStoreVersions",
                    "attributes": {
                        "versionString": version,
                    },
                }
            },
            'throwHttpErrors': false,
        });

        if (patchResponse.statusCode >= 400) {
            const errors = (patchResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error when trying to update version for app ${appId} with version: ${version}, platform: ${platform}. Status code: ${patchResponse.statusCode}. Errors: ${errors}`)
        }
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
    public async createVersion(appId: number, version: string, platform: PlatformType, options?: CreateVersionOptions): Promise<void> {

        const defaultOptions: CreateVersionOptions = {
            autoRelease: false,
            copyright:   "",
            usesIdfa:    false
        }
        const opts                                 = options || {};
        const useOptions: CreateVersionOptions     = {
            ...defaultOptions,
            ...opts
        }

        const response = await got.post(`${API_HOST}/v1/appStoreVersions`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'throwHttpErrors': false,
            'json':            {
                "data": {
                    "type":          "appStoreVersions",
                    "attributes":    {
                        "platform":      platform,
                        "versionString": version,
                        "copyright":     options.copyright,
                        "releaseType":   useOptions.autoRelease ? "AFTER_APPROVAL" : "MANUAL",
                        "usesIdfa":      useOptions.usesIdfa
                    },
                    "relationships": {
                        "app": {
                            "data": {
                                "type": "apps",
                                "id":   appId.toString()
                            }
                        }
                    }
                }
            }
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new ApiError(`Error creating version for app ${appId}, version: ${version}, platform: ${platform}. Status code: ${response.statusCode}. Errors: ${errors.join(', ')}`, response.statusCode);
        }
    }

    /**
     * Attaches a build to a version for release
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {string} buildId
     */
    public async attachBuildIdToVersion(appId: number, version: string, platform: PlatformType, buildId: string): Promise<void> {

        const appStoreVersionId = await this.getVersionId(appId, version, platform);

        const patchResponse = await got.patch(`${API_HOST}/v1/appStoreVersions/${appStoreVersionId}/relationships/build`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'json':            {
                "data": {
                    "id":   buildId,
                    "type": "builds",
                }
            },
            'throwHttpErrors': false,
        });

        if (patchResponse.statusCode >= 400) {
            const errors = (patchResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error when trying to update version for app ${appId} with version: ${version}, platform: ${platform}. Status code: ${patchResponse.statusCode}. Errors: ${errors}`)
        }
    }

    /**
     * Attaches a build to a version for release by version Id
     *
     * @param {string} versionId
     * @param {string} buildId
     */
    public async attachBuildIdToVersionByVersionId(versionId: string, buildId: string): Promise<void> {

        const patchResponse = await got.patch(`${API_HOST}/v1/appStoreVersions/${versionId}/relationships/build`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'json':            {
                "data": {
                    "id":   buildId,
                    "type": "builds",
                }
            },
            'throwHttpErrors': false,
        });

        if (patchResponse.statusCode >= 400) {
            const errors = (patchResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error when trying to update version id: ${versionId} with build id: ${buildId}. Status code: ${patchResponse.statusCode}. Errors: ${errors}`)
        }
    }

    /**
     * Submits app for review
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     * @param {SubmitForReviewOptions?} options
     */
    public async submitForReview(appId: number, version: string, platform: PlatformType, options?: SubmitForReviewOptions): Promise<void> {

        const opts = options || {};
        const useOptions: SubmitForReviewOptions = {
            autoCreateVersion: false,
            autoreleaseOnApproval: false,
            ...opts
        }

        if(useOptions.autoCreateVersion) {
            await this.ensureVersionExists(appId, version, platform, {
                updateVersionStringIfUnreleasedVersionExists: true,
                createOptions: {
                    autoRelease: useOptions.autoreleaseOnApproval
                }
            } as EnsureVersionOptions);
        }

        const versionId = await this.getVersionId(appId, version, platform);

        return this.submitForReviewByVersionId(versionId, options);
    }

    /**
     * Gets the app store version id for a version string
     *
     * @param {number} appId
     * @param {string} version
     * @param {PlatformType} platform
     */
    public async getVersionId(appId: number, version: string, platform: PlatformType): Promise<string> {

        const response = await got.get(`${API_HOST}/v1/apps/${appId}/appStoreVersions`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'searchParams':    {
                'fields[apps]':          '',
                'filter[platform]':      platform,
                'filter[versionString]': version
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error fetching version for app ${appId} with version: ${version}, platform: ${platform}. Status code: ${response.statusCode}. Errors: ${errors}`)
        }

        const data = (response.body as any).data;

        if (data.length > 1) {
            throw new Error(`Received too many results for app ${appId} with version: ${version}, platform: ${platform}`);
        }
        if (data.length === 0) {
            throw new Error(`Version not found for app ${appId} with version: ${version}, platform: ${platform}`)
        }

        const appStoreVersion = data[0];

        return appStoreVersion.id;
    }

    /**
     * Gets the app store version id for a version string.
     *
     * @param {string} versionId
     * @param {SubmitForReviewOptions?} options
     */
    public async submitForReviewByVersionId(versionId: string, options?: SubmitForReviewOptions): Promise<void> {

        const opts = options || {};
        const useOptions: SubmitForReviewOptions = {
            ...opts
        }

        if(!useOptions.autoCreateVersion && Object.keys(useOptions).includes('autoreleaseOnApproval')) {
            await this._updateVersionReleaseType(versionId, useOptions.autoreleaseOnApproval);
        }

        if(useOptions.autoAttachBuildId){
            await this.attachBuildIdToVersionByVersionId(versionId, useOptions.autoAttachBuildId);
        }

        if(useOptions.localizations){
            await this.setVersionLocalizationsByVersionId(versionId, useOptions.localizations);
        }

        if(useOptions.releaseNotes){
           await this._setReleaseNotesByVersionId(versionId, useOptions.releaseNotes);
        }

        if(useOptions.reviewDetailAttributes){
            await this.setVersionReviewDetailAttributesByVersionId(versionId, useOptions.reviewDetailAttributes);
        }

        if(useOptions.versionAttributes){
            await this.updateVersionByVersionId(versionId, useOptions.versionAttributes);
        }

        const response = await got.post(`${API_HOST}/v1/appStoreVersionSubmissions`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'json':            {
                "data": {
                    "relationships": {
                        "appStoreVersion": {
                            "data": {
                                "id":   versionId,
                                "type": "appStoreVersions"
                            }
                        }
                    },
                    "type":          "appStoreVersionSubmissions",
                }
            },
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = JSON.stringify(response.body as any)
            throw new Error(`Error submitting app for approval for version id: ${versionId}. Status code: ${response.statusCode}. Errors: ${errors}`)
        }
    }

    private async _setReleaseNotesByVersionId(versionId: string, releaseNotes: string | ReleaseNotesInterface | ReleaseNotesInterface[]) {
        if(typeof releaseNotes === "string"){
            const localization: LocalizationInterface = {
                lang: 'en-US',
                attributes: {
                    whatsNew: releaseNotes
                }
            }
            await this.setVersionLocalizationsByVersionId(versionId, [localization]);
        }else if(Array.isArray(releaseNotes)){
            const localizations: LocalizationInterface[] = releaseNotes.map(releaseNote => ({
                lang: releaseNote.lang,
                attributes: {
                    whatsNew: releaseNote.text
                }
            }));
            await this.setVersionLocalizationsByVersionId(versionId, localizations);
        }else{
            const localization: LocalizationInterface = {
                lang: releaseNotes.lang,
                attributes: {
                    whatsNew: releaseNotes.text
                }
            }
            await this.setVersionLocalizationsByVersionId(versionId, [localization]);
        }
    }

    /**
     * Creates or updates version localizations
     *
     * @param {string} versionId
     * @param {LocalizationInterface[]} localizations
     */
    public async setVersionLocalizationsByVersionId(versionId: string, localizations: LocalizationInterface[]): Promise<void> {

        const response = await got.get(`${API_HOST}/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'searchParams':    {
                'fields[appStoreVersionLocalizations]': 'locale',
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error getting localizations for for version id: ${versionId}. Status code: ${response.statusCode}. Errors: ${errors}`)
        }

        const data = (response.body as any).data;

        const needLocales = localizations.map(localization => localization.lang);
        const hasLocales = [];
        for(const localization of data) {
            const locale = localization.attributes.locale;
            hasLocales.push(locale);
        }

        const missingLocales = needLocales.filter(locale => !hasLocales.includes(locale));

        const missingLocalizations = localizations.filter(localization => missingLocales.includes(localization.lang));

        let promises = [];
        for(const missingLocalization of missingLocalizations){
            promises.push(this._createVersionLocalization(versionId, missingLocalization));
        }

        await Promise.all(promises);

        const nonMissingLocalizations = localizations.filter(localization => !missingLocales.includes(localization.lang));
        const nonMissingLocalizationData = data
            .filter(datum => !missingLocales.includes(datum.attributes.locale))
            .map(datum => ({locale: datum.attributes.locale, id: datum.id }));

        const nonMissingLocalizationIdMap = {};
        for(const datum of nonMissingLocalizationData) {
            nonMissingLocalizationIdMap[datum.locale] = datum.id;
        }

        promises = [];
        for(const notMissingLocalization of nonMissingLocalizations){
            promises.push(this._updateVersionLocalization(nonMissingLocalizationIdMap[notMissingLocalization.lang], notMissingLocalization));
        }
        await Promise.all(promises);
    }

    private async _createVersionLocalization(versionId: string, localization: LocalizationInterface): Promise<void> {
        const defaultAttributes: LocalizationAttributesInterface = {
            description: '',
            keywords: '',
            supportUrl: '',
        };
        const response = await got.post(`${API_HOST}/v1/appStoreVersionLocalizations`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'json': {
                data: {
                    type: 'appStoreVersionLocalizations',
                    relationships: {
                        appStoreVersion: {
                            data: {
                                id: versionId,
                                type: 'appStoreVersions'
                            }
                        }
                    },
                    attributes: {...defaultAttributes, ...localization.attributes, locale: localization.lang }
                },
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error creating localization version id: ${versionId}, locale: ${localization.lang}. Status code: ${response.statusCode}. Errors: ${errors}`);
        }
    }

    private async _updateVersionLocalization(localizationId: string, localization: LocalizationInterface): Promise<void> {

        const response = await got.patch(`${API_HOST}/v1/appStoreVersionLocalizations/${localizationId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'json': {
                data: {
                    id: localizationId,
                    type: 'appStoreVersionLocalizations',
                    attributes: localization.attributes
                },
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 409) {
            const errors = (response.body as any).errors.map(error => error.detail);
            // This will happen if it's a first time app submission
            if(errors.includes("Attribute 'whatsNew' cannot be edited at this time") && errors.length === 1) {
                const noWhatNewLocalization = {...localization, attributes: { ...localization.attributes, whatsNew: undefined } }
                return this._updateVersionLocalization(localizationId, noWhatNewLocalization);
            }
        }

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error updating localization for locale: ${localization.lang}. Status code: ${response.statusCode}. Errors: ${errors}`);
        }
    }

    /**
     * Sets version review details
     *
     * @param {string} versionId
     * @param {ReviewDetailsInterface?} reviewDetails
     */
    public async setVersionReviewDetailAttributesByVersionId(versionId: string, reviewDetails: ReviewDetailsInterface): Promise<void> {

        const appStoreVersionResponse = await got.get(`${API_HOST}/v1/appStoreVersions/${versionId}/relationships/appStoreReviewDetail`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if(appStoreVersionResponse.statusCode === 404){
            await this._createVersionReviewDetail(versionId, reviewDetails);
        }else if (appStoreVersionResponse.statusCode >= 400) {
            const errors = (appStoreVersionResponse.body as any).errors.map(error => error.detail);
            throw new Error(`Error getting version with id: ${versionId}. Status code: ${appStoreVersionResponse.statusCode}. Errors: ${errors}`);
        }

        const reviewDetailsId = (appStoreVersionResponse.body as any).data.id;

        await this._updateVersionReviewDetail(reviewDetailsId, reviewDetails);
    }

    public async _createVersionReviewDetail(versionId: string, reviewDetails: ReviewDetailsInterface): Promise<void>{
        const response = await got.post(`${API_HOST}/v1/appStoreReviewDetails`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'json': {
                data: {
                    attributes: reviewDetails,
                    relationships: {
                        appStoreVersion: {
                            data: {
                                id: versionId,
                                type: 'appStoreVersions'
                            }
                        }
                    },
                    type: 'appStoreReviewDetails'
                },
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error creating version review details: ${versionId}. Status code: ${response.statusCode}. Errors: ${errors}`);
        }
    }

    public async _updateVersionReviewDetail(reviewDetailsId: string, reviewDetails: ReviewDetailsInterface): Promise<void>{
        const response = await got.patch(`${API_HOST}/v1/appStoreReviewDetails/${reviewDetailsId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'json': {
                data: {
                    attributes: reviewDetails,
                    id: reviewDetailsId,
                    type: 'appStoreReviewDetails'
                },
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error updating version review details with id: ${reviewDetailsId}. Status code: ${response.statusCode}. Errors: ${errors}`);
        }
    }

    /**
     * Updates a version
     *
     * @param {string} versionId
     * @param {VersionUpdateOptions} attributes
     */
    public async updateVersionByVersionId(versionId: string, attributes: VersionUpdateOptions): Promise<void> {
        const response = await got.patch(`${API_HOST}/v1/appStoreVersions/${versionId}`, {
            'headers':         {
                'Authorization': `Bearer ${this.tokenProvider.getBearerToken()}`,
                'Accept':        'application/json'
            },
            'json': {
                data: {
                    attributes: attributes,
                    id: versionId,
                    type: 'appStoreVersions'
                },
            },
            'responseType':    'json',
            'throwHttpErrors': false,
        });

        if (response.statusCode >= 400) {
            const errors = (response.body as any).errors.map(error => error.detail);
            throw new Error(`Error updating version with id: ${versionId}. Status code: ${response.statusCode}. Errors: ${errors}`);
        }
    }

}