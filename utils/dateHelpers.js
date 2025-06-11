// utils/dateHelpers.js

/**
 * Formats an ISO date string into a display-friendly short weekday, short month, day format.
 * E.g., "2023-10-26T10:00:00Z" becomes "Mon, Oct 26"
 * @param {string} isoDateString The ISO date string to format.
 * @returns {string} The formatted date string.
 */
export const formatDateForPicker = (isoDateString) => {
  if (!isoDateString) {
    return ''; // Handle cases where isoDateString might be null or undefined
  }
  const date = new Date(isoDateString);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

// You can add more date utility functions here in the future