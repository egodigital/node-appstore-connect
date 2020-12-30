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

import {BuildStatus} from "./build-status";
import {PlatformType} from "../client";
import {WaitForBuildProcessingOptions} from "./wait-for-build-processing-options";

export interface BuildClientInterface {
    getBuildId(appId: number, version: string, platform: PlatformType, buildNumber?: number): Promise<string>;
    getBuildStatusFromBuildId(buildId: string): Promise<BuildStatus>;
    getBuildStatus(appId: number, version: string, platform: PlatformType, buildNumber?: number): Promise<BuildStatus>;
    waitForBuildProcessingToComplete(appId: number, platform: PlatformType, version: string, buildNumber: number, options?: WaitForBuildProcessingOptions): Promise<void>;
}
