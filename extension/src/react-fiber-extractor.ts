export interface ReactSource {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

export function getReactSourceFromDOM(domNode: HTMLElement): ReactSource | null {
  // 1. Find the __reactFiber$ property on the DOM node
  const fiberKey = Object.keys(domNode).find((key) => key.startsWith('__reactFiber$'));
  
  if (!fiberKey) {
    console.warn('React Fiber not found on this DOM node. Ensure the app is running in React development mode.');
    return null;
  }

  let fiberNode = (domNode as any)[fiberKey];

  // 2. Traverse up the Fiber tree until we find _debugSource
  while (fiberNode) {
    if (fiberNode._debugSource) {
      return {
        fileName: fiberNode._debugSource.fileName,
        lineNumber: fiberNode._debugSource.lineNumber,
        columnNumber: fiberNode._debugSource.columnNumber,
      };
    }
    // Move up to the parent fiber node
    fiberNode = fiberNode.return;
  }

  console.warn('Could not find React _debugSource in the fiber tree.');
  return null;
}

// Phase 1 Goal: Click listener to console.log the exact file path
export function initializePhase1Listener() {
  document.addEventListener('click', (event) => {
    // Prevent default behavior to avoid navigating away if clicking a link during our test
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target as HTMLElement;
    if (!target) return;

    const source = getReactSourceFromDOM(target);
    
    if (source) {
      console.log('%c✅ InspectAI Found React Source:', 'color: #00ff00; font-weight: bold; font-size: 14px;');
      console.log(`%cFile: ${source.fileName}:${source.lineNumber}`, 'color: #00aaff; font-weight: bold;');
    } else {
      console.log('%c❌ InspectAI: No React source found for the clicked element.', 'color: #ff0000; font-weight: bold;');
    }
  }, { capture: true }); // Use capture phase to intercept the click early
}

// Auto-initialize if running directly in the browser (for Phase 1 testing)
if (typeof window !== 'undefined') {
  console.log('InspectAI Phase 1 Extractor initialized. Click on any React element...');
  initializePhase1Listener();
}
