[![npm](https://img.shields.io/npm/v/@egodigital/appstore-connect.svg)](https://www.npmjs.com/package/@egodigital/appstore-connect)

# @egodigital/appstore-connect

A simplfied library for [Node.js 10+](https://nodejs.org/docs/latest-v10.x/api/) for accessing [Apple's App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi), written in [TypeScript](https://www.typescriptlang.org/).

The module is quite new, so [issues](https://github.com/egodigital/node-appstore-connect/issues) and [pull requests](https://github.com/egodigital/node-appstore-connect/pulls) are very welcome :-)

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egodigital/appstore-connect
```

## Usage

```typescript
import * as fs from 'fs';
import { Client as AppStoreConnectClient, DownloadSalesReportFrequency } from '@egodigital/appstore-connect';

const PRIVATE_KEY = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const CLIENT = new AppStoreConnectClient({
    apiKey: '<YOUR-API-KEY>',  // s. https://appstoreconnect.apple.com/access/api
    issuerId: '<YOUR-ISSUER-ID>',  // s. https://appstoreconnect.apple.com/access/api
    privateKey: PRIVATE_KEY,
});

const SUMMARY = await CLIENT.getAppDownloads({
    frequency: DownloadSalesReportFrequency.Weekly,
    vendorId: '<YOUR-VENDOR-ID>',  // s. https://appstoreconnect.apple.com/itc/payments_and_financial_reports
});

console.log(
    SUMMARY
);
```

## Documentation

The API documentation can be found [here](https://egodigital.github.io/appstore-connect/).
