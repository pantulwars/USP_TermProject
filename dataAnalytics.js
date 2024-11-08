import { readFileSync, writeFileSync } from "fs";
import QuickChart from "quickchart-js";
import _ from "lodash";
import { tTestTwoSample } from "simple-statistics";

// Read and parse the JSON files for each country
const usData = JSON.parse(readFileSync("./apps/USApps.json", "utf8"));
const indianData = JSON.parse(readFileSync("./apps/IndianApps.json", "utf8"));

// Take a random sample of 100 apps from each dataset
const usSample = _.sampleSize(usData, 100);
const indianSample = _.sampleSize(indianData, 100);

// Extract collected and shared data for each app
const usCollectedData = usSample.flatMap(
  (app) => app.datasafety.collectedData || []
);
const usSharedData = usSample.flatMap((app) => app.datasafety.sharedData || []);
const indianCollectedData = indianSample.flatMap(
  (app) => app.datasafety.collectedData || []
);
const indianSharedData = indianSample.flatMap(
  (app) => app.datasafety.sharedData || []
);

// Count the number of unique data types and purposes in each dataset.
const countByType = (data, typeField) => {
  return data.reduce((acc, item) => {
    acc[item[typeField]] = (acc[item[typeField]] || 0) + 1;
    return acc;
  }, {});
};

const usTypeCounts = countByType(usCollectedData, "type");
const indianTypeCounts = countByType(indianCollectedData, "type");
const indianDataCounts = countByType(indianCollectedData, "data");
const usDataCounts = countByType(usCollectedData, "data");

// Count the number of unique purposes in each dataset.
const countByPurpose = (data) => {
  return data.reduce((acc, item) => {
    const purposes = item.purpose.split(", ");
    purposes.forEach((purpose) => {
      acc[purpose] = (acc[purpose] || 0) + 1;
    });
    return acc;
  }, {});
};

const usPurposeCounts = countByPurpose(usCollectedData);
const indianPurposeCounts = countByPurpose(indianCollectedData);

// Count the number of optional and required data types in each dataset
const countOptionality = (data) => {
  return data.reduce((acc, item) => {
    acc[item.optional ? "optional" : "required"] =
      (acc[item.optional ? "optional" : "required"] || 0) + 1;
    return acc;
  }, {});
};

const usOptionality = countOptionality(usCollectedData);
const indianOptionality = countOptionality(indianCollectedData);

// Count the number of security practices in each dataset
const countSecurityPractices = (data) => {
  const practices = data.map((app) => app.datasafety.securityPractices).flat();
  return practices.reduce((acc, practice) => {
    acc[practice.practice] = (acc[practice.practice] || 0) + 1;
    return acc;
  }, {});
};

const usSecurityPractices = countSecurityPractices(usSample);
const indianSecurityPractices = countSecurityPractices(indianSample);

