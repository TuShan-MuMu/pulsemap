import { RawOutbreakReport } from "./types";
import { safeJsonResponse } from "./validate";

export const WHO_BASE_URL =
  "https://www.who.int/api/hubs/diseaseoutbreaknews";

const WHO_LATEST_URL =
  `${WHO_BASE_URL}?$orderby=PublicationDate%20desc&$top=50&$select=DonId,Title,PublicationDate,Summary,UrlName`;

// Known disease keywords to extract from titles
const DISEASE_PATTERNS: [RegExp, string][] = [
  [/cholera/i, "Cholera"],
  [/ebola/i, "Ebola"],
  [/marburg/i, "Marburg Virus"],
  [/mpox|monkeypox/i, "Mpox"],
  [/measles/i, "Measles"],
  [/dengue/i, "Dengue"],
  [/yellow fever/i, "Yellow Fever"],
  [/plague/i, "Plague"],
  [/avian influenza|h5n1|bird flu/i, "H5N1 Avian Influenza"],
  [/influenza a\(h1n1\)|h1n1/i, "Influenza A (H1N1)"],
  [/polio/i, "Polio"],
  [/meningitis|meningococcal/i, "Meningitis"],
  [/lassa fever/i, "Lassa Fever"],
  [/rift valley fever/i, "Rift Valley Fever"],
  [/diphtheria/i, "Diphtheria"],
  [/malaria/i, "Malaria"],
  [/zika/i, "Zika"],
  [/chikungunya/i, "Chikungunya"],
  [/covid|sars-cov/i, "COVID-19"],
  [/hepatitis/i, "Hepatitis"],
  [/nipah/i, "Nipah Virus"],
  [/mers/i, "MERS-CoV"],
  [/oropouche/i, "Oropouche"],
  [/respiratory syndrome/i, "MERS-CoV"],
];

export function extractDisease(title: string): string {
  for (const [pattern, name] of DISEASE_PATTERNS) {
    if (pattern.test(title)) return name;
  }
  return "Unknown Disease";
}

export function extractCountry(title: string): string {
  // WHO DON titles follow pattern: "Disease name - Country" or "Disease name- Country"
  // Use the LAST dash-separator to avoid matching hyphens inside disease names (COVID-19, MERS-CoV)
  const dashMatch = title.match(/.*[-–—]\s*(.+?)$/);
  if (dashMatch) {
    const country = dashMatch[1].trim();
    // Clean up common suffixes
    return country
      .replace(/\s*\(update\)/i, "")
      .replace(/\s*\(situation update\)/i, "")
      .replace(/\s*update$/i, "")
      .replace(/Global$/i, "Global")
      .trim();
  }
  return "Unknown";
}

export function estimateSeverity(title: string, summary: string): "low" | "moderate" | "severe" | "critical" {
  const text = `${title} ${summary}`.toLowerCase();

  // Look for explicit risk assessments in WHO summaries
  if (text.includes("risk is high") || text.includes("public health emergency")) return "critical";
  if (text.includes("risk is moderate")) return "severe";
  if (text.includes("risk is low")) return "moderate";

  // Keyword-based fallback
  if (text.includes("death") || text.includes("fatal") || text.includes("emergency")) return "critical";
  if (text.includes("outbreak") || text.includes("surge") || text.includes("spreading")) return "severe";
  if (text.includes("cases") || text.includes("detected")) return "moderate";
  return "low";
}

export interface WHODon {
  DonId: string;
  Title: string;
  PublicationDate: string;
  Summary: string;
  UrlName: string;
}

/**
 * 从文本中提取案例数
 * 支持多种格式：
 * - "19,161例疑似麻疹病例"
 * - "48.3K cases"
 * - "2897 例实验室确诊"
 * - "approximately 5000 cases"
 */
function extractCaseCount(text: string): number | null {
  if (!text) return null;
  
  const normalized = text.replace(/,/g, '').replace(/[ \u00A0]/g, ' ');
  
  // 多种匹配模式（按优先级）
  const patterns = [
    // 格式: "19,161例疑似麻疹病例" 或 "2897 例实验室确诊"
    /(\d+(?:\.\d+)?(?:K|k)?)\s*例?(?:疑似|实验室确诊|确诊病例?)?\s*(?:麻疹|病例)/i,
    // 格式: "48.3K cases" 或 "19161 cases"
    /(\d+(?:\.\d+)?(?:K|k)?)\s*cases?/i,
    // 格式: "19161 confirmed cases"
    /(\d+(?:\.\d+)?)\s*(?:confirmed|reported|total|cases?|病例|确诊)/i,
    // 格式: "approximately 5000" 或 "about 5000"
    /(?:\~|approximately|about|around|approx(?:\.|imately)?)\s*(\d+(?:\.\d+)?(?:K|k)?)/i,
    // 纯数字（作为最后的 fallback，至少3位数）
    /(\d{3,}(?:\.\d+)?(?:K|k)?)(?:\s|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let numStr = match[1];
      let multiplier = 1;
      
      // 处理 K 后缀 (如 48.3K = 48300)
      if (numStr.endsWith('K') || numStr.endsWith('k')) {
        multiplier = 1000;
        numStr = numStr.slice(0, -1);
      }
      
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        return Math.round(num * multiplier);
      }
    }
  }
  return null;
}

