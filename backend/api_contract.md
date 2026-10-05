# API Contract

This document defines the REST API between the backend and the frontend. The backend serves both the API and the frontend's static files from the same origin.

All environmental data comes from the Sense HAT. Here is the link to the documentation for the Sense HAT: https://sense-hat.readthedocs.io/en/latest/api/

## Plants and plant types

The API distinguishes between two concepts:

- A **plant type** is a kind of plant, e.g. `"Basil"`. Each type has predefined settings (watering interval and acceptable ranges). Plant types are reference data and are identified by their name.
- A **plant** is one specific physical plant on the device. Each plant has a unique `id` that is distinct from its plant type, so a user can have two plants of the same type successively.

Exactly one plant is active at a time. Selecting a plant type with `POST /api/plants` always creates a new plant with a new id and ends the currently active plant, even if the new plant has the same type as the previous one.

## Readings and plants

The Sense HAT measures the environment, not a specific plant. Readings are therefore stored without a `plant_id` and are collected continuously.

A plant's readings are the readings taken during its active period: from `started_at` (inclusive) to `ended_at` (exclusive), or until now for the active plant. Because periods are half-open, a reading taken exactly at a plant switch belongs to the new plant. Plant-specific values (`conditions` and `watering`) are computed by the backend when the readings are requested, using the plant type's settings.

Watering events are always about a specific plant and are stored with the `plant_id` of the plant that was active when they were logged.

## Conventions

| Topic                      | Convention                                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Base path                  | All endpoints are under `/api`                                                                       |
| Format                     | JSON, `Content-Type: application/json`                                                               |
| Timestamps                 | ISO 8601 in UTC with a `Z` suffix, e.g. `2026-10-05T14:38:12Z`                                       |
| Timestamp query parameters | Must include a timezone (`Z` or an offset like `+02:00`). Timestamps without a timezone return `400` |
| Missing values             | Fields that cannot be measured are `null`, never omitted                                             |

## Errors

All errors use the same shape, e.g:

```json
{
  "error": {
    "code": "invalid_plant_type",
    "message": "'plant_type' must be a valid plant type"
  }
}
```

Error codes used in this document: `invalid_parameter`, `invalid_plant_type`, `no_active_plant`, `not_found`. Other codes are to be decided.

| HTTP status | Used when                               |
| ----------- | --------------------------------------- |
| `400`       | Invalid query parameter or request body |
| `404`       | Resource not found                      |
| `422`       | Body is valid JSON but fails validation |
| `500`       | Unexpected server error                 |

---

## Endpoints overview

| Method   | Path                        | Description                                         |
| -------- | --------------------------- | --------------------------------------------------- |
| `GET`    | `/api/status`               | Get the latest reading and the active plant's state |
| `GET`    | `/api/statuses`             | Get a list of past statuses for a plant             |
| `GET`    | `/api/readings`             | Get raw environment readings, independent of plants |
| `GET`    | `/api/plant-types`          | Get the available plant types                       |
| `GET`    | `/api/plants`               | Get all plants, including past ones                 |
| `POST`   | `/api/plants`               | Start a new plant (ends the active plant)           |
| `GET`    | `/api/settings`             | Get the settings of a plant                         |
| `GET`    | `/api/watering-events`      | Get a list of past waterings for a plant            |
| `POST`   | `/api/watering-events`      | Log a watering for the active plant                 |
| `DELETE` | `/api/watering-events/{id}` | Remove a watering entry                             |
| `GET`    | `/api/health`               | Health check for the backend and sensor             |

---

## Endpoints

### `GET /api/status`

Returns the latest reading from the environmental sensors and values the backend computes for the active plant.

**Response `200`**

```json
{
  "timestamp": "2026-10-05T14:38:12Z",
  "plant_id": 2,
  "reading": {
    "humidity": 12.3,
    "temperature": 12.3,
    "pressure": 12.2,
    "light": 123
  },
  "conditions": {
    "temperature": "ok",
    "humidity": "ok",
    "light": "ok"
  },
  "watering": {
    "state": "due_soon",
    "last_watered": "2026-10-05T14:38:12Z",
    "hours_since_watered": 12.3
  }
}
```

