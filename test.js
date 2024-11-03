import gplay from "google-play-scraper";
import fs from "fs";
import { processIndiaPincodes } from './processIndiaPincodes.js';
import { processUSZips } from './processUSZips.js';


let categoryList = [
    gplay.category.APPLICATION,
    gplay.category.ANDROID_WEAR,
    gplay.category.ART_AND_DESIGN,
    gplay.category.AUTO_AND_VEHICLES,
    gplay.category.BEAUTY,
    gplay.category.BOOKS_AND_REFERENCE,
    gplay.category.BUSINESS,
    gplay.category.COMICS,
    gplay.category.COMMUNICATION,
    gplay.category.DATING,
    gplay.category.EDUCATION,
    gplay.category.ENTERTAINMENT,
    gplay.category.EVENTS,
    gplay.category.FINANCE,
    gplay.category.FOOD_AND_DRINK,
    gplay.category.HEALTH_AND_FITNESS,
    gplay.category.HOUSE_AND_HOME,
    gplay.category.LIBRARIES_AND_DEMO,
    gplay.category.LIFESTYLE,
    gplay.category.MAPS_AND_NAVIGATION,
    gplay.category.MEDICAL,
    gplay.category.MUSIC_AND_AUDIO,
    gplay.category.NEWS_AND_MAGAZINES,
    gplay.category.PARENTING,
    gplay.category.PERSONALIZATION,
    gplay.category.PHOTOGRAPHY,
    gplay.category.PRODUCTIVITY,
    gplay.category.SHOPPING,
    gplay.category.SOCIAL,
    gplay.category.SPORTS,
    gplay.category.TOOLS,
    gplay.category.TRAVEL_AND_LOCAL,
    gplay.category.VIDEO_PLAYERS,
    gplay.category.WEATHER,
    gplay.category.GAME
];

async function isIndianApp(developerAddress, indianStates, indianCities, indianPincodes) {
    const addressLower = developerAddress.toLowerCase();

    if (addressLower.includes('india')) {
        return true;
    }
    for (const state of indianStates) {
        if (addressLower.includes(state)) {
            return true;
        }
    }
    for (const city of indianCities) {
        if (addressLower.includes(city)) {
            return true;
        }
    }

    for (const pincode of indianPincodes) {
        if (addressLower.includes(pincode)) {
            return true;
        }
    }
    return false;
}

async function isUSApp(developerAddress, usStates, usCities, usZipCodes) {
    const addressLower = developerAddress.toLowerCase();

    if (
        addressLower.includes('united states') ||
        addressLower.includes('usa') ||
        addressLower.includes('u.s.a.')
    ) {
        return true;
    }
    for (const state of usStates) {
        if (addressLower.includes(state)) {
            return true;
        }
    }
    for (const city of usCities) {
        if (addressLower.includes(city)) {
            return true;
        }
    }

    for (const zipCode of usZipCodes) {
        if (addressLower.includes(zipCode)) {
            return true;
        }
    }
    return false;
}

async function appendJsonToFile(fileName, data) {
    let list = [];
    try {
        list = JSON.parse(fs.readFileSync(fileName));
    } catch (error) {
        // File does not exist
    }
    list = list.concat(data);
    fs.writeFileSync(fileName, JSON.stringify(list));
}


