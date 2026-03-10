import type { CSSProperties } from "react";

export type PageSize =
  | "A4"
  | "A3"
  | "LETTER"
  | "LEGAL"
  | { width: number; height: number };

export interface PDFConfig {
  pageSize?: PageSize;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  filename?: string;
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
  scale?: number;
  styles?: {
    backgroundColor?: string;
    defaultFontSize?: number;
    defaultFontFamily?: string;
    defaultTextColor?: string;
    customCSS?: string;
  };
  header?: {
    text: string | string[];
    fontSize?: number;
    fontColor?: string;
    marginTop?: number;
    marginLeft?: number;
    marginRight?: number;
    align?: "left" | "center" | "right";
  };
  footer?: {
    text: string | string[];
    fontSize?: number;
    fontColor?: string;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    align?: "left" | "center" | "right";
  };
  container?: {
    className?: string;
    style?: CSSProperties;
  };
}
