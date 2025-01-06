<div align="center">
  <img src="logo.svg" width="100" height="100" alt="EasyPdf Logo" />
  
  # @easypdf/react
  
  📄 React PDF Generation Made Simple
  
  [![npm version](https://badge.fury.io/js/%40easypdf%2Freact.svg)](https://www.npmjs.com/package/@easypdf/react)
  [![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](./LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
  
</div>

---

## Features

- **Visual & Programmatic Modes**: Design PDFs visually with React components or generate them programmatically
- **Smart Page Breaking**: Intelligent handling of tables, images, and text across pages
- **Flexible Configuration**: Extensive customization for page layout, styling, headers, footers, and watermarks
- **Type Safety**: Written in TypeScript with comprehensive type definitions
- **High Performance**: Optimized for large documents with efficient page breaks and image handling
- **Error Handling**: Built-in error states and loading indicators

## Installation

```bash
npm install @easypdf/react
# or
yarn add @easypdf/react
```

## Quick Start

1. Initialize EasyPdf in your app:

```tsx
import { useRoutes } from "react-router-dom";
import { EasyPdfProvider, EasyPdf } from "@easypdf/react";

// Initialize with your license key
const easyPdf = EasyPdf.initialize("your-license-key");

export default function App() {
  const element = useRoutes(routes);
  return <EasyPdfProvider instance={easyPdf}>{element}</EasyPdfProvider>;
}
```

2. Create your first PDF:

```tsx
import { useEasyPdf } from "@easypdf/react";

function PDFGenerator() {
  const { pdfRef, downloadPDF, isDownloadingPDF, error } = useEasyPdf({
    // Hook-level configuration (optional)
    pageSize: "A4",
    watermark: {
      text: "DRAFT",
      opacity: 0.2,
    },
  });

  return (
    <div>
      <button
        onClick={() => downloadPDF(pdfRef, { filename: "document.pdf" })}
        disabled={isDownloadingPDF}
      >
        {isDownloadingPDF ? "Generating..." : "Download PDF"}
      </button>

      {error && <div style={{ color: "red" }}>Error: {error.message}</div>}

      <div ref={pdfRef}>
        <h1>Hello, PDF!</h1>
        <p>This is a simple PDF document.</p>
      </div>
    </div>
  );
}
```

## Configuration

Configuration can be provided at the hook level or method level:

```tsx
// Hook-level configuration
const { pdfRef, downloadPDF } = useEasyPdf({
  // Page settings
  pageSize: "A4",
  orientation: "portrait",
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Content sizing (optional, adapts to page size by default)
  container: {
    style: {
      width: "800px",
      margin: "0 auto",
    },
  },

  // Styling
  styles: {
    backgroundColor: "#ffffff",
    defaultFontSize: 12,
    defaultFontFamily: "Arial, sans-serif",
    defaultTextColor: "#333333",
  },

  // Headers & Footers
  header: {
    text: "Document Header",
    fontSize: 12,
    marginTop: 20,
  },
  footer: {
    text: "Page {pageNumber} of {totalPages}",
    fontSize: 10,
    marginBottom: 20,
  },

  // Watermark
  watermark: {
    text: "CONFIDENTIAL",
    fontSize: 60,
    opacity: 0.2,
    angle: -45,
  },
});

// Method-level configuration (merges with hook config)
await downloadPDF(pdfRef, {
  filename: "document.pdf",
  watermark: {
    opacity: 0.3, // Overrides hook config
  },
});
```

## Documentation

For detailed documentation, visit our [documentation site](https://easypdf.vercel.app/docs).

## License

This project is licensed under a proprietary license. A license key is required for usage. See [LICENSE](./LICENSE) for details.
