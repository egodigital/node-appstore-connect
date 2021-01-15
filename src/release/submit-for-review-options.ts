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

import {ReviewDetailsInterface} from "./review-details.interface";
import {ReleaseNotesInterface} from "./release-notes.interface";
import {LocalizationInterface} from "./localization.interface";
import {VersionUpdateOptions} from "./version-update-options";

export interface SubmitForReviewOptions {

    /**
     * Whether or not to auto create an app store version in case it does not already exist
     * This option will also cause any un-released version to be overwritten
     */
    autoCreateVersion?: boolean;

    /**
     * Whether or not to update the auto release after approval
     */
    autoreleaseOnApproval?: boolean;

    /**
     * Auto attach this build Id before submitting for review
     */
    autoAttachBuildId?: string;

    /**
     * If used will override localization attribute. Defaults to en-US for string value.
     */
    releaseNotes?: string | ReleaseNotesInterface | ReleaseNotesInterface[];

    /**
     * Review details for the version
     */
    reviewDetailAttributes?: ReviewDetailsInterface;

    /**
     * Attributes of a version that can be updated
     */
    versionAttributes?: VersionUpdateOptions;

    /**
     * Localized attributes for a version
     */
    localizations?: LocalizationInterface[];
}