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

import * as got from 'got';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { gunzip, isNil, readCSV } from './utils';


/**
 * Options for a 'Client' instance.
 */
export interface ClientOptions {
    /**
     * The API key.
     */
    apiKey: string;
    /**
     * The number in sec, the token will expire. Default: 1200
     */
    expriresIn?: number;
    /**
     * The ID of the issuer.
     */
    issuerId: string;
    /**
     * The private key.
     */
    privateKey: PrivateKey;
}

// , YEARLY

/**
 * The frequence of a report.
 */
export enum DownloadSalesReportFrequency {
    /**
     * Daily
     */
    Daily = 'DAILY',
    /**
     * Monthly
     */
    Monthly = 'MONTHLY',
    /**
     * Weekly
     */
    Weekly = 'WEEKLY',
    /**
     * Yearly
     */
    Yearly = 'YEARLY',
}

/**
 * Options for 'Client.downloadSalesReportSummary()' method.
 */
export interface DownloadSalesReportSummaryOptions {
    /**
     * The custom report date.
     */
    date?: moment.MomentInput;
    /**
     * The frequency. Default: Weekly.
     */
    frequency?: DownloadSalesReportFrequency;
    /**
     * The ID of the vendor.
     */
    vendorId: string;
}

/**
 * Options for 'Client.getAppDownloads()' method.
 */
export interface GetAppDownloadsOptions extends DownloadSalesReportSummaryOptions {
}

/**
 * Result of a 'Client.getAppDownloads()' method call.
 */
export interface GetAppDownloadsResult {
    /**
     * The list of apps.
     */
    apps: { [appId: string]: GetAppDownloadsAppItem };
}

/**
 * An app item of 'GetAppDownloadsResult.apps'.
 */
export interface GetAppDownloadsAppItem {
    /**
     * The number of downloads.
     */
    downloads: number;
}

/**
 * A value for an App Store Connect private key.
 */
export type PrivateKey = string | Buffer;

/**
 * A row of a sales report CSV.
 */
export interface SalesReportRow {
    'Apple Identifier': string;
    'Begin Date': string;
    'CMB': string;
    'Category': string;
    'Client': string;
    'Country Code': string;
    'Currency of Proceeds': string;
    'Customer Currency': string;
    'Customer Price': string;
    'Developer Proceeds': string;
    'Developer': string;
    'Device': string;
    'End Date': string;
    'Order Type': string;
    'Parent Identifier': string;
    'Period': string;
    'Preserved Pricing': string;
    'Proceeds Reason': string;
    'Product Type Identifier': string;
    'Promo Code': string;
    'Provider Country': string;
    'Provider': string;
    'SKU': string;
    'Subscription': string;
    'Supported Platforms': string;
    'Title': string;
    'Units': string;
    'Version': string;
}


/**
 * A client for the App Store Connect API.
 */
export class Client {
    private _bearerToken: string;

    /**
     * Initializes a new instance of that class.
     *
     * @param {ClientOptions} options The options.
     */
    public constructor(
        public readonly options: ClientOptions
    ) { }

    private _getBearerToken(): string {
        if (isNil(this._bearerToken)) {
            const NOW = Math.round((new Date()).getTime() / 1000);

            let expriresIn = this.options.expriresIn;
            if (isNaN(expriresIn)) {
                expriresIn = 1200;
            }

            const PAYLOAD = {
                "iss": this.options.issuerId,
                "exp": NOW + expriresIn,
                "aud": "appstoreconnect-v1"
            };

            const SIGN_OPTS = {
                "algorithm": "ES256",
                header: {
                    "alg": "ES256",
                    "kid": this.options.apiKey,
                    "typ": "JWT"
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

    /**
     * Downloads a summary of a sales report.
     *
     * @param {DownloadSalesReportSummaryOptions} opts The options.
     * 
     * @return {Promise<SalesReportRow[]>} The promise with the rows.
     */
    public async downloadSalesReportSummary(opts: DownloadSalesReportSummaryOptions): Promise<SalesReportRow[]> {
        let reportDate = opts.date;
        if (isNil(reportDate)) {
            reportDate = moment();
        }
        if (!moment.isMoment(reportDate)) {
            reportDate = moment(reportDate);
        }

        let frequency = opts.frequency;
        if (isNil(frequency)) {
            frequency = DownloadSalesReportFrequency.Weekly;
        }

        let filterReportDate: string;
        switch (frequency) {
            case DownloadSalesReportFrequency.Weekly:
                reportDate = moment(reportDate.toDate()).endOf('isoWeek');
                filterReportDate = reportDate.format('YYYY-MM-DD');
                break;

            case DownloadSalesReportFrequency.Monthly:
                filterReportDate = reportDate.format('YYYY-MM');
                break;

            case DownloadSalesReportFrequency.Yearly:
                filterReportDate = reportDate.format('YYYY');
                break;

            default:
                filterReportDate = reportDate.format('YYYY-MM-DD');
                break;
        }

        const TOKEN = this._getBearerToken();

        const RESPONSE = await got.get(`https://api.appstoreconnect.apple.com/v1/salesReports`, {
            encoding: null,
            headers: {
                'Authorization': 'Bearer ' + TOKEN,
                'Accept': 'application/a-gzip'
            },
            query: {
                'filter[frequency]': frequency,
                'filter[reportDate]': filterReportDate,
                'filter[reportType]': 'SALES',
                'filter[reportSubType]': 'SUMMARY',
                'filter[vendorNumber]': opts.vendorId,
            },
            throwHttpErrors: false,
        });

        if (200 !== RESPONSE.statusCode) {
            if (404 === RESPONSE.statusCode) {
                return [];
            }

            throw new Error(`Unexpected Response: [${
                RESPONSE.statusCode
                }] '${RESPONSE.body}'`);
        }

        //@ts-ignore
        const ZIPPED_CSV: Buffer = RESPONSE.body;

        return readCSV(
            await gunzip(ZIPPED_CSV, 'utf8')
        );
    }

    /**
     * Returns a summary of app downloads.
     * 
     * @param {GetAppDownloadsOptions} opts The options.
     * 
     * @return {Promise<GetAppDownloadsResult>} The promise with the result.
     */
    public async getAppDownloads(opts: GetAppDownloadsOptions): Promise<GetAppDownloadsResult> {
        const CSV = await this.downloadSalesReportSummary(opts);

        const RESULT: GetAppDownloadsResult = {
            apps: {},
        };

        for (const R of CSV) {
            let item = RESULT.apps[R.SKU];
            if (isNil(item)) {
                RESULT.apps[R.SKU] = item = {
                    downloads: 0,
                };
            }

            let units = parseInt(R.Units);

            item.downloads += isNaN(units) ?
                0 : units;
        }

        return RESULT;
    }
}
