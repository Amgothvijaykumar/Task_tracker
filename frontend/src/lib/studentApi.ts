import { apiUrl } from './api'
import { todayIST } from './adminApi'

export type ProgressStatus = 'unassigned' | 'assigned' | 'started' | 'completed' | 'skipped' | 'hidden'
export type StatusAction = 'assign' | 'start' | 'complete' | 'skip' | 'hide' | 'restore'
export type FeedView = 'feed' | 'hidden' | 'skipped'

export interface StudentTag {
  id: number
  name: string
  slug: string
}

export interface StudentProblem {
  id: number
  title: string
  source_url: string
  description: string | null
  difficulty: 'Easy' | 'Medium' | 'Hard'
  scheduled_date: string
  estimated_minutes: number | null
  publication_status: string
  tags: StudentTag[]
  my_status: ProgressStatus
  assigned_at: string | null
  started_at: string | null
  completed_at: string | null
  skipped_at: string | null
  hidden_at: string | null
  share_clicked_at: string | null
  share_draft: string | null
  available_actions: StatusAction[]
}

export interface HistoryItem {
  id: number
  problem_id: number
  problem_title: string
  problem_difficulty: string
  scheduled_date: string
  status: ProgressStatus
  completed_at: string | null
  updated_at: string
}

export interface StudentSummary {
  timezone: string
  today: string
  selected_date: string
  daily_goal: {
    target: number
    completed: number
    completions_today: number
    qualified: boolean
  }
  selected_day: {
    completions: number
    qualified: boolean
  }
  current_streak: number
  longest_streak: number
  streak_note: string
  qualified_dates: string[]
  history: HistoryItem[]
}

export interface StudentFeedResponse extends StudentSummary {
  view: FeedView
  problems: StudentProblem[]
  message?: string
}

async function studentFetch<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
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
    const message = body?.error || body?.action || body?.detail || 'Request failed'
    throw new Error(Array.isArray(message) ? message[0] : String(message))
  }

  return response.json()
}

export function fetchStudentFeed(
  token: string,
  date: string,
  view: FeedView = 'feed',
  difficulty?: string,
): Promise<StudentFeedResponse> {
  const params = new URLSearchParams({ date, view })
  if (difficulty) params.set('difficulty', difficulty)
  return studentFetch(`/student/feed/?${params.toString()}`, token)
}

export function updateProblemStatus(
  token: string,
  problemId: number,
  action: StatusAction,
): Promise<StudentProblem & { summary?: StudentSummary }> {
  return studentFetch(`/student/problems/${problemId}/status/`, token, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export function recordShareClick(token: string, problemId: number): Promise<StudentProblem> {
  return studentFetch(`/student/problems/${problemId}/share/`, token, { method: 'POST' })
}

export { todayIST }

export function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function progressStatusLabel(status: ProgressStatus): string {
  switch (status) {
    case 'unassigned': return 'Not started'
    case 'assigned': return 'Assigned'
    case 'started': return 'In progress'
    case 'completed': return 'Completed'
    case 'skipped': return 'Skipped'
    case 'hidden': return 'Hidden'
    default: return status
  }
}

export function progressStatusColor(status: ProgressStatus): string {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'started': return 'bg-blue-100 text-blue-800'
    case 'assigned': return 'bg-indigo-100 text-indigo-800'
    case 'skipped': return 'bg-yellow-100 text-yellow-800'
    case 'hidden': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export const LINKEDIN_FEED_URL = 'https://www.linkedin.com/feed/?shareActive=true'
