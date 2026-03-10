const handlePageBreak = (
  proposedHeight: number,
  sourceY: number,
  scale: number,
  element: HTMLElement,
  mainCanvas: HTMLCanvasElement
): number => {
  let adjustedHeight = proposedHeight;

  const noBreakElements = Array.from(
    element.querySelectorAll("table, figure, img, pre, code, ul, ol, .no-break")
  );

  const textBlocks = Array.from(
    element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, div:not(:has(*))")
  ).filter((el) => !noBreakElements.includes(el));

  const elementRect = element.getBoundingClientRect();

  for (const el of noBreakElements) {
    const rect = el.getBoundingClientRect();

    const elTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elHeight = elBottom - elTop;

    const pageBottom = sourceY * scale + proposedHeight;

    if (elBottom > pageBottom && elHeight <= proposedHeight) {
      const newHeight = elTop - sourceY * scale;
      if (newHeight > 0) adjustedHeight = Math.min(adjustedHeight, newHeight);
    }
  }

  for (const block of textBlocks) {
    const rect = block.getBoundingClientRect();

    const blockTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const blockBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;

    if (
      blockTop < sourceY * scale + proposedHeight &&
      blockBottom > sourceY * scale + proposedHeight
    ) {
      const range = document.createRange();
      const textRows: { text: string; bottom: number }[] = [];

      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.length);
        const clientRects = range.getClientRects();

        for (let i = 0; i < clientRects.length; i++) {
          const bottom =
            ((clientRects[i].bottom - elementRect.top) / elementRect.height) *
            mainCanvas.height *
            scale;
          const text = textNode.textContent?.trim() || "";
          if (text) textRows.push({ text, bottom });
        }
      }

      textRows.sort((a, b) => a.bottom - b.bottom);

      let breakPoint = sourceY * scale;
      let lastSentenceBreak = sourceY * scale;
      let lastRowBreak = sourceY * scale;

      for (const row of textRows) {
        if (row.bottom - sourceY * scale > proposedHeight) {
          if (lastSentenceBreak > sourceY * scale) {
            breakPoint = lastSentenceBreak;
          } else if (lastRowBreak > sourceY * scale) {
            breakPoint = lastRowBreak;
          } else {
            breakPoint = blockTop;
          }
          break;
        }
        lastRowBreak = row.bottom;
        if (row.text.match(/[.!?]\s*$/)) {
          lastSentenceBreak = row.bottom;
        }
      }

      if (breakPoint > sourceY * scale) {
        adjustedHeight = Math.min(adjustedHeight, breakPoint - sourceY * scale);
      }
    }
  }

  return adjustedHeight;
};

export default handlePageBreak;
