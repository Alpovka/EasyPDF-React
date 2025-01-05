import { PDFConfig } from "../types/config";

export const defaultConfig: PDFConfig = {
  // Page Configuration
  pageSize: "A4",
  orientation: "portrait",
  margins: {
    top: 30,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Metadata
  metadata: {
    title: "Generated Document",
    author: "EasyPdf",
    creator: "EasyPdf Generator",
  },

  // Watermark
  watermark: {
    text: "Easy PDF Watermark",
  },

  // Export Options
  scale: 2,

  footer: {
    text: `Page {pageNumber} of {totalPages}`,
    marginBottom: 10,
    marginLeft: 20,
    marginRight: 20,
    align: "center",
  },

  header: {
    text: `Easy PDF Header`,
    marginTop: 10,
    marginLeft: 20,
    marginRight: 20,
    align: "center",
  },

  // Enhanced Styling
  styles: {
    backgroundColor: "#ffffff",
    defaultFontSize: 12,
    defaultFontFamily: "Arial, sans-serif",
    defaultTextColor: "#333333",
    customCSS: "",
  },
};
