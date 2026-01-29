export function safeReplaceState(nextUrl: string, context: string): boolean {
  try {
    window.history.replaceState({}, '', nextUrl)
    return true
  } catch (error) {
    console.warn(`Failed to update URL (${context})`, error)
    return false
  }
}
