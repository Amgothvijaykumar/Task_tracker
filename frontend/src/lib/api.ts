const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export function apiUrl(path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}