// Perform a two-sample t-test and calculate confidence interval
// Perform a two-sample t-test and calculate confidence interval manually
const performTTest = (usCounts, indianCounts) => {
  const usValues = Object.values(usCounts);
  const indianValues = Object.values(indianCounts);

  // Perform t-test
  const tTestResult = tTestTwoSample(usValues, indianValues, 0);

  // Calculate means
  const usMean = usValues.reduce((a, b) => a + b, 0) / usValues.length;
  const indianMean =
    indianValues.reduce((a, b) => a + b, 0) / indianValues.length;

  // Calculate standard deviations
  const usSD = Math.sqrt(
    usValues.reduce((a, b) => a + Math.pow(b - usMean, 2), 0) /
      (usValues.length - 1)
  );
  const indianSD = Math.sqrt(
    indianValues.reduce((a, b) => a + Math.pow(b - indianMean, 2), 0) /
      (indianValues.length - 1)
  );

  // Calculate standard error
  const standardError = Math.sqrt(
    (usSD * usSD) / usValues.length +
      (indianSD * indianSD) / indianValues.length
  );

  // Calculate confidence interval (using 1.96 for 95% confidence level)
  const marginOfError = 1.96 * standardError;
  const meanDifference = usMean - indianMean;
  const confidenceInterval = [
    meanDifference - marginOfError,
    meanDifference + marginOfError,
  ];

  return {
    tTestResult,
    confidenceInterval: confidenceInterval.map((v) => v.toFixed(2)),
  };
};
const performChiSquareTest = (usCounts, indianCounts) => {
  const usValues = Object.values(usCounts);
  const indianValues = Object.values(indianCounts);

  // Calculate means for comparison
  const usMean = usValues.reduce((a, b) => a + b, 0) / usValues.length;
  const indianMean =
    indianValues.reduce((a, b) => a + b, 0) / indianValues.length;

  // Calculate row and column totals
  const usTotal = usValues.reduce((a, b) => a + b, 0);
  const indianTotal = indianValues.reduce((a, b) => a + b, 0);
  const grandTotal = usTotal + indianTotal;

  // Calculate chi-square statistic
  let chiSquare = 0;
  const categories = Math.max(usValues.length, indianValues.length);

  for (let i = 0; i < categories; i++) {
    const observed1 = usValues[i] || 0;
    const observed2 = indianValues[i] || 0;

    // Calculate expected frequencies
    const expected1 = (usTotal * (observed1 + observed2)) / grandTotal;
    const expected2 = (indianTotal * (observed1 + observed2)) / grandTotal;

    // Add to chi-square statistic if expected frequency is not zero
    if (expected1 > 0) {
      chiSquare += Math.pow(observed1 - expected1, 2) / expected1;
    }
    if (expected2 > 0) {
      chiSquare += Math.pow(observed2 - expected2, 2) / expected2;
    }
  }

  // Calculate degrees of freedom
  const df = categories - 1;

  // Calculate p-value using chi-square distribution approximation
  const pValue = 1 - chiSquareCDF(chiSquare, df);

  // Determine which group collects more data
  const collectionComparison =
    usMean > indianMean
      ? "US apps collect more data"
      : "Indian apps collect more data";

  return {
    chiSquare: chiSquare.toFixed(4),
    pValue: pValue.toFixed(4),
    isSignificant: pValue < 0.05,
    comparison: collectionComparison,
    usMean: usMean.toFixed(2),
    indianMean: indianMean.toFixed(2),
  };
};

// Chi-square CDF approximation
const chiSquareCDF = (x, df) => {
  const gamma = (n) => {
    if (n === 1) return 1;
    if (n === 0.5) return Math.sqrt(Math.PI);
    return (n - 1) * gamma(n - 1);
  };

  const lowerGamma = (s, x) => {
    const steps = 1000;
    const h = x / steps;
    let sum = 0;

    for (let i = 0; i < steps; i++) {
      const t = i * h;
      sum += h * Math.pow(t, s - 1) * Math.exp(-t);
    }

    return sum;
  };

  return lowerGamma(df / 2, x / 2) / gamma(df / 2);
};
// Create a table comparing US and Indian data type counts
const createComparisonTable = (usCounts, indianCounts, title) => {
  const allTypes = new Set([
    ...Object.keys(usCounts),
    ...Object.keys(indianCounts),
  ]);
  let table = `${title}\n`;
  table += "-------------------------|----------------|------------------\n";
  table += "Type                     | US Count       | Indian Count\n";
  table += "-------------------------|----------------|------------------\n";
  allTypes.forEach((type) => {
    const usCount = usCounts[type] || 0;
    const indianCount = indianCounts[type] || 0;
    table += `${type.padEnd(25)} | ${usCount
      .toString()
      .padStart(14)} | ${indianCount.toString().padStart(16)}\n`;
  });
  const { chiSquare, pValue, isSignificant, comparison, usMean, indianMean } =
    performChiSquareTest(usCounts, indianCounts);
  table += `\nChi-Square Statistic: ${chiSquare}\n`;
  table += `P-Value: ${pValue}\n`;
  table += `Statistical Significance: ${
    isSignificant ? "Significant" : "Not significant"
  } at 95% confidence level\n`;
  table += `Mean Comparison: US (${usMean}) vs India (${indianMean})\n`;
  table += `Result: ${comparison}\n`;
  return table;
};

