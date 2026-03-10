import { PDFConfig } from "./config";

export const defaultConfig: PDFConfig = {
  pageSize: "A4",
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  scale: 2,
  styles: {
    backgroundColor: "#ffffff",
  },
};
