// Seed script: runs migration SQL and inserts outbreak data into Supabase
// Usage: node scripts/seed.mjs

const SUPABASE_URL = "https://xkggssmlewibtiaumizb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZ2dzc21sZXdpYnRpYXVtaXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDMwMjcsImV4cCI6MjA4NTY3OTAyN30.QssXTWqi5XJFPxIl_Dg-7EvHVw9BOWSXnxYKVTvhiXY";

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rpc(sql) {
  // Use the Supabase REST rpc or direct SQL isn't available via anon key
  // We'll insert via the REST API instead
}

async function insert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to insert into ${table}:`, err);
    return null;
  }
  return res.json();
}

// Outbreak seed data
const outbreaks = [
  { disease_name: "Mpox (Clade Ib)", status: "active", severity: "critical", first_reported: "2024-07-15T00:00:00Z", summary: "Ongoing mpox outbreak with sustained community transmission across eastern provinces." },
  { disease_name: "Mpox (Clade Ib)", status: "active", severity: "severe", first_reported: "2024-09-01T00:00:00Z", summary: "Cross-border mpox spread from DR Congo with local transmission chains." },
  { disease_name: "Mpox (Clade Ib)", status: "active", severity: "severe", first_reported: "2024-09-15T00:00:00Z", summary: "Mpox cases increasing with community transmission." },
  { disease_name: "Mpox (Clade Ib)", status: "active", severity: "moderate", first_reported: "2024-10-01T00:00:00Z", summary: "Mpox cases detected with containment measures in place." },
  { disease_name: "Mpox (Clade Ib)", status: "active", severity: "moderate", first_reported: "2024-10-05T00:00:00Z", summary: "Active mpox surveillance with sporadic community cases." },
  { disease_name: "Cholera", status: "active", severity: "critical", first_reported: "2025-03-10T00:00:00Z", summary: "Severe cholera outbreak exacerbated by flooding and displacement." },
  { disease_name: "Cholera", status: "active", severity: "severe", first_reported: "2025-05-20T00:00:00Z", summary: "Cholera outbreak spreading across multiple regions." },
  { disease_name: "Dengue", status: "active", severity: "severe", first_reported: "2025-06-01T00:00:00Z", summary: "Record dengue season with healthcare system under significant strain." },
  { disease_name: "Dengue", status: "active", severity: "severe", first_reported: "2025-11-15T00:00:00Z", summary: "Major dengue epidemic with emergency measures declared in multiple states." },
  { disease_name: "Dengue", status: "active", severity: "moderate", first_reported: "2025-08-01T00:00:00Z", summary: "Elevated dengue activity across southern and coastal states." },
  { disease_name: "Cholera", status: "active", severity: "critical", first_reported: "2024-01-01T00:00:00Z", summary: "Protracted cholera crisis with ongoing transmission in conflict-affected areas." },
  { disease_name: "Measles", status: "active", severity: "severe", first_reported: "2025-09-01T00:00:00Z", summary: "Measles resurgence driven by vaccination gaps in border provinces." },
  { disease_name: "Measles", status: "active", severity: "critical", first_reported: "2025-04-01T00:00:00Z", summary: "Widespread measles outbreak affecting children under 5 with limited vaccine access." },
  { disease_name: "Polio (cVDPV2)", status: "active", severity: "severe", first_reported: "2025-02-01T00:00:00Z", summary: "Circulating vaccine-derived poliovirus with environmental detections." },
  { disease_name: "Polio (cVDPV2)", status: "active", severity: "severe", first_reported: "2025-07-01T00:00:00Z", summary: "Poliovirus detected amid disrupted healthcare infrastructure." },
  { disease_name: "H5N1 Avian Influenza", status: "monitoring", severity: "moderate", first_reported: "2025-01-15T00:00:00Z", summary: "Sporadic human H5N1 cases linked to poultry exposure. Monitoring for sustained transmission." },
  { disease_name: "H5N1 Avian Influenza", status: "active", severity: "moderate", first_reported: "2025-03-01T00:00:00Z", summary: "H5N1 detected in dairy cattle herds with sporadic human cases among farm workers." },
  { disease_name: "Ebola (Sudan)", status: "active", severity: "severe", first_reported: "2025-10-01T00:00:00Z", summary: "Sudan ebolavirus outbreak with active case finding and contact tracing." },
  { disease_name: "Cholera", status: "active", severity: "severe", first_reported: "2025-06-15T00:00:00Z", summary: "Ongoing cholera transmission amid water and sanitation infrastructure challenges." },
  { disease_name: "Dengue", status: "active", severity: "moderate", first_reported: "2025-07-01T00:00:00Z", summary: "Above-average dengue season with focus on vector control measures." },
  { disease_name: "Malaria", status: "active", severity: "severe", first_reported: "2025-01-01T00:00:00Z", summary: "Endemic malaria with seasonal surge exceeding response capacity." },
  { disease_name: "Diphtheria", status: "active", severity: "moderate", first_reported: "2025-08-15T00:00:00Z", summary: "Diphtheria outbreak in states with low routine immunization coverage." },
  { disease_name: "Measles", status: "active", severity: "severe", first_reported: "2025-05-01T00:00:00Z", summary: "Large measles outbreak among displaced populations with limited healthcare access." },
  { disease_name: "Dengue", status: "active", severity: "moderate", first_reported: "2025-11-01T00:00:00Z", summary: "Dengue cases rising with onset of rainy season across Java and Sumatra." },
  { disease_name: "Marburg Virus", status: "active", severity: "severe", first_reported: "2025-12-01T00:00:00Z", summary: "Marburg virus outbreak with active surveillance at borders." },
];

const locations = [
  { idx: 0, latitude: -4.0383, longitude: 21.7587, country: "DR Congo", region: "Eastern Provinces", case_count: 48251, severity_score: 0.95 },
  { idx: 1, latitude: -1.9403, longitude: 29.8739, country: "Rwanda", region: null, case_count: 3842, severity_score: 0.75 },
  { idx: 2, latitude: -3.3731, longitude: 29.9189, country: "Burundi", region: null, case_count: 2190, severity_score: 0.70 },
  { idx: 3, latitude: 0.5176, longitude: 34.8888, country: "Kenya", region: null, case_count: 845, severity_score: 0.50 },
  { idx: 4, latitude: 1.3733, longitude: 32.2903, country: "Uganda", region: null, case_count: 1203, severity_score: 0.55 },
  { idx: 5, latitude: 2.0469, longitude: 47.5321, country: "Somalia", region: "Banadir", case_count: 35000, severity_score: 0.90 },
  { idx: 6, latitude: 8.6268, longitude: 39.6682, country: "Ethiopia", region: "Oromia", case_count: 22000, severity_score: 0.80 },
  { idx: 7, latitude: 23.685, longitude: 90.3563, country: "Bangladesh", region: "Dhaka Division", case_count: 65000, severity_score: 0.72 },
  { idx: 8, latitude: -22.9068, longitude: -43.1729, country: "Brazil", region: "Rio de Janeiro", case_count: 980000, severity_score: 0.78 },
  { idx: 9, latitude: 19.4326, longitude: -99.1332, country: "Mexico", region: "Multiple States", case_count: 42000, severity_score: 0.55 },
  { idx: 10, latitude: 15.3694, longitude: 44.2075, country: "Yemen", region: null, case_count: 28000, severity_score: 0.88 },
  { idx: 11, latitude: 32.4279, longitude: 53.688, country: "Iran", region: null, case_count: 15200, severity_score: 0.65 },
  { idx: 12, latitude: 34.5553, longitude: 69.1761, country: "Afghanistan", region: "Multiple Provinces", case_count: 42300, severity_score: 0.85 },
  { idx: 13, latitude: 30.3753, longitude: 67.0011, country: "Pakistan", region: "Balochistan / KPK", case_count: 125, severity_score: 0.70 },
  { idx: 14, latitude: 31.3547, longitude: 34.3088, country: "Palestine", region: "Gaza", case_count: 89, severity_score: 0.72 },
  { idx: 15, latitude: 35.8617, longitude: 104.1954, country: "China", region: "Multiple Provinces", case_count: 18, severity_score: 0.45 },
  { idx: 16, latitude: 37.0902, longitude: -95.7129, country: "United States", region: "Multiple States", case_count: 72, severity_score: 0.48 },
  { idx: 17, latitude: -0.0236, longitude: 33.4297, country: "Uganda", region: "Central Region", case_count: 216, severity_score: 0.82 },
  { idx: 18, latitude: 18.9712, longitude: -72.2852, country: "Haiti", region: null, case_count: 18500, severity_score: 0.68 },
  { idx: 19, latitude: 15.87, longitude: 100.9925, country: "Thailand", region: null, case_count: 38000, severity_score: 0.52 },
  { idx: 20, latitude: -8.8383, longitude: 25.0136, country: "DR Congo", region: "Multiple Provinces", case_count: 2100000, severity_score: 0.76 },
  { idx: 21, latitude: 9.0579, longitude: 7.4898, country: "Nigeria", region: "Northern States", case_count: 4200, severity_score: 0.52 },
  { idx: 22, latitude: 2.0469, longitude: 45.0382, country: "Somalia", region: null, case_count: 19800, severity_score: 0.71 },
  { idx: 23, latitude: -6.2088, longitude: 106.8456, country: "Indonesia", region: "Java", case_count: 95000, severity_score: 0.58 },
  { idx: 24, latitude: -1.2921, longitude: 36.8219, country: "Kenya", region: "Western Kenya", case_count: 64, severity_score: 0.80 },
];

const reportSeed = [
  { idx: 0, source_type: "who", source_name: "WHO", title: "Mpox multi-country outbreak — Situation update", published_at: "2026-02-01T08:00:00Z" },
  { idx: 5, source_type: "who", source_name: "WHO", title: "Cholera situation in Somalia — Emergency response scaled up", published_at: "2026-02-01T06:30:00Z" },
  { idx: 8, source_type: "news", source_name: "Reuters", title: "Brazil declares emergency in three states as dengue cases surge", published_at: "2026-02-01T04:15:00Z" },
  { idx: 16, source_type: "cdc", source_name: "CDC", title: "H5N1 bird flu — Updated case count and dairy herd monitoring", published_at: "2026-01-31T22:00:00Z" },
  { idx: 17, source_type: "who", source_name: "WHO", title: "Sudan ebolavirus disease — Uganda situation report #14", published_at: "2026-01-31T18:45:00Z" },
  { idx: 12, source_type: "who", source_name: "WHO", title: "Measles vaccination campaign reaches 2.1M children in Afghanistan", published_at: "2026-01-31T14:00:00Z" },
  { idx: 24, source_type: "news", source_name: "BBC", title: "Kenya strengthens border screening as Marburg cases confirmed", published_at: "2026-01-31T11:20:00Z" },
  { idx: 14, source_type: "who", source_name: "WHO", title: "Polio vaccination round completed in Gaza amid ongoing challenges", published_at: "2026-01-31T09:00:00Z" },
  { idx: 7, source_type: "news", source_name: "Al Jazeera", title: "Bangladesh hospitals overwhelmed as dengue cases hit new record", published_at: "2026-01-30T20:30:00Z" },
  { idx: 18, source_type: "news", source_name: "AP News", title: "Haiti cholera response hampered by security situation", published_at: "2026-01-30T16:00:00Z" },
];

async function seed() {
  console.log("Seeding outbreaks...");
  const insertedOutbreaks = await insert("outbreaks", outbreaks);
  if (!insertedOutbreaks) {
    console.error("Failed to insert outbreaks. Have you run the migration SQL in the Supabase dashboard?");
    process.exit(1);
  }
  console.log(`  Inserted ${insertedOutbreaks.length} outbreaks`);

  console.log("Seeding outbreak locations...");
  const locData = locations.map((l) => ({
    outbreak_id: insertedOutbreaks[l.idx].id,
    latitude: l.latitude,
    longitude: l.longitude,
    country: l.country,
    region: l.region,
    case_count: l.case_count,
    severity_score: l.severity_score,
  }));
  const insertedLocs = await insert("outbreak_locations", locData);
  if (!insertedLocs) {
    console.error("Failed to insert locations");
    process.exit(1);
  }
  console.log(`  Inserted ${insertedLocs.length} locations`);

  console.log("Seeding reports...");
  const repData = reportSeed.map((r) => ({
    outbreak_id: insertedOutbreaks[r.idx].id,
    source_type: r.source_type,
    source_name: r.source_name,
    title: r.title,
    published_at: r.published_at,
  }));
  const insertedReports = await insert("reports", repData);
  if (!insertedReports) {
    console.error("Failed to insert reports");
    process.exit(1);
  }
  console.log(`  Inserted ${insertedReports.length} reports`);

  console.log("\nDone! Database seeded successfully.");
}

seed().catch(console.error);
