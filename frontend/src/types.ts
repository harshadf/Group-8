export type Screen =
  | 'home'
  | 'history'
  | 'settings'
  | 'alerts'
  | 'humidity-history'
  | 'temperature-history'
  | 'atmospheric-pressure'
  | 'home-no-plant'
  | 'home-unavailable'
  | 'add-plant'
  | 'dashboard-watering-due'
  | 'dashboard-temp-low'
  | 'dashboard-temp-high'
  | 'dashboard-humidity-low'
  | 'dashboard-humidity-high';

export interface PlantProfile {
  name: string;
  species: string;
  wateringFrequencyDays: number;
  lastWateredDaysAgo: number;
  temperatureRange: { min: number; max: number };
  humidityRange: { min: number; max: number };
  soilMoistureRange: { min: number; max: number };
}

export interface SensorData {
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  soilMoisture: number | null;
  lastSynced: string;
  isOnline: boolean;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'urgent';
  timestamp: string;
  read: boolean;
}

export interface PlantTypeOption {
  id: string;
  name: string;
}

export interface PlantRecord {
  id: string | number;
  plant_type: string;
  nickname?: string;
  started_at: string;
  ended_at: string | null;
  active?: boolean;
  is_active?: boolean;
}

export interface ActivePlant {
  id?: string | number;
  nickname: string;
  plantType: string;
  speciesName: string;
  startedAt?: string;
}