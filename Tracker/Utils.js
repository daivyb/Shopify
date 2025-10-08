// ================================= UTILITIES =================================

const Utils = {
  /**
   * Calculates the ISO week number for a given date.
   * @param {Date} date - The input date.
   * @returns {number} The ISO week number.
   */
  getISOWeekNumber: function(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  },

  /**
   * Adjusts a date to the next valid business start time (Mon-Fri, 8 AM).
   * @param {Date} date - The input date.
   * @returns {Date} The adjusted date.
   */
  adjustToBusinessStart: function(date) {
    const adjusted = new Date(date);
    const day = adjusted.getDay(); // Sunday = 0, Saturday = 6
    const hour = adjusted.getHours();

    if (day === 6) { // Saturday
      adjusted.setDate(adjusted.getDate() + 2);
      adjusted.setHours(8, 0, 0, 0);
    } else if (day === 0) { // Sunday
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(8, 0, 0, 0);
    } else if (day === 5 && hour >= 17) { // Friday after 5 PM
      adjusted.setDate(adjusted.getDate() + 3);
      adjusted.setHours(8, 0, 0, 0);
    } else if (hour < 8) { // Weekday before 8 AM
      adjusted.setHours(8,0,0,0);
    } else if (hour >= 17 && day >=1 && day <=4) { // Mon-Thu after 5 PM
      adjusted.setDate(adjusted.getDate() + 1);
      adjusted.setHours(8,0,0,0);
    }

    return adjusted;
  },
  
  /**
   * Generates a week string (e.g., Y25W01).
   * @param {Date} date - The input date.
   * @returns {string} The formatted week string.
   */
  getWeekString: function(date) {
    const yearShort = date.getFullYear() - 2000;
    const isoWeek = Utilities.formatString('%02d', this.getISOWeekNumber(date));
    return `Y${yearShort}W${isoWeek}`;
  },

  /**
   * Generates a month string (e.g., Y25M10).
   * @param {Date} date - The input date.
   * @returns {string} The formatted month string.
   */
  getMonthString: function(date) {
    const yearShort = date.getFullYear() - 2000;
    const month = Utilities.formatString('%02d', date.getMonth() + 1);
    return `Y${yearShort}M${month}`;
  }
};