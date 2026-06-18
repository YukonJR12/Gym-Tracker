import { useState } from 'react'
import { supabase } from '../supabase'
import './WorkoutForm.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const WORKOUT_EXERCISES = {
  Push:  ['Chest Press', 'Shoulder Press', 'Cable Flyes', 'Lat Raises', 'Dips', 'Hammer Curl', 'DB Curl'],
  Pull:  ['Lat Pulldowns', 'Cable Rows', 'Pull Up', 'Low Rows', 'Tricep Pulldowns'],
  Legs:  ['Leg Press', 'Leg Curl', 'Hack Squat', 'Romanian Deadlift', 'Walking Lunges', 'Calf Raises'],
  Upper: ['Chest Press', 'Shoulder Press', 'Cable Flyes', 'Pull Up', 'Low Rows', 'Tricep Pulldowns'],
  Lower: ['Leg Press', 'Leg Curl', 'Hack Squat', 'Romanian Deadlift', 'Hip Thrust', 'Calf Raises'],
}

const DAY_WORKOUT_MAP = {
  Sunday: 'Push', Monday: 'Pull', Tuesday: 'Legs',
  Wednesday: 'Upper', Thursday: 'Lower', Friday: null, Saturday: null,
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getDayName(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return DAYS[d.getDay()]
}

const INITIAL = {
  workout_date: todayStr(),
  workout_type: '',
  exercise_name: '',
  sets: '',
  reps: '',
  weight_kg: '',
  notes: '',
}

export default function WorkoutForm({ onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const day = getDayName(todayStr())
    return { ...INITIAL, workout_type: DAY_WORKOUT_MAP[day] || '' }
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const dayName = getDayName(form.workout_date)
  const exercises = WORKOUT_EXERCISES[form.workout_type] || []

  const set = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleDateChange = (e) => {
    const date = e.target.value
    const day = getDayName(date)
    const suggestedType = DAY_WORKOUT_MAP[day] || form.workout_type
    setForm(prev => ({
      ...prev,
      workout_date: date,
      workout_type: suggestedType,
      exercise_name: '',
    }))
  }

  const handleTypeChange = (e) => {
    setForm(prev => ({ ...prev, workout_type: e.target.value, exercise_name: '' }))
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      let photo_url = null

      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('progress-photos')
          .upload(fileName, photoFile, { upsert: false })

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(fileName)

        photo_url = urlData.publicUrl
      }

      const row = {
        workout_date: form.workout_date,
        day_of_week: getDayName(form.workout_date),
        workout_type: form.workout_type,
        exercise_name: form.exercise_name,
        sets: parseInt(form.sets, 10),
        reps: parseInt(form.reps, 10),
        weight_kg: parseFloat(form.weight_kg),
        notes: form.notes || null,
        photo_url,
      }

      const { error: insertError } = await supabase.from('workout_logs').insert([row])
      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSave()
      }, 1200)

      setForm(prev => ({ ...INITIAL, workout_date: prev.workout_date, workout_type: prev.workout_type }))
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-card">
      <div className="form-header">
        <h2 className="form-title">Log a Workout</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>

      {success && (
        <div className="alert alert-success">✓ Workout saved successfully!</div>
      )}
      {error && (
        <div className="alert alert-error">✕ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="form">
        {/* Row 1: Date + Type */}
        <div className="form-row">
          <div className="form-group">
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.workout_date}
              onChange={handleDateChange}
              required
            />
            {dayName && (
              <span className="field-hint">{dayName}</span>
            )}
          </div>

          <div className="form-group">
            <label className="label">Workout Type</label>
            <select
              className="input"
              value={form.workout_type}
              onChange={handleTypeChange}
              required
            >
              <option value="">Select type…</option>
              {['Push', 'Pull', 'Legs', 'Upper', 'Lower'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise */}
        <div className="form-group">
          <label className="label">Exercise</label>
          {exercises.length > 0 ? (
            <select
              className="input"
              value={form.exercise_name}
              onChange={e => set('exercise_name', e.target.value)}
              required
            >
              <option value="">Select exercise…</option>
              {exercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
          ) : (
            <input
              type="text"
              className="input"
              placeholder="Select a workout type first"
              disabled
            />
          )}
          {form.exercise_name === '__custom__' && (
            <input
              type="text"
              className="input"
              style={{ marginTop: 8 }}
              placeholder="Exercise name"
              onChange={e => set('exercise_name', e.target.value)}
              required
            />
          )}
        </div>

        {/* Row 2: Sets / Reps / Weight */}
        <div className="form-row form-row-3">
          <div className="form-group">
            <label className="label">Sets</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 3"
              min="1"
              value={form.sets}
              onChange={e => set('sets', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Reps</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 10"
              min="1"
              value={form.reps}
              onChange={e => set('reps', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Weight (kg)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 60"
              min="0"
              step="0.5"
              value={form.weight_kg}
              onChange={e => set('weight_kg', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="label">Notes <span className="label-optional">(optional)</span></label>
          <textarea
            className="input textarea"
            placeholder="How did it feel? Any PRs?"
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        {/* Photo upload */}
        <div className="form-group">
          <label className="label">Progress Photo <span className="label-optional">(optional)</span></label>
          {!photoPreview ? (
            <label className="photo-drop">
              <input
                type="file"
                accept="image/*"
                className="photo-input"
                onChange={handlePhoto}
              />
              <span className="photo-drop-icon">📷</span>
              <span className="photo-drop-text">Click to upload a photo</span>
              <span className="photo-drop-hint">JPG, PNG, WEBP</span>
            </label>
          ) : (
            <div className="photo-preview-wrap">
              <img src={photoPreview} alt="Preview" className="photo-preview" />
              <button type="button" className="photo-remove" onClick={removePhoto}>✕ Remove</button>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-accent btn-full" disabled={saving}>
            {saving ? 'Saving…' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  )
}
