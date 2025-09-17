function getSheetData() {
  // Obtener hoja activa
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) return [];

  // Encabezados
  const headers = values[0].map(h => h.toString().trim().replace(/\s+/g, ''));

  // Convertir filas a objetos
  const data = values.slice(1).map(row => {
    let obj = {};
    row.forEach((val, i) => {obj[headers[i]] = val.toString().trim();});

     // Separar Name en FirstName y LastName si existe
    if (obj.Name) {
      const parts = obj.Name.split(" ");
      obj.FirstName = parts.shift(); // Primera palabra
      obj.LastName = parts.join(" "); // Resto del nombre
    }

    return obj;
  });

  // Filtrar solo filas que tengan Status = "Need to Ship"
     return data.filter(r => (r.Status || "").toLowerCase() === "need to ship");

}

// function testGetSheetData() {
//   const data = getSheetData();
//   Logger.log("Filas encontradas: " + data.length);
//   data.forEach((fila, index) => {
//     Logger.log(`Fila ${index + 1}: ${JSON.stringify(fila)}`);
//   });
// }
