export type PageSize =
  | "A4"
  | "A3"
  | "LETTER"
  | "LEGAL"
  | { width: number; height: number };

export interface PDFConfig {
  // Page Configuration
  pageSize?: PageSize;
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

  // Header and Footer
  header?: {
    text: string | string[];
    fontSize?: number;
    fontColor?: string;
    marginTop?: number | 0;
    marginLeft?: number | 0;
    marginRight?: number | 0;
    align?: "left" | "center" | "right";
  };
  footer?: {
    text: string | string[];
    fontSize?: number;
    fontColor?: string;
    marginBottom?: number | 0;
    marginLeft?: number | 0;
    marginRight?: number | 0;
    align?: "left" | "center" | "right";
  };

  container?: {
    className?: string;
    style?: React.CSSProperties;
  };
}
