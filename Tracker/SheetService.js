// ================================= SHEET SERVICE =================================

const SheetService = {
  /**
   * Gets a sheet by name. If it doesn't exist, creates it and adds a header row.
   * @param {string} name - The name of the sheet.
   * @param {string[]} header - The header row to add if the sheet is new.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet object.
   */
  getSheet: function(name, header) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(header);
    }
    return sheet;
  },

  /**
   * Creates a map of thread IDs to their row index in the sheet.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to process.
   * @returns {Object} A map where keys are thread IDs and values are row indices.
   */
  getThreadIdMap: function(sheet) {
    const data = sheet.getDataRange().getValues();
    const threadIdMap = {};
    // Start at 1 to skip header
    for (let i = 1; i < data.length; i++) {
      // ID in the first column, remove leading quote
      const id = data[i][0].toString().replace("'","");
      if (id) {
        threadIdMap[id] = i;
      }
    }
    return threadIdMap;
  },

  /**
   * Updates an existing row or appends a new one if the thread ID is not found.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to modify.
   * @param {Object} threadIdMap - The map of thread IDs to row indices.
   * @param {string} threadId - The ID of the current thread.
   * @param {Array} rowData - The array of data to write.
   */
  updateOrAppendRow: function(sheet, threadIdMap, threadId, rowData) {
    if (threadId in threadIdMap) {
      const rowIndex = threadIdMap[threadId] + 1;
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
  },
  
  /**
   * Deletes multiple rows from a sheet.
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to modify.
   * @param {number[]} rowNumbers - An array of row numbers to delete.
   */
  deleteRows: function(sheet, rowNumbers) {
    // Sort descending to delete from the bottom up, avoiding index shifts.
    rowNumbers.sort((a, b) => b - a);
    for (const rowNum of rowNumbers) {
      sheet.deleteRow(rowNum);
    }
  }
};