export async function fetchWHOOutbreaks(): Promise<RawOutbreakReport[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(WHO_LATEST_URL, {
      headers: { "User-Agent": "PulseMap/1.0 (health-surveillance-dashboard)" },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`WHO API fetch failed: ${res.status}`);
      return [];
    }

    const parsed = await safeJsonResponse<{ value?: WHODon[] }>(res, "WHO API");
    if (!parsed.ok) {
      console.error(`WHO API parse error: ${parsed.error}`);
      return [];
    }
    const items: WHODon[] = parsed.data.value || [];
    const reports: RawOutbreakReport[] = [];

    for (const item of items) {
      const disease = extractDisease(item.Title);
      const country = extractCountry(item.Title);
      const severity = estimateSeverity(item.Title, item.Summary || "");

      // 提取案例数：优先从 Summary 中提取，其次从 Title 中尝试
      let caseCount = extractCaseCount(item.Summary || "");
      if (caseCount === null) {
        caseCount = extractCaseCount(item.Title);
      }

      // Skip global updates without a specific country
      if (country === "Global" || country === "Global update") continue;

      reports.push({
        disease_name: disease,
        country,
        region: null,
        title: item.Title,
        summary: (item.Summary || "").substring(0, 500),
        url: `https://www.who.int/emergencies/disease-outbreak-news/item/${item.UrlName}`,
        source_type: "who",
        source_name: "WHO",
        published_at: new Date(item.PublicationDate).toISOString(),
        severity_hint: severity,
        case_count: caseCount,
      });
    }

    console.log(`WHO: Parsed ${reports.length} outbreak reports from ${items.length} DON items`);
    return reports;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("WHO API request timed out after 15s");
    } else {
      console.error("WHO API parser error:", error);
    }
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch WHO DON items within a date range (used by backfill endpoint).
 * Shares extractors with fetchWHOOutbreaks — single source of truth.
 */
export async function fetchWHOByDateRange(
  startDate: string,
  endDate: string,
  limit: number
): Promise<RawOutbreakReport[]> {
  const filter = `PublicationDate ge ${startDate}T00:00:00Z and PublicationDate le ${endDate}T23:59:59Z`;
  const params = new URLSearchParams({
    $filter: filter,
    $orderby: "PublicationDate desc",
    $top: String(limit),
    $select: "DonId,Title,PublicationDate,Summary,UrlName",
  });

  const url = `${WHO_BASE_URL}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "PulseMap/1.0 (health-surveillance-dashboard)" },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`WHO API returned ${res.status}: ${res.statusText}`);
    }

    const parsed = await safeJsonResponse<{ value?: WHODon[] }>(res, "WHO backfill");
    if (!parsed.ok) {
      throw new Error(`WHO backfill parse error: ${parsed.error}`);
    }
    return parseWHOItems(parsed.data.value || []);
  } finally {
    clearTimeout(timeout);
  }
}

/** Shared WHO DON item → RawOutbreakReport mapper */
function parseWHOItems(items: WHODon[]): RawOutbreakReport[] {
  const reports: RawOutbreakReport[] = [];
  for (const item of items) {
    const disease = extractDisease(item.Title);
    const country = extractCountry(item.Title);
    const severity = estimateSeverity(item.Title, item.Summary || "");
    
    // 提取案例数：优先从 Summary 中提取，其次从 Title 中尝试
    let caseCount = extractCaseCount(item.Summary || "");
    if (caseCount === null) {
      caseCount = extractCaseCount(item.Title);
    }

    if (country === "Global" || country === "Global update") continue;

    reports.push({
      disease_name: disease,
      country,
      region: null,
      title: item.Title,
      summary: (item.Summary || "").substring(0, 500),
      url: `https://www.who.int/emergencies/disease-outbreak-news/item/${item.UrlName}`,
      source_type: "who",
      source_name: "WHO",
      published_at: new Date(item.PublicationDate).toISOString(),
      severity_hint: severity,
      case_count: caseCount,
    });
  }
  return reports;
}