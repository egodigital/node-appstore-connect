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

import {TestflightAddBuildToExternalGroupOptions} from "./testflight-add-build-to-external-group-options";
import {PlatformType} from "../client";
import {TestflightNotifyBetaTestersOptions} from "./testflight-notify-beta-testers-options";
import {TestflightCreateGroupOptions} from "./testflight-create-group-options";

export interface TestflightClientInterface {
    addBuildToExternalGroupByGroupId(appId: number, version: string, platform: PlatformType, buildNumber: number, groupId: string, options?: TestflightAddBuildToExternalGroupOptions): Promise<void>;
    addBuildToExternalGroupByGroupIdAndBuildId(buildId: string, groupId: string): Promise<void>;
    addBuildToExternalGroupByBuildId(appId: number, buildId: string, groupName: string, options?: TestflightAddBuildToExternalGroupOptions): Promise<void>;
    notifyBetaTestersOfNewBuildByBuildId(buildId: string, options?: TestflightNotifyBetaTestersOptions): Promise<void>;
    createExternalBetaTestersGroup(appId: number, groupName: string, options?: TestflightCreateGroupOptions): Promise<string>;
    getExternalBetaTestersGroupId(appId: number, groupName: string): Promise<string>;
}