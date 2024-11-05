import { readFileSync, writeFileSync } from "fs";
import QuickChart from "quickchart-js";

// Read and parse the JSON files for each country
const usData = JSON.parse(readFileSync("./apps/USApps.json", "utf8"));
const indianData = JSON.parse(readFileSync("./apps/IndianApps.json", "utf8"));

// Extract collected and shared data for each app
const usCollectedData = usData.flatMap(
  (app) => app.datasafety.collectedData || []
);
const usSharedData = usData.flatMap((app) => app.datasafety.sharedData || []);
const indianCollectedData = indianData.flatMap(
  (app) => app.datasafety.collectedData || []
);
const indianSharedData = indianData.flatMap(
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
  const count = data.reduce((acc, item) => {
    acc[item.optional ? "optional" : "required"] =
      (acc[item.optional ? "optional" : "required"] || 0) + 1;
    return acc;
  }, {});

  const total = count.optional + count.required;
  return {
    optional: (((count.optional || 0) / total) * 100).toFixed(2),
    required: (((count.required || 0) / total) * 100).toFixed(2),
  };
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

const usSecurityPractices = countSecurityPractices(usData);
const indianSecurityPractices = countSecurityPractices(indianData);

// Create a table comparing US and Indian data type counts
const createComparisonTable = (
  usCounts,
  indianCounts,
  usTotal,
  indianTotal,
  title
) => {
  const allTypes = new Set([
    ...Object.keys(usCounts),
    ...Object.keys(indianCounts),
  ]);
  let table = `${title}\n`;
  table += "-------------------------|----------------|------------------\n";
  table += "Type                     | US Percentage  | Indian Percentage\n";
  table += "-------------------------|----------------|------------------\n";
  allTypes.forEach((type) => {
    const usPercentage = (((usCounts[type] || 0) / usTotal) * 100).toFixed(2);
    const indianPercentage = (
      ((indianCounts[type] || 0) / indianTotal) *
      100
    ).toFixed(2);
    table += `${type.padEnd(25)} | ${usPercentage.padStart(
      14
    )}% | ${indianPercentage.padStart(16)}%\n`;
  });
  return table;
};

// Create a table for optionality percentages
const createOptionalityTable = (usOptionality, indianOptionality) => {
  let table = "Optionality Comparison\n";
  table += "-------------------------|----------------|------------------\n";
  table += "Type                     | US Percentage  | Indian Percentage\n";
  table += "-------------------------|----------------|------------------\n";
  table += `Optional                | ${usOptionality.optional.padStart(
    14
  )}% | ${indianOptionality.optional.padStart(16)}%\n`;
  table += `Required                | ${usOptionality.required.padStart(
    14
  )}% | ${indianOptionality.required.padStart(16)}%\n`;
  return table;
};

// Create a table for security practices counts
const createSecurityPracticesTable = (
  usCounts,
  indianCounts,
  usTotal,
  indianTotal
) => {
  const allPractices = new Set([
    ...Object.keys(usCounts),
    ...Object.keys(indianCounts),
  ]);
  let table = "Security Practices Comparison\n";
  table += "-------------------------|----------------|------------------\n";
  table += "Practice                 | US Percentage  | Indian Percentage\n";
  table += "-------------------------|----------------|------------------\n";
  allPractices.forEach((practice) => {
    const usPercentage = (((usCounts[practice] || 0) / usTotal) * 100).toFixed(
      2
    );
    const indianPercentage = (
      ((indianCounts[practice] || 0) / indianTotal) *
      100
    ).toFixed(2);
    table += `${practice.padEnd(25)} | ${usPercentage.padStart(
      14
    )}% | ${indianPercentage.padStart(16)}%\n`;
  });
  return table;
};

// Count the number of apps in each dataset
const usAppCount = usData.length;
const indianAppCount = indianData.length;

const typeComparisonTable = createComparisonTable(
  usTypeCounts,
  indianTypeCounts,
  usAppCount,
  indianAppCount,
  "Data Type Counts Comparison"
);
const purposeComparisonTable = createComparisonTable(
  usPurposeCounts,
  indianPurposeCounts,
  usAppCount,
  indianAppCount,
  "Purpose Counts Comparison"
);
const optionalityTable = createOptionalityTable(
  usOptionality,
  indianOptionality
);
const securityPracticesTable = createSecurityPracticesTable(
  usSecurityPractices,
  indianSecurityPractices,
  usAppCount,
  indianAppCount
);

// Write the tables and app counts to a file
const appCounts = `App Counts\n----------\nUS Apps: ${usAppCount}\nIndian Apps: ${indianAppCount}\n\n`;

writeFileSync(
  "./dataComparison.txt",
  `${appCounts}${typeComparisonTable}\n\n${purposeComparisonTable}\n\n${optionalityTable}\n\n${securityPracticesTable}`
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
