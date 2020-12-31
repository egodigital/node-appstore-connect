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

import {PlatformType} from "../client";
import {SubmitForReviewOptions} from "./submit-for-review-options";
import {CreateVersionOptions} from "./create-version-options";
import {EnsureVersionOptions} from "./ensure-version-options";
import {LocalizationInterface} from "./localization.interface";
import {ReviewDetailsInterface} from "./review-details.interface";

export interface ReleaseClientInterface {
    ensureVersionExists(appId: number, version: string, platform: PlatformType, options?: EnsureVersionOptions): Promise<void>;
    createVersion(appId: number, version: string, platform: PlatformType, options?: CreateVersionOptions): Promise<void>;
    attachBuildIdToVersion(appId: number, version: string, platform: PlatformType, buildId: string): Promise<void>;
    attachBuildIdToVersionByVersionId(versionId: string, buildId: string): Promise<void>;
    submitForReview(appId: number, version: string, platform: PlatformType, options?: SubmitForReviewOptions): Promise<void>;
    submitForReviewByVersionId(versionId: string, options?: SubmitForReviewOptions): Promise<void>
    getVersionId(appId: number, version: string, platform: PlatformType): Promise<string>;
    setVersionLocalizationsByVersionId(versionId: string, localizations: LocalizationInterface[]): Promise<void>;
    setVersionReviewDetailAttributesByVersionId(versionId: string, reviewDetails: ReviewDetailsInterface): Promise<void>
}