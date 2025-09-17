# Create Shopify Orders from Google Sheet

## Overview

This Google Apps Script automates the process of creating Shopify orders directly from a Google Sheet. It reads order data from the sheet, groups items for the same customer into a single order, creates the order in Shopify via the GraphQL API, and then updates the sheet with the order status and the newly created order number.

## Features

- Reads order data from the active Google Sheet.
- Groups multiple products for the same customer into a single order.
- Creates orders in Shopify with customer information, products, and shipping details.
- Updates the Google Sheet with the order status ("Created") and the Shopify order number.
- Uses fixed tags "cx" and "Samples" for created orders.

## Setup

### 1. Script Properties

You need to set the following script properties:

- `SHOP_URL`: Your Shopify store's GraphQL API URL (e.g., `https://your-store.myshopify.com/admin/api/2024-04/graphql.json`).
- `ACCESS_TOKEN`: Your Shopify Admin API access token with `write_orders` scope.

To set these properties:

1.  Open the Apps Script editor.
2.  Go to **Project Settings** (the gear icon on the left).
3.  Under **Script Properties**, click **Add script property**.
4.  Add the two properties and their corresponding values.

### 2. Google Sheet Headers

Your Google Sheet must have the following headers:

- `First Name Customer`
- `Last Name Customer`
- `Phone Customer`
- `Email Customer`
- `Address 1`
- `Address 2`
- `City`
- `State Code`
- `Postal Code`
- `countryCode`
- `Company`
- `Product`
- `Quantity`
- `Status Order`
- `Order`

## Workflow

1.  The script is executed by running the `createOrders` function in `Code.js`.
2.  It reads all the data from the currently active sheet.
3.  It filters the rows, keeping only those where the `Status Order` column has the value "Need to Ship".
4.  It groups the filtered rows based on customer information.
5.  For each group, it calls the Shopify API to create a new order.
6.  If the order is created successfully:
    - The `Status Order` column for the corresponding rows in the sheet is updated to "Created".
    - The `Order` column is updated with the Shopify order number (e.g., #1001).

## File Descriptions

- **`Code.js`**: The main file that triggers the order creation processs.
- **`sheetRead.js`**: Handles reading and parsing the data from the Google Sheet.
- **`placeGroupedOrders.js`**: Contains the logic for grouping orders and updating the sheet after creation.
- **`createOrder.js`**: Responsible for making the API call to Shopify to create a single order.
- **`getVariantID.js`**: A helper function to retrieve the Shopify variant ID for a given product title.
- **`getPropertiesService.js`**: A helper function to get the script properties (`SHOP_URL` and `ACCESS_TOKEN`).
