import { ActivePlant, PlantTypeOption } from './types.ts';

export interface NormalizedReading {
  id?: string | number;
  timestamp: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  soilMoisture: number | null;
}

export interface NormalizedStatus {
  hasActivePlant: boolean;
  isOnline: boolean;
  mood: 'healthy' | 'sleeping' | 'unavailable' | 'thirsty' | 'cold' | 'hot' | 'dry' | 'humid';
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  soilMoisture: number | null;
  tempStatus: string;
  humidityStatus: string;
  pressureStatus: string;
  tempRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
  wateringDue: boolean;
  lastWateredAt: string | null;
  lastSyncedAt: string | null;
}

export interface WateringEventRecord {
  id?: string | number;
  watered_at: string;
  plant_id?: string | number;
  notes?: string;
}

function toNumberOrNull(val: unknown): number | null {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
    return Number(val);
  }
  return null;
}

export function toUtcIsoString(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function ensureUtcIso(isoString: string | null | undefined): string | null {
  if (!isoString || typeof isoString !== 'string') return null;
  const trimmed = isoString.trim();
  if (!trimmed) return null;

  const withTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(trimmed) ? trimmed : `${trimmed}Z`;
  const parsed = new Date(withTimezone);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  return toUtcIsoString(parsed);
}

export function normalizePlantTypes(data: any): PlantTypeOption[] {
  const raw = Array.isArray(data?.plant_types)
    ? data.plant_types
    : Array.isArray(data)
      ? data
      : [];

  return raw
    .map((item: any) => {
      if (typeof item === 'string') {
        return { id: item, name: item };
      }
      const id = item?.name ?? item?.id ?? item?.plant_type ?? '';
      const name = item?.name ?? item?.plant_type ?? item?.id ?? '';
      return { id: String(id), name: String(name) };
    })
    .filter((t: PlantTypeOption) => t.id !== '');
}

export async function fetchActivePlantFromApi(): Promise<ActivePlant | null> {
  try {
    const plantsRes = await fetch('/api/plants');
    if (!plantsRes.ok) return null;

    const plantsData = await plantsRes.json();
    const records = Array.isArray(plantsData?.plants)
      ? plantsData.plants
      : Array.isArray(plantsData)
        ? plantsData
        : [];

    const active = records.find((p: any) => p.active === true || p.is_active === true);
    if (!active) return null;

    return {
      id: active.id,
      nickname:
        active.nickname && active.nickname.trim() ? active.nickname.trim() : active.plant_type,
      plantType: active.plant_type,
      speciesName: active.plant_type,
      startedAt: ensureUtcIso(active.started_at) ?? active.started_at,
    };
  } catch {
    return null;
  }
}
export async function fetchReadingsFromApi(
  range: string = '24h',
  plantId?: number | string
): Promise<NormalizedReading[]> {
  try {
    const now = new Date();
    let fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let aggregate = 'none';

    if (range === '7d') {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      aggregate = 'hour';
    } else if (range === '30d') {
      fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      aggregate = 'day';
    }

    const params = new URLSearchParams({
      from: toUtcIsoString(fromDate),
      to: toUtcIsoString(now),
      aggregate,
    });

    if (plantId !== undefined && plantId !== null) {
      params.set('plant_id', String(plantId));
    }

    const statusListRes = await fetch(`/api/statuses?${params.toString()}`);

    if (!statusListRes.ok) return [];

    const data = await statusListRes.json();
    const statuses = Array.isArray(data?.statuses) ? data.statuses : [];

    return [...statuses].reverse().map((s: any) => ({
      id: s.id,
      timestamp: ensureUtcIso(s.timestamp) ?? "",
      temperature: toNumberOrNull(s.reading?.temperature),
      humidity: toNumberOrNull(s.reading?.humidity),
      pressure: toNumberOrNull(s.reading?.pressure),
      soilMoisture: null,
    }));

  } catch (error) {
    console.error('Error fetching historical statuses:', error);
    return [];
  }
}

export async function fetchWateringEventsFromApi(
  plantId?: number | string
): Promise<WateringEventRecord[]> {
  try {
    const now = new Date();
    const fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      from: toUtcIsoString(fromDate),
      to: toUtcIsoString(now),
    });

    if (plantId !== undefined && plantId !== null) {
      params.set('plant_id', String(plantId));
    }

    const res = await fetch(`/api/watering-events?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.events)
      ? data.events
      : Array.isArray(data?.watering_events)
        ? data.watering_events
        : [];

    return list.map((w: any) => ({
      id: w.id,
      watered_at: ensureUtcIso(w.timestamp || w.watered_at) ?? "",
      plant_id: w.plant_id,
      notes: w.note || w.notes || (w.source ? `Watering event recorded` : undefined),
    }));
  } catch {
    return [];
  }
}

export async function recordWateringToApi(note?: string): Promise<boolean> {
  const payload = {
    soil_condition: 'dry',
    note: note && note.trim() !== '' ? note.trim() : undefined,
  };

  const res = await fetch('/api/watering-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function fetchStatusFromApi(): Promise<NormalizedStatus> {
  const [statusRes, settingsRes, healthRes] = await Promise.all([
    fetch('/api/status').catch(() => null),
    fetch('/api/settings').catch(() => null),
    fetch('/api/health').catch(() => null),
  ]);

  let rawStatus: any = null;
  if (statusRes && statusRes.ok) {
    rawStatus = await statusRes.json().catch(() => null);
  }

  let rawSettings: any = null;
  if (settingsRes && settingsRes.ok) {
    rawSettings = await settingsRes.json().catch(() => null);
  }

  let rawHealth: any = null;
  if (healthRes && healthRes.ok) {
    rawHealth = await healthRes.json().catch(() => null);
  }

  const readingObj = rawStatus?.reading || {};
  const conditionsObj = rawStatus?.conditions || {};
  const wateringObj = rawStatus?.watering || {};

  const temperature = toNumberOrNull(readingObj.temperature);
  const humidity = toNumberOrNull(readingObj.humidity);
  const pressure = toNumberOrNull(readingObj.pressure);

  const tempMin = toNumberOrNull(rawSettings?.ranges?.temperature?.min) ?? 18;
  const tempMax = toNumberOrNull(rawSettings?.ranges?.temperature?.max) ?? 27;
  const humMin = toNumberOrNull(rawSettings?.ranges?.humidity?.min) ?? 40;
  const humMax = toNumberOrNull(rawSettings?.ranges?.humidity?.max) ?? 70;

  const sensorOk = true;

  const isOnline =
    sensorOk &&
    rawStatus !== null &&
    (temperature !== null || humidity !== null || pressure !== null);

  const wateringState = String(wateringObj.state || 'unknown').toLowerCase();
  const wateringDue = wateringState === 'due' || wateringState === 'due_soon';

  const tempCond = String(conditionsObj.temperature || 'ok').toLowerCase();
  const humCond = String(conditionsObj.humidity || 'ok').toLowerCase();

  let mood: NormalizedStatus['mood'] = 'healthy';
  let tempStatus = 'Looks good';
  let humidityStatus = 'Looks good';
  const pressureStatus = pressure !== null ? 'Stable' : 'Unavailable';

  if (!isOnline) {
    mood = 'unavailable';
    tempStatus = 'Unavailable';
    humidityStatus = 'Unavailable';
  } else {
    if (tempCond === 'low') {
      tempStatus = 'Too cold';
      mood = 'cold';
    } else if (tempCond === 'high') {
      tempStatus = 'Too hot';
      mood = 'hot';
    }

    if (humCond === 'low') {
      humidityStatus = 'Too dry';
      if (mood === 'healthy') mood = 'dry';
    } else if (humCond === 'high') {
      humidityStatus = 'Too humid';
      if (mood === 'healthy') mood = 'humid';
    }

    if (wateringDue && mood === 'healthy') {
      mood = 'thirsty';
    }
  }

  return {
    hasActivePlant: rawStatus?.plant_id !== null && rawStatus?.plant_id !== undefined,
    isOnline,
    mood,
    temperature,
    humidity,
    pressure,
    soilMoisture: null,
    tempStatus,
    humidityStatus,
    pressureStatus,
    tempRange: { min: tempMin, max: tempMax },
    humidityRange: { min: humMin, max: humMax },
    wateringDue,
    lastWateredAt: ensureUtcIso(wateringObj.last_watered),
    lastSyncedAt: ensureUtcIso(rawStatus?.timestamp || rawHealth?.last_reading_at),
  };
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  const normalized = ensureUtcIso(isoString);
  if (!normalized) return 'No record yet';
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}