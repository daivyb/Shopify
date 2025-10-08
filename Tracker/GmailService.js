// ================================= GMAIL SERVICE =================================

const GmailService = {
  /**
   * Searches Gmail for threads matching a query and returns them.
   * @param {string} query - The Gmail search query.
   * @returns {GoogleAppsScript.Gmail.GmailThread[]} An array of threads.
   */
  searchThreads: function(query) {
    let allThreads = [];
    let start = 0;
    const max = 500;
    let batch;

    do {
      batch = GmailApp.search(query, start, max);
      allThreads = allThreads.concat(batch);
      start += max;
    } while (batch.length === max);

    return allThreads.reverse();
  },

  /**
   * Processes a single Gmail thread to extract all necessary tracking data.
   * @param {GoogleAppsScript.Gmail.GmailThread} thread - The thread to process.
   * @param {string} cxEmail - The customer experience email for response time calculation.
   * @returns {object} An object containing the thread ID and the formatted rowData array.
   */
  processThread: function(thread, cxEmail) {
    const messages = thread.getMessages();
    const threadId = thread.getId().toString();

    const originalFirstDate = messages[0].getDate();
    const firstMessageDate = Utils.adjustToBusinessStart(originalFirstDate);
    const lastMessageDate = messages[messages.length - 1].getDate();

    const labelArray = thread.getLabels();
    const labelNames = labelArray.map(label => label.getName()).filter(name => name !== 'Tracker');

    // Extract category and subcategory
    let category = ' ', subcategory = ' ';
    const inquiryOrComplaintLabel = labelNames.find(l => l.startsWith('Inquiry/') || l.startsWith('Complaint/'));
    if (inquiryOrComplaintLabel) {
      const parts = inquiryOrComplaintLabel.split('/');
      category = parts[0];
      subcategory = parts.slice(1).join('/');
    }

    // Extract outcome
    let outcome = ' ';
    const outcomeLabel = labelNames.find(l => l.startsWith('Outcome/'));
    if (outcomeLabel) {
      outcome = outcomeLabel.replace('Outcome/', '');
    }
    
    // Calculate CX Response Time
    const cxResponseTime = this.calculateCxResponseTime(messages, firstMessageDate, cxEmail);

    const rowData = [
      "'" + threadId,
      thread.getFirstMessageSubject() ?? '',
      firstMessageDate,
      lastMessageDate,
      messages.length > 1 ? (messages[1].getDate() - firstMessageDate) / (1000 * 60 * 60) : '-',
      messages.length,
      messages[0].getFrom(),
      `https://mail.google.com/mail/u/0/#inbox/${threadId}`,
      labelNames.join(', ') || ' ',
      category,
      subcategory,
      outcome,
      labelNames.includes('Pending') ? 1 : 0,
      Utils.getWeekString(firstMessageDate),
      Utils.getMonthString(firstMessageDate),
      Utilities.formatDate(firstMessageDate, Session.getScriptTimeZone(), 'MM/dd/yyyy'),
      cxResponseTime.time,
      cxResponseTime.group
    ];

    return { id: threadId, rowData: rowData };
  },

  /**
   * Calculates the CX response time and its corresponding group.
   * @param {GoogleAppsScript.Gmail.GmailMessage[]} messages - The messages in the thread.
   * @param {Date} firstMessageDate - The adjusted start date of the thread.
   * @param {string} cxEmail - The CX team's email address.
   * @returns {{time: (number|string), group: string}}
   */
  calculateCxResponseTime: function(messages, firstMessageDate, cxEmail) {
    let cxResponseDate = null;
    for (let m = 1; m < messages.length; m++) {
      if (messages[m].getFrom().toLowerCase().includes(cxEmail.toLowerCase())) {
        cxResponseDate = messages[m].getDate();
        break;
      }
    }

    if (!cxResponseDate) return { time: '-', group: '-' };

    const cxResponseTimeHours = (cxResponseDate - firstMessageDate) / (1000 * 60 * 60);
    let group = '>48';
    if (cxResponseTimeHours < 24) {
      group = '<24';
    } else if (cxResponseTimeHours <= 48) {
      group = '24-48';
    }
    return { time: cxResponseTimeHours, group: group };
  },
  
  /**
   * Checks if a thread has at least one of the required labels.
   * @param {string} threadId - The ID of the thread to check.
   * @param {string[]} requiredLabelPrefixes - An array of label prefixes to look for.
   * @returns {boolean} True if the thread has a required label, false otherwise.
   */
  threadHasRequiredLabels: function(threadId, requiredLabelPrefixes) {
    try {
      const thread = GmailApp.getThreadById(threadId);
      if (!thread) return false; // Treat permanently deleted threads as not having the labels.

      const labels = thread.getLabels();
      return labels.some(label => {
        const labelName = label.getName();
        return requiredLabelPrefixes.some(prefix => labelName.startsWith(prefix));
      });
    } catch (e) {
      Logger.log(`Error checking labels for thread ID ${threadId}: ${e.message}`);
      return true; // Assume it has the labels to prevent accidental deletion on error.
    }
  }
};