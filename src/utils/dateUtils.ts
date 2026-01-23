/**
 * Check if a date is within the current week
 * @param dateString - Date string to check
 * @returns true if date is in current week, false otherwise
 */
export function isCurrentWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const currentDate = new Date();
  
  // Get start of current week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get end of current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * Checks if a date string is within the current month
 * @param dateString - Date string to check
 * @returns true if date is in current month, false otherwise
 */
export function isCurrentMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const currentDate = new Date();
  
  return !isNaN(date.getTime()) && 
         date.getMonth() === currentDate.getMonth() && 
         date.getFullYear() === currentDate.getFullYear();
}
