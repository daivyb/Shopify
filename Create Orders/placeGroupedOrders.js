function processGroupedOrders() {
  const rows = getSheetData();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusOrderCol = headers.findIndex(h => h.toString().trim().replace(/\s+/g, '') === "StatusOrder") + 1;
  const orderCol = headers.findIndex(h => h.toString().trim().replace(/\s+/g, '') === "Order") + 1;

  if (statusOrderCol === 0 || orderCol === 0) {
    Logger.log("No se encontraron las columnas 'Status Order' u 'Order'.");
    return;
  }

  const grouped = {};

  rows.forEach(row => {
    const key = [
      row.EmailCustomer,
      row.FirstNameCustomer,
      row.LastNameCustomer,
      row.Address1,
      row.Address2,
      row.City,
      row.StateCode,
      row.countryCode,
      row.PostalCode,
      row.PhoneCustomer
    ].join("||");

    if (!grouped[key]) {
      grouped[key] = {
        email: row.EmailCustomer,
        phone: row.PhoneCustomer,
        address1: row.Address1,
        address2: row.Address2,
        city: row.City,
        province: row.StateCode,
        country: row.countryCode,
        zip: row.PostalCode,
        firstName: row.FirstNameCustomer,
        lastName: row.LastNameCustomer,
        company: row.Company,
        items: [],
        rowIndexes: []
      };
    }

    grouped[key].items.push({
      title: row.Product,
      quantity: Number(row.Quantity) || 1
    });
    grouped[key].rowIndexes.push(row.rowIndex);
  });

  Object.values(grouped).forEach(orderData => {
    const orderName = createOrder(orderData);
    if (orderName) {
      const itemNames = orderData.items.map(item => item.title).join(", ");
      Logger.log(`Orden ${orderName} creada con los siguientes items: ${itemNames}`);
      orderData.rowIndexes.forEach(rowIndex => {
        Logger.log(`Attempting to update row: ${rowIndex}, statusCol: ${statusOrderCol}, orderCol: ${orderCol}`);
        sheet.getRange(rowIndex, statusOrderCol).setValue("Created");
        sheet.getRange(rowIndex, orderCol).setValue(orderName);
      });
    }
  });
}
