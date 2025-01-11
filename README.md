# EasyPdf React

<div align="center">
  <img src="logo.svg" alt="EasyPdf Logo" width="200" />
  <h1>EasyPdf React</h1>
  <p><strong>Free and open source React library for generating beautiful PDFs from React components</strong></p>
</div>

<div align="center">
  <a href="https://www.npmjs.com/package/@easypdf/react">
    <img src="https://img.shields.io/npm/v/@easypdf/react.svg" alt="npm version" />
  </a>
  <a href="https://github.com/alpovka/easypdf/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <a href="https://www.npmjs.com/package/@easypdf/react">
    <img src="https://img.shields.io/npm/dm/@easypdf/react.svg" alt="npm downloads" />
  </a>
</div>

## Features

- 🎨 **Visual Mode**: Design PDFs using React components with real-time preview
- 🚀 **Programmatic Mode**: Generate PDFs dynamically with programmatic content creation
- 📝 **Rich Text Support**: Full support for text formatting, lists, tables, and more
- 🖼️ **Image Support**: Include images in your PDFs with automatic optimization
- 🎯 **Page Breaking**: Smart page breaking algorithm for optimal content flow
- 💅 **Styling**: Full CSS support including flexbox and grid layouts
- 🎭 **Themes**: Built-in themes and support for custom themes
- 📏 **Headers & Footers**: Customizable headers and footers
- 💧 **Watermarks**: Add text or image watermarks
- 📱 **Responsive**: Adapts to different page sizes and orientations

## Installation

```bash
npm install @easypdf/react
# or
yarn add @easypdf/react
```

## Quick Start

```tsx
import { EasyPdfProvider, EasyPdf } from "@easypdf/react";

// Initialize EasyPdf
const easyPdf = EasyPdf.initialize();

function App() {
  return (
    <EasyPdfProvider instance={easyPdf}>
      <YourApp />
    </EasyPdfProvider>
  );
}
```

## Basic Usage

```tsx
import { useEasyPdf } from "@easypdf/react";

function PDFGenerator() {
  const { pdfRef, downloadPDF } = useEasyPdf();

  return (
    <div>
      <button onClick={() => downloadPDF(pdfRef)}>Download PDF</button>

      <div ref={pdfRef}>
        <h1>Hello, PDF!</h1>
        <p>This content will be converted to PDF.</p>
      </div>
    </div>
  );
}
```

## Documentation

Visit our [documentation](https://easypdf.vercel.app/docs) for detailed guides and examples.

## Examples

- [Basic Usage](https://easypdf.vercel.app/docs/examples/basic-usage)
- [Visual Mode](https://easypdf.vercel.app/docs/examples/visual-mode)
- [Programmatic Mode](https://easypdf.vercel.app/docs/examples/programmatic-mode)
- [Custom Styling](https://easypdf.vercel.app/docs/examples/styling)
- [Headers and Footers](https://easypdf.vercel.app/docs/examples/headers-footers)
- [Watermarks](https://easypdf.vercel.app/docs/examples/watermarks)
- [Page Breaking](https://easypdf.vercel.app/docs/examples/page-breaking)
- [Tables](https://easypdf.vercel.app/docs/examples/tables)
- [Images](https://easypdf.vercel.app/docs/examples/images)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://easypdf.vercel.app/docs)
- 🐛 [Issues](https://github.com/alpovka/easypdf/issues)

## Author

- Alperen Karavelioğlu ([@alpovka](https://github.com/alpovka))

## Acknowledgments

Special thanks to all our contributors and the open source community.
