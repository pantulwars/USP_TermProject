## Project Overview

This project aims to categorize Android apps from the Google Play Store into two groups: Indian apps and US apps. It fetches app details and data safety labels, determines the developer’s country based on the developer’s address, and collects data until it reaches MAX_APPS_PER_COUNTRY (1,000 or anything that is set in usp.js) apps for each country or the dataset list ends. The data is then stored in JSON files for further analysis.

## Table of Contents

	•	Project Overview
	•	Features
	•	Prerequisites
	•	Installation
	•	File Descriptions
	•	Usage
	•	1. Filter the CSV File
	•	2. Process Indian Pincodes
	•	3. Process US Zip Codes
	•	4. Fetch App Data and Categorize Apps
	•	Configuration
	•	Notes
	•	Contributing

## Features

	•	Extracts app IDs and names from a CSV file.
	•	Fetches app details and data safety labels using the Google Play Store API.
	•	Determines the developer’s country by analyzing the developer’s address.
	•	Categorizes apps into Indian and US apps based on the developer’s country.
	•	Stores the categorized data in JSON files.

## Prerequisites

	•	Node.js (version 14 or higher)
	•	npm (Node Package Manager)

## Installation

1.	Clone the repository or download the files:
	
		git clone https://github.com/pantulwars/USP_TermProject
		cd yourproject

2.	Install the required dependencies:
		npm install

This will install the following packages:
	•	csv-parser
	•	csv-writer
	•	google-play-scraper
        refer this github repo for this library: https://github.com/facundoolano/google-play-scraper

3.	Create a directory by name "Dataset" inside the project directory and ensure the following CSV files are present in it:
		Google-Playstore 2.csv
        download this dataset from: https://www.kaggle.com/datasets/gauthamp10/google-playstore-apps/data
	•	India_pincode.csv
        download this dataset from: https://www.kaggle.com/datasets/kdsharmaai/india-pinzip-code-city-area-district-state
	•	list_of_real_usa_addresses.csv
        download this dataset from: https://www.kaggle.com/datasets/ahmedshahriarsakib/list-of-real-usa-addresses

## File Descriptions

	•	filterCsv.js: Script to filter out unnecessary columns from Google-Playstore 2.csv, keeping only “App Name” and “App Id”, and save the result as Filtered-Google-Playstore.csv.
	•	Filtered-Google-Playstore.csv: The filtered CSV file containing only the “App Name” and “App Id” columns.
	•	Google-Playstore 2.csv: Original CSV file containing app data with multiple columns.
	•	India_pincode.csv: CSV file containing Indian cities, areas, pincodes, districts, and states.
	•	list_of_real_usa_addresses.csv: CSV file containing US addresses, cities, states, and zip codes.
	•	processIndiaPincodes.js: Script to process India_pincode.csv and generate lists of unique Indian states, cities, and pincodes.
	•	processUSZips.js: Script to process list_of_real_usa_addresses.csv and generate lists of unique US states, cities, and zip codes.
	•	usp.js: Main script that reads app IDs from Filtered-Google-Playstore.csv, fetches app data, determines the developer’s country, and categorizes apps into Indian and US apps.
	•	indian_apps.json: JSON file containing data of Indian apps.
	•	us_apps.json: JSON file containing data of US apps.
	•	README.md: Documentation file for the project.

## Usage

1. Filter the CSV File

First, you need to filter the original CSV file to keep only the necessary columns.

node filterCsv.js

This will read ./Dataset/Google-Playstore 2.csv and create ./Dataset/Filtered-Google-Playstore.csv with only “App Name” and “App Id” columns.

2. Process Indian Pincodes

Process the Indian pincodes to generate lists of states, cities, and pincodes.

node processIndiaPincodes.js

This script reads India_pincode.csv and generates internal lists used by usp.js. It does not produce an output file but is essential for the main script.

3. Process US Zip Codes

Process the US zip codes to generate lists of states, cities, and zip codes.

node processUSZips.js

This script reads list_of_real_usa_addresses.csv and generates internal lists used by usp.js. It does not produce an output file but is essential for the main script.

4. Fetch App Data and Categorize Apps

Run the main script to fetch app data, determine the developer’s country, and categorize apps.

node usp.js

This script will:

	•	Read app IDs and names from ./Dataset/Filtered-Google-Playstore.csv.
	•	Fetch app details and data safety labels from the Google Play Store.
	•	Determine the developer’s country by analyzing the developer’s address.
	•	Categorize apps into Indian and US apps.
	•	Write the categorized data to ./apps/indian_apps.json and ./apps/us_apps.json.

The script will process up to MAX_APPS_PER_COUNTRY (1,000 or anything that is set in usp.js) apps per country by default.

## Configuration

Adjusting the Maximum Number of Apps

The maximum number of apps per country is defined as a constant in usp.js:

const MAX_APPS_PER_COUNTRY = 1000;

To change the limit, edit usp.js and modify the value of MAX_APPS_PER_COUNTRY:

const MAX_APPS_PER_COUNTRY = 500; // Example: Limit to 500 apps per country

## Notes

	•	Data Sources:
	•	Ensure that India_pincode.csv and list_of_real_usa_addresses.csv contain accurate and up-to-date data.
	•	The app data is fetched from the Google Play Store using the google-play-scraper package.
	•	Error Handling:
	•	The scripts include basic error handling. Errors encountered during data fetching will be logged, and the script will continue processing the next app.
	
## Contributing

Contribute to this project, please follow these steps:

1.	Fork the repository.
2.	Create a new branch for your feature or bugfix.
3.	Commit your changes with clear messages.
4.	Push your branch to your forked repository.
5.	Open a pull request to the main repository.

