/** Extract service names from appointment notes (booking / create modal). */
export function parseServicesFromNotes(
  notes: string | null | undefined,
  primaryService: string
): string[] {
  if (!notes?.trim()) return [primaryService]

  const bgMatch = notes.match(/Услуги:\s*(.+?)(?:\n\n|$)/)
  const enMatch = notes.match(/Services:\s*(.+?)(?:\n\n|$)/i)
  const match = bgMatch ?? enMatch

  if (match?.[1]) {
    const names = match[1].split(',').map((s) => s.trim()).filter(Boolean)
    if (names.length > 0) return names
  }

  return [primaryService]
}
