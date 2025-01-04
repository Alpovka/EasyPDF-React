# @easypdf/react

<div align="center">
  <img src="logo.svg" width="100" height="100" alt="EasyPdf Logo" />
</div>

React PDF Generation Made Simple

## Features

- **Visual Mode**: Design your content in React and get it as PDF instantly
- **Programmatic Mode**: Generate PDFs dynamically using React components
- **Flexible Configuration**: Customize page size, orientation, margins, and more
- **Watermarks**: Apply text watermarks with customizable styles
- **Type Safety**: Written in TypeScript with comprehensive type definitions
- **React Hooks**: Intuitive hooks for managing PDF generation state
- **High Performance**: Optimized for handling large documents

## Installation

```bash
npm install @easypdf/react
# or
yarn add @easypdf/react
```

## Quick Start

1. Initialize EasyPdf in your app:

```tsx
import { EasyPdfProvider, EasyPdf } from "@easypdf/react";

// Initialize with your license key
const easyPdf = EasyPdf.initialize("your-license-key");

function App() {
  return (
    <EasyPdfProvider instance={easyPdf}>
      <YourApp />
    </EasyPdfProvider>
  );
}
```

2. Create your first PDF:

```tsx
import React from "react";
import { useEasyPdf } from "@easypdf/react";

const PDFGenerator = () => {
  const { pdfRef, downloadPDF, isDownloadingPDF } = useEasyPdf();

  const handleDownload = async () => {
    try {
      await downloadPDF(pdfRef, {
        filename: "example.pdf",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={isDownloadingPDF}>
        {isDownloadingPDF ? "Generating..." : "Download PDF"}
      </button>

      {/* Content container with pdfRef */}
      <div ref={pdfRef}>
        <h1>Hello, PDF!</h1>
        <p>This is a simple PDF document.</p>
      </div>
    </div>
  );
};
```

## Configuration

```tsx
const config = {
  // Page settings
  pageSize: "A4",
  orientation: "portrait",
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Container styling
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

  // Optional watermark
  watermark: {
    text: "CONFIDENTIAL",
    fontSize: 60,
    opacity: 0.2,
  },
};
```

## Documentation

For detailed documentation, visit our [documentation site](https://easypdf.dev).

## License

This project is licensed under a proprietary license. See [LICENSE](./LICENSE) for details.
