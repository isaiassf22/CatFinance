/**
 * Format integer amount in cents to Brazilian Real (BRL) string.
 * Example: 180050 -> "R$ 1.800,50"
 */
export function formatCentsToBRL(cents: number): string {
  if (isNaN(cents)) return 'R$ 0,00';
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Format integer amount in cents to numerical BRL string without symbol.
 * Example: 180050 -> "1.800,50"
 */
export function formatCentsToNumberString(cents: number): string {
  if (isNaN(cents)) return '0,00';
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais);
}

/**
 * Parse input string or decimal number to exact integer cents.
 * Handles "1.800,50", "1800,50", "1800.50", "1800"
 * Example: "1.800,50" -> 180050
 */
export function parseBRLToCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  if (!value) return 0;

  // Remove currency symbol and spaces
  const cleanStr = value.replace(/[R$\s]/g, '').trim();

  // If format uses comma as decimal separator
  if (cleanStr.includes(',')) {
    const withoutThousands = cleanStr.replace(/\./g, '');
    const normalized = withoutThousands.replace(',', '.');
    const parsedFloat = parseFloat(normalized);
    return isNaN(parsedFloat) ? 0 : Math.round(parsedFloat * 100);
  }

  const parsedFloat = parseFloat(cleanStr);
  return isNaN(parsedFloat) ? 0 : Math.round(parsedFloat * 100);
}

/**
 * Month names in Portuguese (1-indexed)
 */
export const MONTH_NAMES: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export function getMonthName(monthNumber: number): string {
  return MONTH_NAMES[monthNumber] || `Mês ${monthNumber}`;
}

/**
 * Format pure date string "YYYY-MM-DD" to Brazilian display "DD/MM/YYYY"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

/**
 * Get today's date formatted as pure "YYYY-MM-DD"
 */
export function getTodayYYYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
