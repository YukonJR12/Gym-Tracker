import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import WorkoutForm from './components/WorkoutForm'
import WorkoutList from './components/WorkoutList'
import './App.css'

const FILTERS = ['All', 'Push', 'Pull', 'Legs', 'Upper', 'Lower']

export default function App() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)

  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('workout_logs')
        .select('*')
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter !== 'All') {
        query = query.eq('workout_type', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setWorkouts(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const handleSave = () => {
    setShowForm(false)
    fetchWorkouts()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-icon">🏋️</span>
            <div>
              <h1 className="header-title">Gym Tracker</h1>
              <p className="header-sub">Track every rep. Own your progress.</p>
            </div>
          </div>
          <button
            className="btn btn-accent"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? '✕ Close' : '+ Log Workout'}
          </button>
        </div>
      </header>

      <main className="main">
        {showForm && (
          <section className="form-section">
            <WorkoutForm onSave={handleSave} onCancel={() => setShowForm(false)} />
          </section>
        )}

        <section className="list-section">
          <div className="filter-bar">
            <span className="filter-label">Filter by type</span>
            <div className="filter-pills">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`pill ${filter === f ? 'pill-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <WorkoutList
            workouts={workouts}
            loading={loading}
            error={error}
            onRetry={fetchWorkouts}
          />
        </section>
      </main>
    </div>
  )
}
