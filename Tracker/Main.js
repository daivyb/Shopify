// ================================= MAIN SYNC FUNCTION =================================

/**
 * Performs a full synchronization of the tracker sheet with Gmail.
 * - Creates rows for new threads.
 * - Updates rows for existing threads.
 * - Deletes rows for threads that no longer have the required labels.
 */
function syncInboundTracker() {
  Logger.log('Starting full sync...');

  // 1. Get all threads from Gmail that currently have the labels.
  const query = `(${CONFIG.LABELS_TO_QUERY.join(' OR ')}) ${CONFIG.SEARCH_QUERY_AFTER}`;
  const threadsFromGmail = GmailService.searchThreads(query);
  const validGmailIds = new Set(threadsFromGmail.map(t => t.getId()));
  Logger.log(`${validGmailIds.size} valid threads found in Gmail.`);

  // 2. Get current data from the sheet.
  const sheet = SheetService.getSheet(CONFIG.SHEET_NAME, CONFIG.HEADER_ROW);
  const threadIdMap = SheetService.getThreadIdMap(sheet); // Gets {id: rowIndex}
  const sheetIds = new Set(Object.keys(threadIdMap));
  Logger.log(`${sheetIds.size} threads found in the sheet.`);

  // 3. PHASE 1: UPDATE AND CREATE
  Logger.log('Starting Phase 1: Update/Create...');
  for (const thread of threadsFromGmail) {
    const threadData = GmailService.processThread(thread, CONFIG.CX_EMAIL);
    // This service function already handles the logic of updating if the ID is in the map, or appending if it's not.
    SheetService.updateOrAppendRow(sheet, threadIdMap, threadData.id, threadData.rowData);
  }
  Logger.log('Phase 1 complete.');

  // 4. PHASE 2: DELETE
  Logger.log('Starting Phase 2: Delete...');
  const rowsToDelete = [];
  for (const sheetId of sheetIds) {
    if (!validGmailIds.has(sheetId)) {
      // The ID is in the sheet but not in the valid Gmail list. Mark for deletion.
      const rowIndex = threadIdMap[sheetId] + 1; // Get the actual row number
      rowsToDelete.push(rowIndex);
    }
  }

  if (rowsToDelete.length > 0) {
    Logger.log(`Found ${rowsToDelete.length} rows to delete.`);
    SheetService.deleteRows(sheet, rowsToDelete); // This service handles reverse-order deletion.
    Logger.log(`${rowsToDelete.length} stale row(s) successfully deleted.`);
  } else {
    Logger.log('No stale rows found to delete.');
  }
  Logger.log('Phase 2 complete.');
  Logger.log('Full sync finished.');
}


// ================================= LOCKING & TRIGGER =================================

/**
 * Executes a function safely, ensuring only one instance modifies the spreadsheet at a time.
 * @param {function} targetFunction The function to execute (e.g., syncInboundTracker).
 */
function executeWithLock(targetFunction) {
  const lock = LockService.getDocumentLock();
  const hasLock = lock.waitLock(120000); // 2-minute timeout
  
  if (hasLock) {
    try {
      Logger.log('Lock acquired. Executing: ' + targetFunction.name);
      targetFunction();
    } catch (e) {
      Logger.log('An error occurred during locked execution: ' + e.toString());
    } finally {
      lock.releaseLock();
      Logger.log('Lock released.');
    }
  } else {
    Logger.log('Could not acquire lock. Another execution is likely in progress.');
  }
}

// --- NEW FUNCTION FOR THE TRIGGER ---
// This is the only function you need to set in your trigger.

function runSyncWithLock() {
  executeWithLock(syncInboundTracker);
}