const handleAutoBreak = (
  proposedHeight: number,
  sourceY: number,
  scale: number,
  element: HTMLElement,
  mainCanvas: HTMLCanvasElement
): number => {
  let adjustedHeight = proposedHeight;

  // Get all elements that should not break
  const noBreakElements = Array.from(
    element.querySelectorAll("table, figure, img, pre, code, .no-break")
  );

  // Get all text blocks that should be considered for breaks
  const textBlocks = Array.from(
    element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, div:not(:has(*))")
  );

  // First, handle elements that should not break
  for (const el of [...noBreakElements, ...textBlocks]) {
    const rect = el.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate element's position and dimensions relative to the canvas
    const elTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const elHeight = elBottom - elTop;

    // Only consider elements that start within current page
    if (elTop >= sourceY * scale && elTop < sourceY * scale + proposedHeight) {
      // If element would break across pages
      if (elBottom > sourceY * scale + proposedHeight) {
        // If element fits on a single page, move it to next page
        if (elHeight <= proposedHeight) {
          adjustedHeight = Math.min(adjustedHeight, elTop - sourceY * scale);
        }
      }
    }
  }

  // Then, handle text blocks with improved sentence and row breaking
  for (const block of textBlocks) {
    const rect = block.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const blockTop =
      ((rect.top - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;
    const blockBottom =
      ((rect.bottom - elementRect.top) / elementRect.height) *
      mainCanvas.height *
      scale;

    // If text block starts before the proposed break and extends beyond it
    if (
      blockTop < sourceY * scale + proposedHeight &&
      blockBottom > sourceY * scale + proposedHeight
    ) {
      const range = document.createRange();
      const textRows: { text: string; bottom: number }[] = [];

      // Get all text nodes in the block
      const walker = document.createTreeWalker(
        block,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        range.setStart(textNode, 0);
        range.setEnd(textNode, textNode.length);
        const clientRects = range.getClientRects();

        for (let i = 0; i < clientRects.length; i++) {
          const rect = clientRects[i];
          const bottom =
            ((rect.bottom - elementRect.top) / elementRect.height) *
            mainCanvas.height *
            scale;

          const text = textNode.textContent?.trim() || "";
          if (text) {
            textRows.push({ text, bottom });
          }
        }
      }

      // Sort rows by their bottom position
      textRows.sort((a, b) => a.bottom - b.bottom);

      let breakPoint = sourceY * scale;
      let lastSentenceBreak = sourceY * scale;
      let lastRowBreak = sourceY * scale;

      for (const row of textRows) {
        // Check if this row would fit on the current page
        if (row.bottom - sourceY * scale > proposedHeight) {
          // If we found a sentence break, use it
          if (lastSentenceBreak > sourceY * scale) {
            breakPoint = lastSentenceBreak;
          }
          // Otherwise use the last row break
          else if (lastRowBreak > sourceY * scale) {
            breakPoint = lastRowBreak;
          }
          // If no good break point found, move entire block to next page
          else {
            breakPoint = blockTop;
          }
          break;
        }

        // Update row break point
        lastRowBreak = row.bottom;

        // Check if this row ends with a sentence break
        if (row.text.match(/[.!?]\s*$/)) {
          lastSentenceBreak = row.bottom;
        }
      }

      // Adjust the height to break at the best breaking point
      if (breakPoint > sourceY * scale) {
        adjustedHeight = Math.min(adjustedHeight, breakPoint - sourceY * scale);
      }
    }
  }

  return adjustedHeight;
};

export default handleAutoBreak;
