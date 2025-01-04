export type PageSize =
  | "A4"
  | "A3"
  | "LETTER"
  | "LEGAL"
  | { width: number; height: number };

export interface PDFConfig {
  // Page Configuration
  pageSize?: PageSize;
  orientation?: "portrait" | "landscape";
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  filename?: string;

  // Metadata
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  };

  watermark?: {
    text: string;
    fontSize?: number;
    color?: string;
    opacity?: number;
    angle?: number;
  };
  fonts?: Array<{
    family: string;
    source: string;
    weight?: string;
    style?: string;
  }>;

  // Export Options
  scale?: number;

  // Enhanced Styling
  styles?: {
    backgroundColor?: string;
    defaultFontSize?: number;
    defaultFontFamily?: string;
    defaultTextColor?: string;
    customCSS?: string;
  };

  pageBreaks?: {
    mode: "auto" | "manual" | "both";
    autoBreakHeight?: number;
    avoidBreakInside?: string[];
    manualBreakClass?: string;
  };

  container?: {
    className?: string;
    style?: React.CSSProperties;
  };
}
