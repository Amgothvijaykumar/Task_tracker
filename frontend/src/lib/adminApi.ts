import { apiUrl } from './api'

export interface ProblemStats {
  assigned: number
  started: number
  completed: number
  skipped: number
  hidden: number
  share_clicks: number
  total: number
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface AdminProblem {
  id: number
  title: string
  source_url: string
  description: string | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
  scheduled_date: string
  estimated_minutes: number | null
  publication_status: 'draft' | 'published' | 'archived'
  tags: Tag[]
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
  stats: ProblemStats
}

export interface ProblemFormData {
  title: string
  source_url: string
  description?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  scheduled_date: string
  estimated_minutes?: number | null
  publication_status: 'draft' | 'published' | 'archived'
  tag_names?: string[]
}

export interface InactiveStudent {
  id: string
  name: string
  email: string
}

export interface TrendDay {
  date: string
  completions: number
  active_students: number
}

export interface AdminAnalytics {
  selected_date: string
  timezone: string
  total_students: number
  active_students: number
  completions: number
  completion_rate: number
  share_clicks: number
  inactive_students: InactiveStudent[]
  recent_problems: AdminProblem[]
  trends: TrendDay[]
}

export interface StudentActivity {
  id: string
  name: string
  email: string
  status: string
  today_completions: number
  current_streak: number
  longest_streak: number
  last_completion: string | null
}

export interface ProblemFilters {
  scheduled_date?: string
  status?: string
  difficulty?: string
  tag?: string
}

async function adminFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.error || body?.detail || Object.values(body || {})[0] || 'Request failed'
    throw new Error(Array.isArray(message) ? message[0] : String(message))
  }

  return response.json()
}

export function fetchAdminAnalytics(token: string, date?: string): Promise<AdminAnalytics> {
  const params = date ? `?date=${date}` : ''
  return adminFetch(`/admin/analytics/${params}`, token)
}

export function fetchAdminStudents(token: string, date?: string, search?: string): Promise<{ selected_date: string; students: StudentActivity[] }> {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (search) params.set('search', search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return adminFetch(`/admin/students/${qs}`, token)
}

export function fetchAdminProblems(token: string, filters: ProblemFilters = {}): Promise<AdminProblem[]> {
  const params = new URLSearchParams()
  if (filters.scheduled_date) params.set('scheduled_date', filters.scheduled_date)
  if (filters.status) params.set('status', filters.status)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.tag) params.set('tag', filters.tag)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return adminFetch(`/admin/problems/${qs}`, token)
}

export function fetchAdminTags(token: string): Promise<Tag[]> {
  return adminFetch('/admin/tags/', token)
}

export function createProblem(token: string, data: ProblemFormData): Promise<AdminProblem> {
  return adminFetch('/admin/problems/', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateProblem(token: string, id: number, data: Partial<ProblemFormData>): Promise<AdminProblem> {
  return adminFetch(`/admin/problems/${id}/`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function publishProblem(token: string, id: number): Promise<AdminProblem> {
  return adminFetch(`/admin/problems/${id}/publish/`, token, { method: 'POST' })
}

export function unpublishProblem(token: string, id: number): Promise<AdminProblem> {
  return adminFetch(`/admin/problems/${id}/unpublish/`, token, { method: 'POST' })
}

export function archiveProblem(token: string, id: number): Promise<AdminProblem> {
  return adminFetch(`/admin/problems/${id}/archive/`, token, { method: 'POST' })
}

export function todayIST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-800'
    case 'Medium': return 'bg-yellow-100 text-yellow-800'
    case 'Hard': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800'
    case 'draft': return 'bg-gray-100 text-gray-800'
    case 'archived': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
