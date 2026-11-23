/** Design tokens from the Vixir canvas (steering ui-design.md). */
export const color = {
  primary: '#2448D8', primaryStrong: '#1A36A8', primarySoft: '#EAEFFE',
  ink: '#0E1726', muted: '#5B6576', border: '#E3E8EF', page: '#F5F7FA', surface: '#FFFFFF',
  warning: '#C2410C', warningSoft: '#FFF1E6', success: '#15803D', successSoft: '#E8F6EC',
  lab: { bg: '#0B1220', panel: '#121A2B', raised: '#0E1626', line: '#22304A', text: '#E6EBF5', muted: '#93A0B8' },
  subject: { physics: '#93B4FF', chemistry: '#FDBA74', biology: '#4ADE80', electronics: '#2DD4BF', engineering: '#D8B4FE' },
} as const;

export const font = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20 } as const;
