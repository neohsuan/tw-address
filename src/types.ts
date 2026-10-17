/** A postal district record from the bundled 2016-08-12 official three-digit table. */
export interface DistrictRecord {
  readonly county: string;
  readonly district: string;
  readonly zip3: string;
}

/** Text normalization settings. */
export interface NormalizeOptions {
  /** Convert numeric hyphens before 號/樓/室/巷/弄 and floor subnumbers (5樓-2) to 之. Default: true. */
  hyphenToZhi?: boolean;
}

/** Formatting settings. */
export interface FormatOptions {
  /** false: omit ZIP; true: use zip or inferred zip3; omitted: preserve input zip only. */
  zip?: boolean;
}

/** Recognized components include their Chinese suffixes (for example 12號 or 四段). */
export interface AddressParts {
  /** Original postal digits (3, 5 or 6 digits), with a separating hyphen removed. */
  zip?: string;
  /** Input ZIP's first three digits, or a code inferred from the recognized district. */
  zip3?: string;
  county?: string;
  district?: string;
  village?: string;
  neighborhood?: string;
  road?: string;
  section?: string;
  lane?: string;
  alley?: string;
  number?: string;
  floor?: string;
  /** Includes 室, or a leading 之 when following 樓 (for example 之2). */
  room?: string;
  /** Unparsed trailing text, retained verbatim after text normalization. */
  rest?: string;
}

/** Best-effort result; validity describes structural consistency, not deliverability. */
export interface ParsedAddress extends AddressParts {
  /** Canonical formatting, preserving input ZIP and including any inferred administration. */
  normalized: string;
  /** True when county, district and number exist and no warnings remain. */
  valid: boolean;
  /** Stable warning codes; see the README for their meanings. */
  warnings: string[];
}
