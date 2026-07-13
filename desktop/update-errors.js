export function formatUpdateError(error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Unable to find latest version') || message.includes('/releases/latest')) {
    return 'No published companion update is available yet.'
  }
  return 'Could not check for updates. Try again later.'
}
