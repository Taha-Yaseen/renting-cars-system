export function formatNumber(
  value: number | string | null | undefined,
  locale = 'en',
  options: Intl.NumberFormatOptions = {},
): string {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(locale, options)
}

export default formatNumber