// Create a table for optionality counts
const createOptionalityTable = (usOptionality, indianOptionality) => {
  let table = "Optionality Comparison\n";
  table += "-------------------------|----------------|------------------\n";
  table += "Type                     | US Count       | Indian Count\n";
  table += "-------------------------|----------------|------------------\n";
  table += `Optional                | ${usOptionality.optional
    .toString()
    .padStart(14)} | ${indianOptionality.optional.toString().padStart(16)}\n`;
  table += `Required                | ${usOptionality.required
    .toString()
    .padStart(14)} | ${indianOptionality.required.toString().padStart(16)}\n`;
  const { chiSquare, pValue, isSignificant, comparison, usMean, indianMean } =
    performChiSquareTest(usOptionality, indianOptionality);
  table += `\nChi-Square Statistic: ${chiSquare}\n`;
  table += `P-Value: ${pValue}\n`;
  table += `Statistical Significance: ${
    isSignificant ? "Significant" : "Not significant"
  } at 95% confidence level\n`;
  table += `Mean Comparison: US (${usMean}) vs India (${indianMean})\n`;
  table += `Result: ${comparison}\n`;
  return table;
};

// Create a table for security practices counts
const createSecurityPracticesTable = (usCounts, indianCounts, title) => {
  const allPractices = new Set([
    ...Object.keys(usCounts),
    ...Object.keys(indianCounts),
  ]);
  let table = `${title}\n`;
  table += "-------------------------|----------------|------------------\n";
  table += "Practice                 | US Count       | Indian Count\n";
  table += "-------------------------|----------------|------------------\n";
  allPractices.forEach((practice) => {
    const usCount = usCounts[practice] || 0;
    const indianCount = indianCounts[practice] || 0;
    table += `${practice.padEnd(25)} | ${usCount
      .toString()
      .padStart(14)} | ${indianCount.toString().padStart(16)}\n`;
  });
  const { chiSquare, pValue, isSignificant, comparison, usMean, indianMean } =
    performChiSquareTest(usCounts, indianCounts);
  table += `\nChi-Square Statistic: ${chiSquare}\n`;
  table += `P-Value: ${pValue}\n`;
  table += `Statistical Significance: ${
    isSignificant ? "Significant" : "Not significant"
  } at 95% confidence level\n`;
  table += `Mean Comparison: US (${usMean}) vs India (${indianMean})\n`;
  table += `Result: ${comparison}\n`;
  return table;
};

// Count the number of apps in each dataset
const usAppCount = usSample.length;
const indianAppCount = indianSample.length;

const typeComparisonTable = createComparisonTable(
  usTypeCounts,
  indianTypeCounts,
  "Data Type Counts Comparison"
);
const purposeComparisonTable = createComparisonTable(
  usPurposeCounts,
  indianPurposeCounts,
  "Purpose Counts Comparison"
);
const datasComparisonTable = createComparisonTable(
  usDataCounts,
  indianDataCounts,
  "Data Counts Comparison"
);
const optionalityTable = createOptionalityTable(
  usOptionality,
  indianOptionality
);
const securityPracticesTable = createSecurityPracticesTable(
  usSecurityPractices,
  indianSecurityPractices,
  "Security Practices Comparison"
);

// Write the tables and app counts to a file
const appCounts = `App Counts\n----------\nUS Apps: ${usAppCount}\nIndian Apps: ${indianAppCount}\n\n`;

writeFileSync(
  "./dataComparison.txt",
  `${appCounts}${typeComparisonTable}\n\n${purposeComparisonTable}\n\n${optionalityTable}\n\n${securityPracticesTable}\n\n${datasComparisonTable}`
);

console.log(
  "Data comparison tables and app counts written to dataComparison.txt"
);

// Chart generation using QuickChart
const chart = new QuickChart();
chart.setConfig({
  type: "bar",
  data: {
    labels: ["Optional", "Required"],
    datasets: [
      {
        label: "US",
        data: [usOptionality.optional, usOptionality.required],
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "India",
        data: [indianOptionality.optional, indianOptionality.required],
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
chart.setWidth(800).setHeight(600).setBackgroundColor("white");

const chartUrl = chart.getUrl();
console.log(`Chart URL: ${chartUrl}`);

// Download the chart image
import fetch from "node-fetch";
const response = await fetch(chartUrl);
const buffer = await response.buffer();
writeFileSync("./optionalitiesChart.png", buffer);

console.log("Optionalities chart written to optionalitiesChart.png");
