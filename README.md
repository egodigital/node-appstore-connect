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

### Get app downloads

```typescript
import * as fs from 'fs';
import { Client as AppStoreConnectClient, DownloadSalesReportFrequency } from '@egodigital/appstore-connect';

const PRIVATE_KEY = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const CLIENT = AppStoreConnectClient.create({
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

### Wait for build processing to complete

```typescript
import * as fs from 'fs';
import {BuildPlatformType, BuildProcessingState, ClientOptions, Client} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const marketingVersion = "1.0.25";
    const buildNumber = 1;
    try {
        await client.waitForBuildProcessingToComplete(appId, BuildPlatformType.IOS, marketingVersion, buildNumber, {
            pollIntervalInSeconds: 10,
            maxTries: 3,
            onPollCallback: (state: BuildProcessingState, tries: number) => {
                console.log(`Waiting for build processing to complete. Got status: ${state}. Tries: ${tries}`);
            }
        });

        console.log("I'm done!");
        process.exit(0);
    }catch (e){
        console.log("I failed");
        console.log(e.message);
        process.exit(1);
    }
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Create a version to be released

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const appStoreVersion = "1.0.25";
    await client.createVersion(appId, appStoreVersion, PlatformType.IOS, {
        copyright: "John Doe, Inc",
    });
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Ensure an app store version to be released exists

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const appStoreVersion = "1.0.25";
    await client.ensureVersionExists(appId, appStoreVersion, PlatformType.IOS, {
        createOptions: {
            copyright: "John Doe, Inc",
        },
        
        // Updates any unreleased version to have the provided version
        // This is useful in case you want to change the version you are planning to release since apple 
        // does not allow you to have multiple unreleased (pending) versions
        // Only the version number will be updated. None of the create options will be used to update the existing version.
        updateVersionStringIfUnreleasedVersionExists: true
    });
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Attach a build to a version

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const appStoreVersion = "1.0.25";
    const buildId =  "7935ef82-4acf-11eb-b378-0242ac130002";
    await client.attachBuildIdToVersion(appId,  appStoreVersion, PlatformType.IOS, buildId)
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Attach a build to a version by version Id

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    
    // Not the same as the build pre-release version. Also referred to as the version string
    const appStoreVersion = "1.0.25";
    
    // Also referred to as pre-release version
    const buildMarketingVersion = "1.0.25";
    
    // Also referred to as the build version
    const buildNumber = 2;
    
    const versionId = await client.getVersionId(appId, appStoreVersion, PlatformType.IOS);
    const buildId = await client.getBuildId(appId,  buildMarketingVersion, PlatformType.IOS, buildNumber);
    await client.attachBuildIdToVersionByVersionId(versionId, buildId);
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Attach a build to an external testing group

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const version = "1.0.25";
    const buildNumber = 2;
    const groupId = "917ed9fe-4ada-11eb-b378-0242ac130002";
    
    await client.addBuildToExternalGroupByGroupId(appId, version, PlatformType.IOS, buildNumber, groupId, {
        notifyBetaTestersThereIsANewBuild: true
    });
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

### Submit a version for review

```typescript
import * as fs from 'fs';
import {Client, ClientOptions, PlatformType} from '@egodigital/appstore-connect';

const privateKey = fs.readFileSync(
    '/path/to/your/p8/file'  // downloaded from https://appstoreconnect.apple.com/access/api
);

const clientOptions: ClientOptions = {
    apiKey: "<YOUR-API-KEY>",
    issuerId: "<YOUR-ISSUER-ID>",
    privateKey
}

const client = Client.create(clientOptions);

const run = async () => {
    const appId = 1543000000;
    const version = "1.0.25";
    
    await client.submitForReview(appId, version, PlatformType.IOS);
}

run().then().catch((e: Error) => {
    console.error(`Error: ${e.message}`);
    console.debug(`Stack: ${e.stack}`);
});
```

## Documentation

Additional API documentation can be found [here](https://egodigital.github.io/appstore-connect/).
