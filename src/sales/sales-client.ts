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

import {gunzip, isNil, readCSV} from "../client/utils";
import * as moment from "moment";
import got from "got";
import {SalesReportRow} from "./sales-report-row";
import {TokenProvider} from "../client/token-provider";
import {DownloadSalesReportSummaryOptions} from "./download-sales-report-summary-options";
import {DownloadSalesReportFrequency} from "./download-sales-report-frequency";
import {SalesReportRowFilter} from "./sales-report-row-filter";
import {GetAppDownloadsOptions} from "./get-app-downloads-options";
import {GetAppDownloadsResult} from "./get-app-downloads-result";
import {API_HOST} from "../constants";

export class SalesClient {

    constructor(private readonly tokenProvider: TokenProvider) {
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

        const TOKEN = this.tokenProvider.getBearerToken();

        const RESPONSE = await got.get(`${API_HOST}/v1/salesReports`, {
            'headers': {
                'Authorization': 'Bearer ' + TOKEN,
                'Accept': 'application/a-gzip'
            },
            'responseType': 'buffer',
            'searchParams': {
                'filter[frequency]': frequency,
                'filter[reportDate]': filterReportDate,
                'filter[reportType]': 'SALES',
                'filter[reportSubType]': 'SUMMARY',
                'filter[vendorNumber]': opts.vendorId,
            },
            'throwHttpErrors': false,
        });

        if (200 !== RESPONSE.statusCode) {
            if (404 === RESPONSE.statusCode) {
                return [];
            }

            throw new Error(`Unexpected Response: [${
                RESPONSE.statusCode
            }] '${RESPONSE.body}'`);
        }

        const ZIPPED_CSV = RESPONSE.body;
        const ALL_ROWS = await readCSV<SalesReportRow>(
            await gunzip(ZIPPED_CSV, 'utf8')
        );

        const ROWS: SalesReportRow[] = [];
        const FILTER: SalesReportRowFilter = isNil(opts.filter) ?
            () => true : opts.filter;
        for (const R of ALL_ROWS) {
            if (await FILTER(R)) {
                ROWS.push(R);
            }
        }

        return ROWS;
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