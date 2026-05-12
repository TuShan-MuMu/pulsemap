# PulseMap — Design Document

## What It Is

A real-time global disease surveillance dashboard styled like a weather radar. Dark mode interface with a full-screen interactive map showing outbreak heat maps, spread patterns, and hotspot indicators. Below the map, a live feed combines official health reports, news articles, and (eventually) community reports into a scrollable timeline.

**Name:** PulseMap
**Stack:** Next.js, React, TypeScript, Mapbox GL JS, Supabase, Tailwind CSS, Vercel
**Data Sources (v1):** WHO, CDC, ProMED, ECDC (manually curated)
**Data Sources (future):** News API + LLM extraction, community reports

---

## Architecture

```
┌─────────────────────────────────────┐
│         Next.js App (Vercel)        │
├──────────┬──────────┬───────────────┤
│  Mapbox  │  Feed    │  Auth         │
│  GL JS   │  Panel   │  (Supabase)   │
├──────────┴──────────┴───────────────┤
│         Supabase Backend            │
│  ┌─────────┬──────────┬──────────┐  │
│  │Postgres │ Realtime │ Auth     │  │
│  │(outbreaks│(future  │(Google   │  │
│  │locations,│ feed)   │ OAuth)   │  │
│  │ reports) │         │          │  │
│  └─────────┴──────────┴──────────┘  │
├─────────────────────────────────────┤
│       Data Sources (v1: manual)     │
│  WHO  ·  CDC  ·  ProMED  ·  ECDC   │
└─────────────────────────────────────┘
```

---

## UI Layout

### Screen Structure

- **Navbar (sticky, slim):** PulseMap logo/brand left, search center, login right
- **Map area (~65vh):** Full-width Mapbox GL map with dark basemap
  - Legend overlay (bottom-left): severity color scale
  - Layer toggle panel (floating, top-right): checkboxes for each layer
- **Feed panel (~35vh):** Scrollable list of outbreak reports
  - Each item: source badge, disease name, location, time ago
  - Click item → map flies to location
  - Filter bar: by disease, region, source type

### Color System (Dark Theme)

| Element            | Color                              |
| ------------------ | ---------------------------------- |
| Background         | `#0a0e17` (near black, slight blue)|
| Card/panel surfaces| `#131a2b`                          |
| Heat — low         | `#22c55e` (green)                  |
| Heat — moderate    | `#eab308` (amber)                  |
| Heat — severe      | `#ef4444` (red)                    |
| Heat — critical    | `#dc2626` → `#7f1d1d` (pulsing)   |
| Accent / branding  | `#3b82f6` (electric blue)          |
| Text primary       | `#e2e8f0`                          |
| Text secondary     | `#64748b`                          |

---

## Map Layers (Weather-Style System)

### Layer 1: Heat Map (default ON)

GeoJSON regions colored by outbreak density/severity. Mapbox `heatmap` layer type with weight:

```
severity_score = (case_count × disease_weight) / population
```

Green → amber → red gradient. Opacity ~0.6.

### Layer 2: Hotspot Markers (default ON)

Pulsing circles on outbreak epicenters. Size = relative case count. Color = severity. CSS keyframe pulse animation. Click opens detail panel.

### Layer 3: Spread Fronts (default OFF)

Animated arcs showing outbreak movement over time. Mapbox `line` layer with `line-dasharray` animation for flow direction. Visually dense — power user feature.

### Layer 4: News Pins (default OFF)

Small markers where news articles are geolocated. Different icons per source type (WHO = shield, news = newspaper, user = person). Click opens article in feed.

### Zoom Behavior

| Zoom Level     | What You See                                |
| -------------- | ------------------------------------------- |
| World (1-3)    | Continental heat blobs, major hotspots only |
| Regional (4-6) | Country-level heat, all hotspots visible    |
| Country (7-9)  | Sub-region detail, spread lines appear      |
| Local (10+)    | Individual news pins, granular data         |

---

## Data Model (Postgres / Supabase)

### Tables

```sql
-- Identified outbreak
outbreaks (
  id              uuid PK DEFAULT gen_random_uuid(),
  disease_name    text NOT NULL,
  status          text CHECK (status IN ('active','monitoring','resolved')) DEFAULT 'active',
  severity        text CHECK (severity IN ('low','moderate','severe','critical')),
  first_reported  timestamptz NOT NULL,
  last_updated    timestamptz DEFAULT now(),
  summary         text,
  created_at      timestamptz DEFAULT now()
);

-- Where an outbreak is happening (one outbreak → many locations)
outbreak_locations (
  id              uuid PK DEFAULT gen_random_uuid(),
  outbreak_id     uuid REFERENCES outbreaks(id) ON DELETE CASCADE,
  latitude        double precision NOT NULL,
  longitude       double precision NOT NULL,
  country         text NOT NULL,
  region          text,
  case_count      integer DEFAULT 0,
  severity_score  double precision DEFAULT 0,
  reported_at     timestamptz DEFAULT now()
);

-- Source reports linked to outbreaks
reports (
  id              uuid PK DEFAULT gen_random_uuid(),
  outbreak_id     uuid REFERENCES outbreaks(id) ON DELETE CASCADE,
  source_type     text CHECK (source_type IN ('who','cdc','news','user')),
  source_name     text NOT NULL,
  title           text NOT NULL,
  url             text,
  content         text,
  published_at    timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Disease metadata
diseases (
  id              uuid PK DEFAULT gen_random_uuid(),
  name            text UNIQUE NOT NULL,
  category        text,
  weight          double precision DEFAULT 1.0,
  description     text
);

-- Future: community reports (v2)
user_reports (
  id              uuid PK DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id),
  outbreak_id     uuid REFERENCES outbreaks(id),
  latitude        double precision NOT NULL,
  longitude       double precision NOT NULL,
  disease_name    text NOT NULL,
  description     text,
  status          text CHECK (status IN ('pending','verified','rejected')) DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);
```

### GeoJSON API

```
GET /api/outbreaks/geo?layers=heatmap,hotspots
```

Returns FeatureCollection with properties Mapbox can consume directly.

---

## Build Phases

### Phase 1 — The Map (MVP) ← BUILDING NOW

- Next.js + TypeScript + Tailwind + Mapbox GL
- Supabase schema + seed data (~20-30 active outbreaks)
- Heat map layer + hotspot markers with pulse
- Click hotspot → detail panel
- Legend + layer toggles
- Deploy to Vercel

### Phase 2 — The Feed

- Live feed panel below map
- Feed items linked to outbreaks
- Search/filter by disease or region
- News pin layer

### Phase 3 — Auth + Personalization

- Google OAuth via Supabase
- Save preferred view/filters
- Location-based default view

### Phase 4 — Data Pipeline

- Serverless cron jobs (WHO RSS, CDC API, ProMED)
- LLM extraction from news APIs
- Deduplication + auto-geocoding

### Phase 5 — Community Layer (v2)

- User report submission
- Moderation queue + trust scoring
- Real-time feed via Supabase subscriptions
- Spam/misinfo safeguards