| Field                          | Type            | Description                                                                                                                                           |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timestamp`                    | string \| null  | Time of the latest reading. `null` if no readings exist                                                                                               |
| `plant_id`                     | integer \| null | Id of the active plant. `null` if no plant has been started                                                                                           |
| `reading`                      | object          | Latest environmental sensor reading values, also returned when no plant is active. Fields may be `null`                                               |
| `conditions.*`                 | string          | `"low"`, `"ok"`, `"high"` or `"unknown"`, compared against the ranges of the active plant's type. `"unknown"` if there is no active plant or no value |
| `watering.state`               | string          | `"ok"`, `"due_soon"`, `"due"` or `"unknown"` (no watering logged for this plant yet)                                                                  |
| `watering.last_watered`        | string \| null  | Timestamp of the active plant's most recent watering event                                                                                            |
| `watering.hours_since_watered` | number \| null  | Hours since `last_watered`                                                                                                                            |

---

### `GET /api/statuses`

Plant state history and sensor history for graphs, for one plant.

**Query parameters**

| Name        | Type          | Default      | Description                                                         |
| ----------- | ------------- | ------------ | ------------------------------------------------------------------- |
| `plant_id`  | integer       | active plant | Which plant to return statuses for                                  |
| `from`      | ISO timestamp | 24 hours ago | Start of range (inclusive)                                          |
| `to`        | ISO timestamp | now          | End of range (inclusive)                                            |
| `aggregate` | string        | `none`       | `none`, `hour`, `day`, `week`, `month`. Returns averages per bucket |

Statuses are built from the readings within the plant's active period (see Readings and plants). Readings outside that period are not returned, even if `from` and `to` extend beyond it.

Ranges longer than 7 days with `aggregate=none` return `400`. Use `hour`, `day`, `week`, or `month` instead.

`404` if `plant_id` does not exist. If `plant_id` is omitted and no plant is active, `statuses` is an empty list.

**Aggregated statuses**

- `timestamp` is the start of the bucket.
- `reading` contains the averages within the bucket.
- `conditions` are computed from the averaged values, so short dips within a bucket may not be visible.
- `watering` describes the state at the end of the bucket.

**Response `200`**

```json
{
  "plant_id": 2,
  "from": "2026-10-05T14:30:00Z",
  "to": "2026-10-05T14:45:00Z",
  "aggregate": "none",
  "statuses": [
    {
      "timestamp": "2026-10-05T14:38:12Z",
      "reading": {
        "humidity": 12.3,
        "temperature": 12.3,
        "pressure": 12.3,
        "light": 123
      },
      "conditions": {
        "temperature": "ok",
        "humidity": "ok",
        "light": "ok"
      },
      "watering": {
        "state": "due_soon",
        "last_watered": "2026-10-05T14:38:12Z",
        "hours_since_watered": 12.3
      }
    }
  ]
}
```

Statuses are sorted newest first. Conditions are evaluated against the ranges of the plant's type.

---

### `GET /api/readings`

Raw environment readings, independent of any plant. Useful for viewing the environment before a plant is chosen or between plants, and for calibration and debugging.

**Query parameters**

| Name        | Type          | Default      | Description                                                         |
| ----------- | ------------- | ------------ | ------------------------------------------------------------------- |
| `from`      | ISO timestamp | 24 hours ago | Start of range (inclusive)                                          |
| `to`        | ISO timestamp | now          | End of range (inclusive)                                            |
| `aggregate` | string        | `none`       | `none`, `hour`, `day`, `week`, `month`. Returns averages per bucket |

Ranges longer than 7 days with `aggregate=none` return `400`. For aggregated readings, `timestamp` is the start of the bucket.

**Response `200`**

```json
{
  "from": "2026-10-05T14:30:00Z",
  "to": "2026-10-05T14:45:00Z",
  "aggregate": "none",
  "readings": [
    {
      "timestamp": "2026-10-05T14:38:12Z",
      "humidity": 12.3,
      "temperature": 12.3,
      "pressure": 12.3,
      "light": 123
    }
  ]
}
```

Readings are sorted newest first.

---

### `GET /api/plant-types`

Returns the plant types a user can choose between.

**Response `200`**

```json
{
  "plant_types": [
    {
      "name": "Basil",
      "watering_interval_hours": 72,
      "due_soon_hours": 12,
      "ranges": {
        "temperature": { "min": 18.0, "max": 27.0 },
        "humidity": { "min": 40.0, "max": 70.0 },
        "light": { "min": 200, "max": null }
      }
    }
  ]
}
```

See `GET /api/settings` for a description of the fields.

---

### `GET /api/plants`

Returns all plants, including plants that are no longer active.

**Response `200`**

```json
{
  "plants": [
    {
      "id": 2,
      "plant_type": "Basil",
      "started_at": "2026-10-05T14:38:12Z",
      "ended_at": null,
      "active": true
    },
    {
      "id": 1,
      "plant_type": "Basil",
      "started_at": "2026-07-01T10:15:00Z",
      "ended_at": "2026-10-05T14:30:00Z",
      "active": false
    }
  ]
}
```

| Field        | Type           | Description                                                      |
| ------------ | -------------- | ---------------------------------------------------------------- |
| `id`         | integer        | Unique id of the plant                                           |
| `plant_type` | string         | Name of the plant type                                           |
| `started_at` | string         | When the plant became active                                     |
| `ended_at`   | string \| null | When the plant stopped being active. `null` for the active plant |
| `active`     | boolean        | `true` for the active plant                                      |

Plants are sorted newest first.

---

### `POST /api/plants`

Starts a new plant of the given type. In one transaction, the backend sets `ended_at` on the currently active plant (if any) and creates a new plant with a new id.

A new plant is created on every call, even if the plant type is the same as the active plant's type.

**Request body**

```json
{
  "plant_type": "Basil"
}
```

**Response `201`**: the created plant, same shape as in `GET /api/plants`.

**`422`** with code `invalid_plant_type` if `plant_type` is not one of the types from `GET /api/plant-types`.

---

### `GET /api/settings`

Returns the settings that apply to a plant. Settings are defined by the plant's type.

**Query parameters**

| Name       | Type    | Default      | Description                        |
| ---------- | ------- | ------------ | ---------------------------------- |
| `plant_id` | integer | active plant | Which plant to return settings for |

**Response `200`**

```json
{
  "plant_id": 2,
  "plant_type": "Basil",
  "watering_interval_hours": 72,
  "due_soon_hours": 12,
  "ranges": {
    "temperature": { "min": 18.0, "max": 27.0 },
    "humidity": { "min": 40.0, "max": 70.0 },
    "light": { "min": 200, "max": null }
  }
}
```

| Field                     | Type           | Description                                                                                |
| ------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `plant_id`                | integer        | Unique id of the plant                                                                     |
| `plant_type`              | string         | Name of the plant type                                                                     |
| `watering_interval_hours` | number         | Typical interval between waterings under normal conditions                                 |
| `due_soon_hours`          | number         | `watering.state` becomes `"due_soon"` this many hours before it is time to water the plant |
| `ranges.*.min` / `max`    | number \| null | Acceptable range per metric. `null` means no limit                                         |

`404` if `plant_id` does not exist. `404` with code `no_active_plant` if `plant_id` is omitted and no plant is active.

---

### `GET /api/watering-events`

**Query parameters**

| Name       | Type          | Default      | Description                      |
| ---------- | ------------- | ------------ | -------------------------------- |
| `plant_id` | integer       | active plant | Which plant to return events for |
| `from`     | ISO timestamp | 30 days ago  | Start of range                   |
| `to`       | ISO timestamp | now          | End of range                     |

**Response `200`**

```json
{
  "events": [
    {
      "id": 17,
      "plant_id": 2,
      "timestamp": "2026-10-03T08:12:00Z",
      "source": "device",
      "amount_ml": null,
      "soil_condition": "dry",
      "note": null
    }
  ]
}
```

| Field            | Type            | Description                                                              |
| ---------------- | --------------- | ------------------------------------------------------------------------ |
| `id`             | integer         | Unique id                                                                |
| `plant_id`       | integer         | Id of the plant that was watered                                         |
| `timestamp`      | string          | When the plant was watered                                               |
| `source`         | string          | `"device"` (logged on device) or `"web"`                                 |
| `amount_ml`      | integer \| null | Water amount, if known                                                   |
| `soil_condition` | string \| null  | How the soil felt before watering: `"dry"`, `"moist"`, `"wet"` or `null` |
| `note`           | string \| null  | Optional text about the plant                                            |

Events are sorted newest first. `404` if `plant_id` does not exist.

---

### `POST /api/watering-events`

Log a watering from the web UI. The event is always linked to the active plant, the same way as waterings logged on the device.

**Request body**

```json
{
  "amount_ml": 250,
  "soil_condition": "dry",
  "note": "The plant is starting to wither"
}
```

All fields are optional. `plant_id`, `timestamp` (now) and `source` (`"web"`) are set by the backend.

**Response `201`**: the created event, same shape as in the list above.

**`422`** with code `no_active_plant` if no plant is active.

---

### `DELETE /api/watering-events/{id}`

Remove a logged watering event.

**Response `204`**: no body. **`404`** if the id does not exist.

---

### `GET /api/health`

Used for debugging and monitoring.

**Response `200`**

```json
{
  "backend": "ok",
  "database": "ok",
  "sensor": "ok",
  "last_reading_at": "2026-10-05T14:38:12Z"
}
```
