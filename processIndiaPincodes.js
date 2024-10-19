import fs from 'fs';
import csv from 'csv-parser';

export function processIndiaPincodes() {
  return new Promise((resolve, reject) => {
    const states = new Set();
    const cities = new Set();
    const pincodes = new Set();

    fs.createReadStream('./Dataset/India_pincode.csv')
      .pipe(csv())
      .on('data', (row) => {
        if (row.State) {
          states.add(row.State.trim().toLowerCase());
        }
        if (row.City) {
          cities.add(row.City.trim().toLowerCase());
        }
        if (row.Pincode) {
          pincodes.add(row.Pincode.trim());
        }
      })
      .on('end', () => {
        const uniqueStates = Array.from(states).sort();
        const uniqueCities = Array.from(cities).sort();
        const pincodeList = Array.from(pincodes).sort();

        // console.log('Unique States:', uniqueStates);
        // console.log('Unique Cities:', uniqueCities);
        // console.log('Pincode List:', pincodeList);

        resolve({ uniqueStates, uniqueCities, pincodeList });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// code to test this function directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processIndiaPincodes()
    .then(({ uniqueStates, uniqueCities, pincodeList }) => {
      console.log('Process completed successfully.');
    })
    .catch((err) => {
      console.error('Error processing pincodes:', err);
    });
}