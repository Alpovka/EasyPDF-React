# EasyPdf React

<div align="center">
  <img src="logo.svg" alt="EasyPdf Logo" width="120" />
  <h3>Free, open-source React library for generating PDFs from React components</h3>
</div>

<div align="center">
  <a href="https://www.npmjs.com/package/@easypdf/react">
    <img src="https://img.shields.io/npm/v/@easypdf/react.svg" alt="npm version" />
  </a>
  <a href="https://github.com/Alpovka/EasyPDF-React/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <a href="https://www.npmjs.com/package/@easypdf/react">
    <img src="https://img.shields.io/npm/dm/@easypdf/react.svg" alt="npm downloads" />
  </a>
</div>

<div align="center">
  <a href="https://easypdf.vercel.app/demo/">Demo</a> ·
  <a href="https://easypdf.vercel.app/docs/">Documentation</a>
</div>

---

## Features

- **Visual Mode** — attach a ref to any element and download it as a PDF
- **Programmatic Mode** — pass JSX to `createPDF` / `createPDFBlob` without rendering to screen
- **Headers & Footers** — text drawn on every page, with `{pageNumber}` / `{totalPages}` variables
- **Watermarks** — diagonal text stamped across every page
- **Smart Page Breaking** — tables, images, lists, and `.no-break` elements are never split
- **Full CSS Support** — inline styles, CSS classes, Tailwind, MUI, custom fonts — whatever the browser renders
- **SSR Safe** — no browser globals at import time; PDF generation is browser-only and guarded
- **React 18 & 19** — works with both versions

## Installation

```bash
npm install @easypdf/react
```

## Visual Mode

Attach `pdfRef` to any element and call `downloadPDF`:

```tsx
import { useEasyPdf } from "@easypdf/react";

function PDFGenerator() {
  const { pdfRef, downloadPDF, isLoading } = useEasyPdf();

  return (
    <div>
      <button onClick={() => downloadPDF(pdfRef, { filename: "document.pdf" })} disabled={isLoading}>
        {isLoading ? "Generating..." : "Download PDF"}
      </button>

      <div ref={pdfRef}>
        <h1>Hello, PDF!</h1>
        <p>This content will be captured as a PDF.</p>
      </div>
    </div>
  );
}
```

## Programmatic Mode

Generate a PDF from JSX without rendering it to the screen:

```tsx
import { useEasyPdf } from "@easypdf/react";

function InvoiceExporter({ data }) {
  const { createPDF, isLoading } = useEasyPdf();

  const handleExport = () =>
    createPDF(
      <div style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
        <h1>Invoice #{data.id}</h1>
        <p>Amount: ${data.total}</p>
      </div>,
      { filename: `invoice-${data.id}.pdf` }
    );

  return (
    <button onClick={handleExport} disabled={isLoading}>
      {isLoading ? "Generating..." : "Export Invoice"}
    </button>
  );
}
```

## Configuration

All options are optional. Pass config to `useEasyPdf()` for hook-level defaults or directly to each method call.

```tsx
const { pdfRef, downloadPDF } = useEasyPdf({
  pageSize: "A4",                           // "A4" | "A3" | "LETTER" | "LEGAL" | { width, height }
  margins: { top: 20, right: 20, bottom: 20, left: 20 }, // mm
  scale: 2,                                 // canvas resolution multiplier
  filename: "document.pdf",
  styles: {
    backgroundColor: "#ffffff",
    defaultFontFamily: "Arial, sans-serif",
    defaultFontSize: 13,
    defaultTextColor: "#333333",
    customCSS: ".highlight { background: #fef9c3; }",
  },
  container: {
    style: { width: "800px", margin: "0 auto" },
  },
  header: {
    text: "My Company — Report",
    fontSize: 10,
    fontColor: "#666666",
    align: "center",         // "left" | "center" | "right"
    marginTop: 10,
  },
  footer: {
    text: "Page {pageNumber} of {totalPages}",
    fontSize: 10,
    align: "center",
    marginBottom: 10,
  },
  watermark: {
    text: "CONFIDENTIAL",
    fontSize: 60,
    color: "#888888",
    opacity: 0.15,           // 0–1
    angle: -45,              // degrees
  },
  metadata: {
    title: "Q1 Report",
    author: "Finance Team",
    subject: "Quarterly summary",
    keywords: ["finance", "Q1"],
  },
});
```

## Hook Return Values

| Name            | Type                                                                              | Description                                  |
| --------------- | --------------------------------------------------------------------------------- | -------------------------------------------- |
| `pdfRef`        | `RefObject<HTMLDivElement>`                                                       | Attach to the element to capture             |
| `downloadPDF`   | `(source: RefObject \| Blob \| string \| null, config?) => Promise<void>`         | Capture ref or download a Blob               |
| `createPDF`     | `(content: ReactNode, config?) => Promise<void>`                                  | Render JSX off-screen and download           |
| `createPDFBlob` | `(content: ReactNode, config?) => Promise<Blob>`                                  | Render JSX off-screen and return a Blob      |
| `viewPDF`       | `(content: ReactNode \| Blob, config?) => Promise<void>`                          | Open PDF in a new browser tab                |
| `isLoading`     | `boolean`                                                                         | `true` while any PDF operation is running    |
| `error`         | `Error \| null`                                                                   | Error from the last failed operation         |

## Documentation

Full docs at **[easypdf.vercel.app/docs/](https://easypdf.vercel.app/docs/)**

## License

MIT © [Alperen Karavelioğlu](https://github.com/Alpovka)
