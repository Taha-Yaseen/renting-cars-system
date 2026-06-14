export function formatNumber(value, locale = 'en', options = {}) {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return num.toLocaleString(locale, options)
}

export default formatNumber
