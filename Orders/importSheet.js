function writeOrdersToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Orders");

  if (!sheet) {
    sheet = ss.insertSheet("Orders");
  }

  // Encabezados
  if (sheet.getLastRow() === 0) {
    const headers = [
      "OrderName",
      "OrderID",
      "Channel",
      "Email",
      "Tags",
      "CreatedAt",
      "UpdatedAt",
      "ClosedAt",
      "CancelledAt",
      "StatusPageUrl",
      "FulfillmentStatus",
      "FinancialStatus",
      "totalRefunded",
      // Fulfillment 1
      "InTransitAt",
      "Carrier",
      "TrackingNumber",
      "TrackingURL",
      "Location",
      // // Fulfillment 2
      // "InTransitAt",
      // "Carrier",
      // "TrackingNumber",
      // "TrackingURL",
      // "Location",
      "Company",
      "ShipName",
      "Phone",
      "Country",
      "CountryCode",
      "Province",
      "ProvinceCode",
      "City",
      "ZIP",
      "SubTotalPrice",
      "TotalDiscount",
      "TotalShipping",
      "TotalPrice",
      "LineItemSKU",
      "LineItemTitle",
      "LineItemQuantity",
      "CurrentQuantity",
      "UnfulfilledQuantity",
      "OriginalUnitPrice",
      "OriginalTotal",
      "DiscountedUnitPrice",
      "DiscountedTotal",
      "VariantID"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  let cursor = getOrdersCursor() || null;
  let hasNextPage = true;

  while (hasNextPage) {
    // Traer una página de órdenes
    const ordersData = fetchOrdersWithLineItems(cursor);
    if (!ordersData || ordersData.length === 0) break;

    const rows = getOrdersForSheet(ordersData);

    if (rows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
      Logger.log(`${rows.length} filas añadidas a la hoja 'Orders'.`);
    }

    // Actualizar cursor para la siguiente página
    const lastOrder = ordersData[ordersData.length - 1];
    cursor = lastOrder.cursor;
    hasNextPage = !!cursor;
    if (cursor) { setOrdersCursor(cursor)}
  }
}

