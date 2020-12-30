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
