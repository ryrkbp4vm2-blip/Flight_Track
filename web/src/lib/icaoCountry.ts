// Maps a 24-bit ICAO aircraft address (hex) to a registration country, using
// the published ICAO address-block allocations. Compact range table covering
// the major military-flying nations; unknown blocks return null.

interface Block {
  start: number;
  end: number;
  country: string;
  flag: string;
}

// Ranges are inclusive, expressed as 24-bit hex values.
const BLOCKS: Block[] = [
  { start: 0xa00000, end: 0xafffff, country: "United States", flag: "🇺🇸" },
  { start: 0xc00000, end: 0xc3ffff, country: "Canada", flag: "🇨🇦" },
  { start: 0x400000, end: 0x43ffff, country: "United Kingdom", flag: "🇬🇧" },
  { start: 0x3c0000, end: 0x3fffff, country: "Germany", flag: "🇩🇪" },
  { start: 0x380000, end: 0x3bffff, country: "France", flag: "🇫🇷" },
  { start: 0x300000, end: 0x33ffff, country: "Italy", flag: "🇮🇹" },
  { start: 0x340000, end: 0x37ffff, country: "Spain", flag: "🇪🇸" },
  { start: 0x480000, end: 0x4bffff, country: "Netherlands", flag: "🇳🇱" },
  { start: 0x4a0000, end: 0x4affff, country: "Sweden", flag: "🇸🇪" },
  { start: 0x460000, end: 0x467fff, country: "Finland", flag: "🇫🇮" },
  { start: 0x478000, end: 0x47ffff, country: "Norway", flag: "🇳🇴" },
  { start: 0x4b8000, end: 0x4bffff, country: "Switzerland", flag: "🇨🇭" },
  { start: 0x440000, end: 0x447fff, country: "Austria", flag: "🇦🇹" },
  { start: 0x448000, end: 0x44ffff, country: "Belgium", flag: "🇧🇪" },
  { start: 0x4c0000, end: 0x4c7fff, country: "Portugal", flag: "🇵🇹" },
  { start: 0x4ca000, end: 0x4cafff, country: "Ireland", flag: "🇮🇪" },
  { start: 0x470000, end: 0x4777ff, country: "Bosnia", flag: "🇧🇦" },
  { start: 0x150000, end: 0x1fffff, country: "Russia", flag: "🇷🇺" },
  { start: 0x780000, end: 0x7bffff, country: "China", flag: "🇨🇳" },
  { start: 0x840000, end: 0x87ffff, country: "Japan", flag: "🇯🇵" },
  { start: 0x718000, end: 0x71ffff, country: "South Korea", flag: "🇰🇷" },
  { start: 0x800000, end: 0x83ffff, country: "India", flag: "🇮🇳" },
  { start: 0x7c0000, end: 0x7fffff, country: "Australia", flag: "🇦🇺" },
  { start: 0xc8000, end: 0xc87fff, country: "New Zealand", flag: "🇳🇿" },
  { start: 0xe00000, end: 0xe3ffff, country: "Brazil", flag: "🇧🇷" },
  { start: 0x0a0000, end: 0x0a7fff, country: "South Africa", flag: "🇿🇦" },
  { start: 0x738000, end: 0x73ffff, country: "Israel", flag: "🇮🇱" },
  { start: 0x710000, end: 0x717fff, country: "Saudi Arabia", flag: "🇸🇦" },
  { start: 0x768000, end: 0x76ffff, country: "Qatar", flag: "🇶🇦" },
  { start: 0x896000, end: 0x896fff, country: "UAE", flag: "🇦🇪" },
  { start: 0x4d0000, end: 0x4d03ff, country: "Turkey", flag: "🇹🇷" },
  { start: 0x4ba000, end: 0x4bafff, country: "Turkey", flag: "🇹🇷" },
  { start: 0xe80000, end: 0xe80fff, country: "Chile", flag: "🇨🇱" },
  { start: 0xe40000, end: 0xe7ffff, country: "Argentina", flag: "🇦🇷" },
  { start: 0x0d0000, end: 0x0d7fff, country: "Mexico", flag: "🇲🇽" },
];

export interface IcaoOrigin {
  country: string;
  flag: string;
}

export function icaoCountry(hex: string): IcaoOrigin | null {
  const n = parseInt(hex, 16);
  if (!Number.isFinite(n)) return null;
  for (const b of BLOCKS) {
    if (n >= b.start && n <= b.end) return { country: b.country, flag: b.flag };
  }
  return null;
}

// Operating-navy name → flag, for vessel detail. Covers the curated fleet.
const NAVY_FLAG: Record<string, string> = {
  USA: "🇺🇸",
  UK: "🇬🇧",
  France: "🇫🇷",
  Italy: "🇮🇹",
  Netherlands: "🇳🇱",
  Japan: "🇯🇵",
  India: "🇮🇳",
  Australia: "🇦🇺",
  Russia: "🇷🇺",
  China: "🇨🇳",
  "South Korea": "🇰🇷",
  Canada: "🇨🇦",
  Spain: "🇪🇸",
  Turkey: "🇹🇷",
  Brazil: "🇧🇷",
};

export function countryFlag(name: string | undefined): string {
  return name ? (NAVY_FLAG[name] ?? "🏳️") : "";
}
