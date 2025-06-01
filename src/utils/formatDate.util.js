/**
 * Format a date using a customizable format string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string (e.g., 'MMMM DD, YYYY')
 * @returns {string} - Formatted date string
 */
const formatDate = (date, format = 'MMMM DD, YYYY') => {
  if (!date) {
    return '';
  }
  
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  // Pad with leading zero if needed
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  
  // Replace format tokens
  return format
    .replace('YYYY', year)
    .replace('YY', String(year).slice(2))
    .replace('MMMM', months[month])
    .replace('MMM', shortMonths[month])
    .replace('MM', padZero(month + 1))
    .replace('M', month + 1)
    .replace('DDDD', days[dayOfWeek])
    .replace('DDD', shortDays[dayOfWeek])
    .replace('DD', padZero(day))
    .replace('D', day)
    .replace('hh', padZero(hour12))
    .replace('h', hour12)
    .replace('HH', padZero(hours))
    .replace('H', hours)
    .replace('mm', padZero(minutes))
    .replace('m', minutes)
    .replace('ss', padZero(seconds))
    .replace('s', seconds)
    .replace('A', ampm)
    .replace('a', ampm.toLowerCase());
};

/**
 * Format a date as a relative time string (e.g., "5 minutes ago")
 * @param {Date|string} date - Date to format
 * @returns {string} - Relative time string
 */
const formatRelativeTime = (date) => {
  if (!date) {
    return '';
  }
  
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffSec < 60) {
    return diffSec < 10 ? 'just now' : `${diffSec} seconds ago`;
  } else if (diffMin < 60) {
    return diffMin === 1 ? 'a minute ago' : `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return diffHour === 1 ? 'an hour ago' : `${diffHour} hours ago`;
  } else if (diffDay < 30) {
    return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
  } else if (diffMonth < 12) {
    return diffMonth === 1 ? 'a month ago' : `${diffMonth} months ago`;
  } else {
    return diffYear === 1 ? 'a year ago' : `${diffYear} years ago`;
  }
};

module.exports = {
  formatDate,
  formatRelativeTime,
}; 