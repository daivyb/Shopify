function getSheetData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    Logger.log("La hoja tiene menos de 2 filas.");
    return [];
  }

  const headers = values[0].map(h => h.toString().trim().replace(/\s+/g, ''));

  const data = values.slice(1).map((row, index) => {
    let obj = { rowI1ndex: index + 2 };
    row.forEach((val, i) => {
      obj[headers[i]] = val.toString().trim();
    });
    return obj;
  });

  Logger.log(`Encontradas ${data.length} filas de datos.`);

  const filteredData = data.filter(r => {
    const status = (r.StatusOrder || "").toLowerCase();
    const match = status === "to create order";
    if (!match) {
      Logger.log(`Fila ${r.rowIndex}: StatusOrder es '${status}', no coincide.`);
    }
    return match;
  });

  Logger.log(`Encontradas ${filteredData.length} filas para procesar.`);
  return filteredData;
}