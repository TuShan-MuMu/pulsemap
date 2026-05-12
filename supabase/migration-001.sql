-- PulseMap Database Schema
-- Run this in your Supabase SQL editor to set up the tables

-- Disease metadata lookup
CREATE TABLE IF NOT EXISTS diseases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  weight double precision DEFAULT 1.0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Identified outbreaks
CREATE TABLE IF NOT EXISTS outbreaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name text NOT NULL,
  status text CHECK (status IN ('active', 'monitoring', 'resolved')) DEFAULT 'active',
  severity text CHECK (severity IN ('low', 'moderate', 'severe', 'critical')),
  first_reported timestamptz NOT NULL,
  last_updated timestamptz DEFAULT now(),
  summary text,
  created_at timestamptz DEFAULT now()
);

-- Outbreak locations (one outbreak -> many locations)
CREATE TABLE IF NOT EXISTS outbreak_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbreak_id uuid REFERENCES outbreaks(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  country text NOT NULL,
  region text,
  case_count integer DEFAULT 0,
  severity_score double precision DEFAULT 0,
  reported_at timestamptz DEFAULT now()
);

-- Source reports linked to outbreaks
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outbreak_id uuid REFERENCES outbreaks(id) ON DELETE CASCADE,
  source_type text CHECK (source_type IN ('who', 'cdc', 'news', 'user')),
  source_name text NOT NULL,
  title text NOT NULL,
  url text,
  content text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Community reports (v2)
CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  outbreak_id uuid REFERENCES outbreaks(id),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  disease_name text NOT NULL,
  description text,
  status text CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outbreak_locations_outbreak ON outbreak_locations(outbreak_id);
CREATE INDEX IF NOT EXISTS idx_outbreak_locations_geo ON outbreak_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_outbreak ON reports(outbreak_id);
CREATE INDEX IF NOT EXISTS idx_reports_source_type ON reports(source_type);
CREATE INDEX IF NOT EXISTS idx_outbreaks_status ON outbreaks(status);
CREATE INDEX IF NOT EXISTS idx_outbreaks_severity ON outbreaks(severity);

-- Enable Row Level Security
ALTER TABLE outbreaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbreak_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Public read access for all outbreak data
CREATE POLICY "Public read access" ON outbreaks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON outbreak_locations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON reports FOR SELECT USING (true);
CREATE POLICY "Public read access" ON diseases FOR SELECT USING (true);

-- User reports: public read, authenticated write
CREATE POLICY "Public read access" ON user_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert own reports" ON user_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