// MAIN FUNCTION
async function main() {
    // console.log('Fetching app details...');

    // // Fetch app list
    // let appIdList = [];
    // for (let category of categoryList) {
    //     try {
    //         const appList = await gplay.list({category: category, num: 500});
    //         for (let app of appList) {
    //             appIdList.push(app.appId);
    //         }
    //         console.log(`Fetched app list for category ${category}`);
    //     } catch (error) {
    //         console.log(`Error fetching app list for category ${category}:`, error);
    //     }
    // }

    // // Remove duplicates
    // appIdList = [...new Set(appIdList)];

    // Write app IDs to file
    // fs.writeFileSync('./apps/AppIdList.json', JSON.stringify(appIdList));

    const appIdList = JSON.parse(fs.readFileSync('./apps/AppIdList.json'));
    console.log(`Fetched ${appIdList.length} app IDs.`);

    console.log('Fetching app details...');
    // Fetch app details
    let appList = [];
    let appCount = 0;
    for (let i = 6650 ; i < appIdList.length; i++) {
        const appId = appIdList[i];
        try {
            let appDetails = await gplay.app({ appId: appId });
            let appDataSafety = await gplay.datasafety({ appId: appId });
            appDetails = {
                appId: appDetails.appId,
                appName: appDetails.title,
                developerAddress: appDetails.developerAddress || '',
                datasafety: appDataSafety,
            }
            appList.push(appDetails);
            appCount++;
            if (appCount % 50 === 0) {
                console.log(`Appending ${appCount} apps to file...`);
                appendJsonToFile('./apps/AppList.json', appList);
                appList = [];
            }

            console.log(`Fetched app details for appId ${appId}`);
        }
        catch (error) {
            console.log(`Error fetching app details for appId ${appId}:`, error);
        }
    }

    // Append remaining apps to file
    appendJsonToFile('./apps/AppList.json', appList);

    // Process apps
    appList = JSON.parse(fs.readFileSync('./apps/AppList.json'));

    const indianData = await processIndiaPincodes();
    const usData = await processUSZips();

    // Filter apps by country
    let indianApps = [];
    let usApps = [];

    for (let app of appList) {
        if (await isIndianApp(app.developerAddress, indianData.uniqueStates, indianData.uniqueCities, indianData.pincodeList)) {
            indianApps.push(app);
        } else if (await isUSApp(app.developerAddress, usData.uniqueStates, usData.uniqueCities, usData.zipCodeList)) {
            usApps.push(app);
        }
    }

    // Write filtered apps to JSON files
    fs.writeFileSync('./apps/IndianApps.json', JSON.stringify(indianApps));
    fs.writeFileSync('./apps/USApps.json', JSON.stringify(usApps));

    console.log(`Processed ${indianApps.length} Indian apps and ${usApps.length} US apps.`);
}

async function main2() {
    let appIdList = []

    // Fetch app list
    let appList = await gplay.search({
        term: 'india',
        num: 200
    });

    const alreadyExistingAppIds = JSON.parse(fs.readFileSync('./apps/AppIdList.json'));
    for (let app of appList) {
        if (!alreadyExistingAppIds.includes(app.appId)) {
            appIdList.push(app.appId);
        }
    }

    let newAppList = [];

    for (let appId of appIdList) {
        try {
            let appDetails = await gplay.app({ appId: appId });
            let appDataSafety = await gplay.datasafety({ appId: appId });
            appDetails = {
                appId: appDetails.appId,
                appName: appDetails.title,
                developerAddress: appDetails.developerAddress || '',
                datasafety: appDataSafety,
            }
            newAppList.push(appDetails);
            console.log(`Fetched app details for appId ${appId}`);
        }
        catch (error) {
            console.log(`Error fetching app details for appId ${appId}:`, error);
        }
    }

    const indianData = await processIndiaPincodes();
    const usData = await processUSZips();

    let indianApps = [];
    let usApps = [];
    for (let app of newAppList) {
        if (await isIndianApp(app.developerAddress, indianData.uniqueStates, indianData.uniqueCities, indianData.pincodeList)) {
            indianApps.push(app);
        }
        else if (await isUSApp(app.developerAddress, usData.uniqueStates, usData.uniqueCities, usData.zipCodeList)) {
            usApps.push(app);
        }
    }

    console.log(`Fetched ${newAppList.length} new apps.`);
    console.log(`Processed ${indianApps.length} Indian apps and ${usApps.length} US apps.`);
}

main2().catch((error) => {
    console.error('Error processing apps:', error);
});