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

import * as moment from "moment";
import {SalesReportRowFilter} from "./sales-report-row-filter";
import {DownloadSalesReportFrequency} from "./download-sales-report-frequency";


/**
 * Options for 'Client.downloadSalesReportSummary()' method.
 */
export interface DownloadSalesReportSummaryOptions {
    /**
     * The custom report date.
     */
    'date'?: moment.MomentInput;
    /**
     * A filter for a sales report row.
     */
    'filter'?: SalesReportRowFilter;
    /**
     * The frequency. Default: Weekly.
     */
    'frequency'?: DownloadSalesReportFrequency;
    /**
     * The ID of the vendor.
     */
    'vendorId': string;
}