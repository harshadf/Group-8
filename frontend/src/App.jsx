import { useCallback, useEffect, useState } from 'react'
import './App.css'

const CONDITION_LABELS = {
  low: 'Low',
  ok: 'Normal',
  high: 'High',
  unknown: 'Unknown',
}

const WATERING_LABELS = {
  ok: 'Watered',
  due_soon: 'Due soon',
  due: 'Needs water',
  unknown: 'Unknown',
}

function formatNumber(value, unit = '') {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—'
  }
  return `${Number(value).toFixed(1)}${unit}`
}

function formatTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', { hour12: false })
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.error?.message || message
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  if (response.status === 204) return null
  return response.json()
}

function Badge({ kind, children }) {
  return <span className={`badge badge-${kind}`}>{children}</span>
}

function App() {
  const [status, setStatus] = useState(null)
  const [plants, setPlants] = useState([])
  const [plantTypes, setPlantTypes] = useState([])
  const [events, setEvents] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [nickname, setNickname] = useState('')
  const [plantType, setPlantType] = useState('')

  const load = useCallback(async () => {
    setError('')
    const [statusData, plantsData, typesData] = await Promise.all([
      fetchJson('/api/status'),
      fetchJson('/api/plants'),
      fetchJson('/api/plant-types'),
    ])

    setStatus(statusData)
    setPlants(plantsData.plants || [])
    setPlantTypes(typesData.plant_types || [])
    setPlantType((current) => current || typesData.plant_types?.[0]?.name || '')

    let nextSettings = null
    let nextEvents = []
    try {
      nextSettings = await fetchJson('/api/settings')
    } catch {
      nextSettings = null
    }
    try {
      const eventsData = await fetchJson('/api/watering-events')
      nextEvents = eventsData.events || []
    } catch {
      nextEvents = []
    }
    setSettings(nextSettings)
    setEvents(nextEvents)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    load()
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load plant data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const activePlant = plants.find((plant) => plant.active) || null

  async function withBusy(action, successMessage) {
    setBusy(true)
    setNotice('')
    setError('')
    try {
      await action()
      await load()
      if (successMessage) setNotice(successMessage)
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setBusy(false)
    }
  }

  function handleWater() {
    return withBusy(
      () =>
        fetchJson('/api/watering-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
      'Watering recorded',
    )
  }

  function handleStartPlant(event) {
    event.preventDefault()
    if (!plantType || !nickname.trim()) {
      setError('Please select a plant type and enter a nickname')
      return
    }
    return withBusy(
      () =>
        fetchJson('/api/plants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plant_type: plantType, nickname: nickname.trim() }),
        }),
      `Started caring for ${nickname.trim()}`,
    ).then(() => setNickname(''))
  }

  const reading = status?.reading || {}
  const conditions = status?.conditions || {}
  const watering = status?.watering || {}

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Household plant monitor</p>
          <h1>Happy Plants</h1>
        </div>
        <button type="button" onClick={() => withBusy(load)} disabled={busy}>
          Refresh
        </button>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner ok">{notice}</p> : null}
      {loading ? <p className="muted">Loading plant data…</p> : null}

      <section className="hero-card">
        <div>
          <p className="eyebrow">Active plant</p>
          <h2>{activePlant ? activePlant.nickname : 'No active plant'}</h2>
          <p>
            {activePlant
              ? `${activePlant.plant_type} · started ${formatTime(activePlant.started_at)}`
              : 'Choose a plant type to start tracking environment data and watering.'}
          </p>
        </div>
        <div className="hero-meta">
          <Badge kind={watering.state || 'unknown'}>
            {WATERING_LABELS[watering.state] || 'Unknown'}
          </Badge>
          <p className="muted">Latest reading {formatTime(status?.timestamp)}</p>
        </div>
      </section>

      <section className="grid metrics">
        <article className="card">
          <p className="eyebrow">Temperature</p>
          <strong>{formatNumber(reading.temperature, ' °C')}</strong>
          <Badge kind={conditions.temperature || 'unknown'}>
            {CONDITION_LABELS[conditions.temperature] || 'Unknown'}
          </Badge>
        </article>
        <article className="card">
          <p className="eyebrow">Humidity</p>
          <strong>{formatNumber(reading.humidity, ' %')}</strong>
          <Badge kind={conditions.humidity || 'unknown'}>
            {CONDITION_LABELS[conditions.humidity] || 'Unknown'}
          </Badge>
        </article>
        <article className="card">
          <p className="eyebrow">Pressure</p>
          <strong>{formatNumber(reading.pressure, ' hPa')}</strong>
          <p className="muted">Environment reading</p>
        </article>
        <article className="card">
          <p className="eyebrow">Since last watering</p>
          <strong>
            {watering.hours_since_watered == null
              ? '—'
              : `${Number(watering.hours_since_watered).toFixed(1)} h`}
          </strong>
          <p className="muted">Last {formatTime(watering.last_watered)}</p>
        </article>
      </section>

      <section className="grid two">
        <article className="card">
          <div className="card-head">
            <h2>Watering</h2>
            <button type="button" onClick={handleWater} disabled={busy || !activePlant}>
              Log watering
            </button>
          </div>
          {settings ? (
            <p className="muted">
              {settings.plant_type} should typically be watered every{' '}
              {settings.watering_interval_hours} hours. Remind{' '}
              {settings.due_soon_hours} hours before it is due.
            </p>
          ) : (
            <p className="muted">Watering can only be logged when a plant is active.</p>
          )}
          <ul className="event-list">
            {events.length === 0 ? <li className="muted">No watering events yet</li> : null}
            {events.slice(0, 6).map((event) => (
              <li key={event.id}>
                <div>
                  <strong>{formatTime(event.timestamp)}</strong>
                  <p className="muted">
                    {event.source}
                    {event.amount_ml ? ` · ${event.amount_ml} ml` : ''}
                    {event.soil_condition ? ` · soil ${event.soil_condition}` : ''}
                  </p>
                </div>
                {event.note ? <span>{event.note}</span> : null}
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <h2>Start a new plant</h2>
          <p className="muted">This ends the current plant and creates a new care record.</p>
          <form className="start-form" onSubmit={handleStartPlant}>
            <label>
              Plant type
              <select value={plantType} onChange={(event) => setPlantType(event.target.value)}>
                {plantTypes.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nickname
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="e.g. Pesto"
              />
            </label>
            <button type="submit" disabled={busy || plantTypes.length === 0}>
              Start plant
            </button>
          </form>

          <h3>Plants</h3>
          <ul className="event-list">
            {plants.length === 0 ? <li className="muted">No plants yet</li> : null}
            {plants.map((plant) => (
              <li key={plant.id}>
                <div>
                  <strong>
                    {plant.nickname}{' '}
                    {plant.active ? <Badge kind="ok">Active</Badge> : null}
                  </strong>
                  <p className="muted">
                    {plant.plant_type} · {formatTime(plant.started_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  )
}

export default App
