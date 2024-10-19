import fs from 'fs';
import csv from 'csv-parser';

export function processUSZips() {
  return new Promise((resolve, reject) => {
    const states = new Set();
    const cities = new Set();
    const zipCodes = new Set();

    fs.createReadStream('./Dataset/list_of_real_usa_addresses.csv') 
      .pipe(csv())
      .on('data', (row) => {
        if (row.state) {
            states.add(row.state.trim().toLowerCase());
          }
          if (row.city) {
            cities.add(row.city.trim().toLowerCase());
          }
          if (row.zip) {
            zipCodes.add(row.zip.trim());
          }
      })
      .on('end', () => {
        const uniqueStates = Array.from(states).sort();
        const uniqueCities = Array.from(cities).sort();
        const zipCodeList = Array.from(zipCodes).sort();

        // console.log('Unique US States:', uniqueStates);
        // console.log('Unique US Cities:', uniqueCities);
        // console.log('US Zip Codes:', zipCodeList);

        resolve({ uniqueStates, uniqueCities, zipCodeList });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// code to test this function directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processUSZips()
    .then(({ uniqueStates, uniqueCities, zipCodeList }) => {
      console.log('US zip codes processed successfully.');
    })
    .catch((err) => {
      console.error('Error processing US zip codes:', err);
    });
}