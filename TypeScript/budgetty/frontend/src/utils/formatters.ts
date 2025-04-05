/**
 * Format a number as currency with Euro symbol
 * @param value The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} €`;
}; 