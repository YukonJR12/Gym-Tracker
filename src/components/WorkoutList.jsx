import './WorkoutList.css'

const TYPE_COLORS = {
  Push:  '#f97316',
  Pull:  '#3b82f6',
  Legs:  '#22c55e',
  Upper: '#a855f7',
  Lower: '#eab308',
}

function groupByDate(workouts) {
  const groups = {}
  for (const w of workouts) {
    const key = w.workout_date
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  }
  return groups
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function WorkoutCard({ workout }) {
  const color = TYPE_COLORS[workout.workout_type] || '#888'
  const isBodyweight = workout.weight_kg === 0 || workout.weight_kg === '0' || workout.weight_kg === '0.00'

  return (
    <div className="workout-card">
      <div className="card-left" style={{ borderLeftColor: color }} />
      <div className="card-body">
        <div className="card-top">
          <span className="card-exercise">{workout.exercise_name}</span>
          <span className="card-badge" style={{ background: color + '22', color }}>
            {workout.workout_type}
          </span>
        </div>
        <div className="card-stats">
          <span className="stat">
            <span className="stat-val">{workout.sets}</span>
            <span className="stat-label">sets</span>
          </span>
          <span className="stat-sep">×</span>
          <span className="stat">
            <span className="stat-val">{workout.reps}</span>
            <span className="stat-label">reps</span>
          </span>
          <span className="stat-sep">@</span>
          <span className="stat">
            <span className="stat-val">{isBodyweight ? 'BW' : `${workout.weight_kg}kg`}</span>
            {!isBodyweight && <span className="stat-label">weight</span>}
          </span>
        </div>
        {workout.notes && (
          <p className="card-notes">💬 {workout.notes}</p>
        )}
        {workout.motivational_summary && (
          <p className="card-summary">🏆 {workout.motivational_summary}</p>
        )}
        {workout.photo_url && (
          <div className="card-photo-wrap">
            <img
              src={workout.photo_url}
              alt={`${workout.exercise_name} progress photo`}
              className="card-photo"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function DateGroup({ date, workouts }) {
  const workoutType = workouts[0]?.workout_type
  const color = TYPE_COLORS[workoutType] || '#888'

  return (
    <div className="date-group">
      <div className="date-header">
        <span className="date-label">{formatDate(date)}</span>
        <span className="date-type" style={{ color }}>{workoutType} Day</span>
        <span className="date-count">{workouts.length} exercise{workouts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="card-list">
        {workouts.map(w => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
      </div>
    </div>
  )
}

export default function WorkoutList({ workouts, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="list-state">
        <div className="spinner" />
        <p className="state-text">Loading workouts…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="list-state list-error">
        <span className="state-icon">⚠️</span>
        <p className="state-text">{error}</p>
        <button className="btn btn-ghost" onClick={onRetry}>Try again</button>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="list-state list-empty">
        <span className="state-icon">🏋️</span>
        <p className="state-text">No workouts logged yet.</p>
        <p className="state-sub">Hit "+ Log Workout" above to get started.</p>
      </div>
    )
  }

  const groups = groupByDate(workouts)

  return (
    <div className="workout-list">
      {Object.entries(groups).map(([date, ws]) => (
        <DateGroup key={date} date={date} workouts={ws} />
      ))}
    </div>
  )
}
