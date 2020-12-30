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

import {isNil} from "./utils";
import * as jwt from "jsonwebtoken";
import {ClientOptions} from "./client-options";

export class TokenProvider {

    private _bearerToken: string | undefined;

    constructor(public readonly options: ClientOptions) {
    }

    public getBearerToken() {
        if (isNil(this._bearerToken)) {
            const NOW = Math.round((new Date()).getTime() / 1000);

            let expiresIn = this.options.expriresIn;
            if (isNaN(expiresIn)) {
                expiresIn = 1200;
            }

            const PAYLOAD = {
                'iss': this.options.issuerId,
                'exp': NOW + expiresIn,
                'aud': 'appstoreconnect-v1'
            };

            const SIGN_OPTS: jwt.SignOptions = {
                'algorithm': 'ES256',
                'header': {
                    'alg': 'ES256',
                    'kid': this.options.apiKey,
                    'typ': 'JWT'
                }
            };

            this._bearerToken = jwt.sign(
                PAYLOAD,
                this.options.privateKey,
                SIGN_OPTS
            );
        }

        return this._bearerToken;
    }
}