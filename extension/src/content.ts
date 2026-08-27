import { getReactSourceFromDOM } from './react-fiber-extractor';

let isInspectorActive = false;
let currentHighlight: HTMLElement | null = null;
let currentPromptUI: HTMLElement | null = null;
let ws: WebSocket | null = null;

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  let port = 4444;
  const metaTag = document.querySelector('meta[name="inspectai-port"]');
  if (metaTag) {
    const metaPort = parseInt(metaTag.getAttribute('content') || '4444', 10);
    if (!isNaN(metaPort)) port = metaPort;
  }

  ws = new WebSocket(`ws://localhost:${port}`);
  ws.onopen = () => console.log(`[InspectAI] Connected to IDE on port ${port}.`);
  ws.onclose = () => {
    console.log('[InspectAI] Disconnected from IDE.');
    ws = null;
  };
}

function createHighlightBox() {
  const box = document.createElement('div');
  box.id = 'inspectai-highlight';
  box.style.position = 'fixed';
  box.style.pointerEvents = 'none';
  box.style.zIndex = '999998';
  box.style.border = '2px solid #8a2be2';
  box.style.backgroundColor = 'rgba(138, 43, 226, 0.2)';
  box.style.transition = 'all 0.1s ease-out';
  box.style.display = 'none';
  document.body.appendChild(box);
  return box;
}

function updateHighlight(target: HTMLElement) {
  if (!currentHighlight) currentHighlight = createHighlightBox();
  const rect = target.getBoundingClientRect();
  currentHighlight.style.top = `${rect.top}px`;
  currentHighlight.style.left = `${rect.left}px`;
  currentHighlight.style.width = `${rect.width}px`;
  currentHighlight.style.height = `${rect.height}px`;
  currentHighlight.style.display = 'block';
}

function removeHighlight() {
  if (currentHighlight) {
    currentHighlight.style.display = 'none';
  }
}

function createPromptUI(x: number, y: number, sourceFile: string, lineNumber: number, targetHtml: string) {
  if (currentPromptUI) {
    currentPromptUI.remove();
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  
  // Adjust position to stay on screen
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;
  const finalX = Math.min(x, viewWidth - 320);
  const finalY = Math.min(y, viewHeight - 200);

  container.style.top = `${finalY}px`;
  container.style.left = `${finalX}px`;
  container.style.zIndex = '999999';

  // Use Shadow DOM to prevent CSS bleeding
  const shadow = container.attachShadow({ mode: 'open' });

  const wrapper = document.createElement('div');
  wrapper.style.backgroundColor = '#1e1e1e';
  wrapper.style.color = '#fff';
  wrapper.style.padding = '12px';
  wrapper.style.borderRadius = '8px';
  wrapper.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  wrapper.style.fontFamily = 'system-ui, sans-serif';
  wrapper.style.width = '300px';
  wrapper.style.border = '1px solid #333';

  const header = document.createElement('div');
  const fileName = sourceFile.split(/[/\\]/).pop();
  header.textContent = `File: ${fileName}:${lineNumber}`;
  header.style.fontSize = '12px';
  header.style.color = '#888';
  header.style.marginBottom = '8px';

  const input = document.createElement('textarea');
  input.placeholder = 'E.g., Make this button bigger and purple...';
  input.style.width = '100%';
  input.style.height = '60px';
  input.style.backgroundColor = '#2d2d2d';
  input.style.color = '#fff';
  input.style.border = '1px solid #444';
  input.style.borderRadius = '4px';
  input.style.padding = '8px';
  input.style.boxSizing = 'border-box';
  input.style.resize = 'none';
  input.style.outline = 'none';

  const button = document.createElement('button');
  button.textContent = 'Apply Edit';
  button.style.marginTop = '8px';
  button.style.width = '100%';
  button.style.padding = '8px';
  button.style.backgroundColor = '#8a2be2';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';

  wrapper.appendChild(header);
  wrapper.appendChild(input);
  wrapper.appendChild(button);
  shadow.appendChild(wrapper);
  document.body.appendChild(container);
  
  currentPromptUI = container;

  const messageHandler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.status === 'success') {
        button.textContent = '✅ Success!';
        button.style.backgroundColor = '#10b981'; // green
        setTimeout(() => closeUI(), 1000);
      } else {
        button.textContent = `❌ ${data.message || 'Error'}`;
        button.style.backgroundColor = '#ef4444'; // red
        setTimeout(() => closeUI(), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeUI = () => {
    if (ws) ws.removeEventListener('message', messageHandler);
    container.remove();
    currentPromptUI = null;
    deactivateInspector();
  };

  if (ws) {
    ws.addEventListener('message', messageHandler);
  }

  button.addEventListener('click', () => {
    const instruction = input.value.trim();
    if (!instruction) return;
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('InspectAI IDE Companion not connected. Ensure the VS Code extension is running on port 4444.');
      return;
    }

    button.textContent = 'Applying Edit...';
    
    ws.send(JSON.stringify({
      sourceFile,
      lineNumber,
      html: targetHtml,
      instruction,
      computedStyles: {}
    }));
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeUI();
    }
  });

  input.focus();
}

