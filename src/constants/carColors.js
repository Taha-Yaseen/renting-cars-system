/** @typedef {{ value: string, hex: string }} CarColorOption */

/** @type {CarColorOption[]} */
export const CAR_COLORS = [
  { value: 'white', hex: '#FFFFFF' },
  { value: 'black', hex: '#1A1A1A' },
  { value: 'silver', hex: '#C0C0C0' },
  { value: 'gray', hex: '#808080' },
  { value: 'red', hex: '#DC2626' },
  { value: 'blue', hex: '#2563EB' },
  { value: 'navy', hex: '#1E3A5F' },
  { value: 'green', hex: '#16A34A' },
  { value: 'brown', hex: '#78350F' },
  { value: 'beige', hex: '#D4C4A8' },
  { value: 'gold', hex: '#CA8A04' },
  { value: 'orange', hex: '#EA580C' },
  { value: 'yellow', hex: '#EAB308' },
  { value: 'burgundy', hex: '#7F1D1D' },
  { value: 'purple', hex: '#7C3AED' },
]

/** @param {string} value */
export function getCarColorHex(value) {
  return CAR_COLORS.find((c) => c.value === value)?.hex ?? '#808080'
}
