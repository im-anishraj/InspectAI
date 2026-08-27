import * as vscode from 'vscode';
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

export function activate(context: vscode.ExtensionContext) {
  console.log('InspectAI IDE Companion is now active!');

  // Start the WebSocket server on port 4444
  wss = new WebSocketServer({ port: 4444 });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', async (message: string) => {
      try {
        const payload = JSON.parse(message.toString());
        const { sourceFile, lineNumber, html, instruction } = payload;

        // 1. Open the file in the editor
        const document = await vscode.workspace.openTextDocument(sourceFile);
        const editor = await vscode.window.showTextDocument(document);

        // 2. Select the specific line to give the AI context
        const line = Math.max(0, lineNumber - 1);
        const range = new vscode.Range(line, 0, line, document.lineAt(line).text.length);
        editor.selection = new vscode.Selection(range.start, range.end);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);

        // 3. Format the query for the IDE Agent
        const query = `Please edit the selected code. 
User Instruction: ${instruction}
Context HTML: ${html}`;

        // 4. Trigger the built-in AI Chat panel 
        // Note: The specific command depends on the IDE environment.
        // For VS Code / GitHub Copilot Chat:
        await vscode.commands.executeCommand('workbench.action.chat.open', {
          query: query
        });
        
        // (If using Cursor, it uses custom internal command protocols to open the Cmd+K or Chat panel)
        
        ws.send(JSON.stringify({ status: 'success', message: 'Sent to IDE Agent' }));
      } catch (err: any) {
        console.error('InspectAI failed to process message:', err);
        ws.send(JSON.stringify({ status: 'error', message: err.message }));
      }
    });
  });

  context.subscriptions.push({
    dispose: () => {
      if (wss) wss.close();
    }
  });
}

export function deactivate() {
  if (wss) {
    wss.close();
  }
}
