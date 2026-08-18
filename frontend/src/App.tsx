import { useEffect, useState } from 'react'
import { apiUrl } from './lib/api'

type HealthResponse = { status: string; service: string }

export default function App() {
  const [apiState, setApiState] = useState('Checking API connection…')

  useEffect(() => {
    fetch(apiUrl('/health/'))
      .then(async (response) => {
        if (!response.ok) throw new Error('The API did not respond successfully.')
        return (await response.json()) as HealthResponse
      })
      .then((data) => setApiState(`${data.service} is ${data.status}`))
      .catch(() => setApiState('API not connected yet — follow the setup guide to start Django.'))
  }, [])

  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">DSA DAILY TRACKER</p>
        <h1 id="page-title">Build a stronger coding habit, one problem at a time.</h1>
        <p className="intro">
          The React and Django foundation is ready. Authentication, dashboards, and daily problem tracking will be added in the next approved steps.
        </p>
        <p className="api-status" role="status">{apiState}</p>
      </section>
    </main>
  )
}