function handleMouseMove(e: MouseEvent) {
  if (!isInspectorActive) return;
  const target = e.target as HTMLElement;
  if (!target || target === currentHighlight || currentPromptUI?.contains(target)) return;
  updateHighlight(target);
}

function handleClick(e: MouseEvent) {
  if (!isInspectorActive) return;
  
  if (currentPromptUI && e.composedPath().includes(currentPromptUI)) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const target = e.target as HTMLElement;
  if (!target) return;

  const source = getReactSourceFromDOM(target);
  
  if (source) {
    createPromptUI(e.clientX, e.clientY, source.fileName, source.lineNumber, target.outerHTML);
  } else {
    // Show a visual warning for Server Components instead of failing silently
    console.warn('[InspectAI] No React source found. Likely a Server Component.');
    
    if (currentPromptUI) currentPromptUI.remove();
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = `${Math.min(e.clientY, window.innerHeight - 100)}px`;
    container.style.left = `${Math.min(e.clientX, window.innerWidth - 300)}px`;
    container.style.zIndex = '999999';
    const shadow = container.attachShadow({ mode: 'open' });
    
    const wrapper = document.createElement('div');
    wrapper.style.backgroundColor = '#1e1e1e';
    wrapper.style.color = '#fff';
    wrapper.style.padding = '12px';
    wrapper.style.borderRadius = '8px';
    wrapper.style.border = '1px solid #ef4444';
    wrapper.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    wrapper.style.fontFamily = 'system-ui, sans-serif';
    wrapper.style.width = '280px';
    
    wrapper.innerHTML = `
      <div style="color: #ef4444; font-weight: bold; margin-bottom: 8px;">⚠️ Server Component Detected</div>
      <div style="font-size: 12px; color: #ccc;">
        Next.js Server Components do not expose file paths to the browser.<br/><br/>
        Try adding <code>"use client";</code> to the top of your file, or click a Client Component.
      </div>
    `;
    
    shadow.appendChild(wrapper);
    document.body.appendChild(container);
    currentPromptUI = container;
    
    setTimeout(() => {
      if (currentPromptUI === container) {
        container.remove();
        currentPromptUI = null;
      }
    }, 4000);
  }
}

function activateInspector() {
  if (isInspectorActive) return;
  isInspectorActive = true;
  document.addEventListener('mousemove', handleMouseMove, { capture: true });
  document.addEventListener('click', handleClick, { capture: true });
  connectWebSocket();
  console.log('[InspectAI] Activated. Hover over elements.');
}

function deactivateInspector() {
  isInspectorActive = false;
  document.removeEventListener('mousemove', handleMouseMove, { capture: true });
  document.removeEventListener('click', handleClick, { capture: true });
  removeHighlight();
  if (currentPromptUI) {
    currentPromptUI.remove();
    currentPromptUI = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOGGLE_INSPECTAI') {
    if (isInspectorActive) {
      deactivateInspector();
    } else {
      activateInspector();
    }
  }
});
