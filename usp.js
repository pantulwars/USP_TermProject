import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import gplay from 'google-play-scraper';
import { processIndiaPincodes } from './processIndiaPincodes.js';
import { processUSZips } from './processUSZips.js';

// Constant for maximum apps per country
const MAX_APPS_PER_COUNTRY = 10;

async function fetchAppData(appId, appName, indianData, usData) {
    try {
        const appDetails = await gplay.app({ appId: appId });
        // Fetch data safety labels
        const dataSafety = await gplay.datasafety({ appId: appId });

        const developerAddress = appDetails.developerAddress || '';
        let developerState = 'Unknown';
        let developerCountry = 'Unknown';

        const { indianStates, indianCities, indianPincodes } = indianData;
        const { usStates, usCities, usZipCodes } = usData;

        if (developerAddress) {
            const addressLower = developerAddress.toLowerCase();

            // Check if developer address contains country name
            if (addressLower.includes('india')) {
                developerCountry = 'India';
            } else if (
                addressLower.includes('united states') ||
                addressLower.includes('usa') ||
                addressLower.includes('u.s.a.')
            ) {
                developerCountry = 'United States';
            }

            // If country is unknown, check for Indian states
            if (developerCountry === 'Unknown') {
                for (const state of indianStates) {
                    if (addressLower.includes(state)) {
                        developerState = state;
                        developerCountry = 'India';
                        break;
                    }
                }
            }

            // If country is still unknown, check for US states
            if (developerCountry === 'Unknown') {
                for (const state of usStates) {
                    if (addressLower.includes(state)) {
                        developerState = state;
                        developerCountry = 'United States';
                        break;
                    }
                }
            }

            // If country is still unknown, check for Indian cities
            if (developerCountry === 'Unknown') {
                for (const city of indianCities) {
                    if (addressLower.includes(city)) {
                        developerCountry = 'India';
                        break;
                    }
                }
            }

            // If country is still unknown, check for US cities
            if (developerCountry === 'Unknown') {
                for (const city of usCities) {
                    if (addressLower.includes(city)) {
                        developerCountry = 'United States';
                        break;
                    }
                }
            }

            // If country is still unknown, check for Indian pincodes
            if (developerCountry === 'Unknown') {
                for (const pincode of indianPincodes) {
                    if (addressLower.includes(pincode)) {
                        developerCountry = 'India';
                        break;
                    }
                }
            }

            // If country is still unknown, check for US zip codes
            if (developerCountry === 'Unknown') {
                for (const zipCode of usZipCodes) {
                    if (addressLower.includes(zipCode)) {
                        developerCountry = 'United States';
                        break;
                    }
                }
            }
        }

        const appData = {
            appName,
            appId,
            dataSafety,
            developerCountry: developerCountry === 'Unknown' ? 'Unknown' : developerCountry,
        };

        return { appData, developerCountry };
    } catch (error) {
        console.error(`Error fetching data for App ID ${appId}:`, error);
        return null;
    }
}

async function main() {

    const appList = [];
    const indianApps = [];
    const usApps = [];

    // Counters to limit to MAX_APPS_PER_COUNTRY apps each
    let indianCount = 0;
    let usCount = 0;

    const indianData = await processIndiaPincodes();
    const usData = await processUSZips();

    await new Promise((resolve, reject) => {
        fs.createReadStream('./Dataset/Filtered-Google-Playstore.csv')
            .pipe(csv())
            .on('data', (row) => {
                appList.push({ appName: row['App Name'], appId: row['App Id'] });
            })
            .on('end', resolve)
            .on('error', reject);
    });

    for (const { appName, appId } of appList) {
        if (indianCount >= MAX_APPS_PER_COUNTRY && usCount >= MAX_APPS_PER_COUNTRY) {
            break; // Both files have reached the limit
        }

        const result = await fetchAppData(appId, appName, indianData, usData);
        if (result) {
            const { appData, developerCountry } = result;

            if (developerCountry === 'India' && indianCount < MAX_APPS_PER_COUNTRY) {
                indianApps.push(appData);
                indianCount++;
            } else if (developerCountry === 'United States' && usCount < MAX_APPS_PER_COUNTRY) {
                usApps.push(appData);
                usCount++;
            }
        }
    }

    // Create the directory if it doesn't exist
    const directoryPath = path.join(process.cwd(), 'apps');
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }

    // Write the JSON files in the 'apps' directory
    fs.writeFileSync(path.join(directoryPath, 'indian_apps.json'), JSON.stringify(indianApps, null, 2));
    fs.writeFileSync(path.join(directoryPath, 'us_apps.json'), JSON.stringify(usApps, null, 2));

    console.log(`Processed ${indianCount} Indian apps and ${usCount} US apps to the apps directory.`);
}

main().catch((error) => {
    console.error('An error occurred:', error);
});