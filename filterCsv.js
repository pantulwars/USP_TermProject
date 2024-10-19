const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const inputFilePath = './Dataset/Google-Playstore 2.csv'; 
const outputFilePath = './Dataset/Filtered-Google-Playstore.csv';

const desiredColumns = ['App Name', 'App Id']; 
const results = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const filteredRow = {};
    for (const column of desiredColumns) {
      filteredRow[column] = row[column];
    }
    results.push(filteredRow);
  })
  .on('end', () => {
    console.log('CSV file successfully processed.');

    const csvWriter = createCsvWriter({
      path: outputFilePath,
      header: desiredColumns.map((column) => ({ id: column, title: column })),
    });

    csvWriter
      .writeRecords(results)
      .then(() => {
        console.log(`Filtered data written to ${outputFilePath}`);
      })
      .catch((err) => {
        console.error('Error writing CSV file:', err);
      });
  })
  .on('error', (err) => {
    console.error('An error occurred while reading the CSV file:', err);
  });