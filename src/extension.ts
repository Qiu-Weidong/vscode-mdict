import * as vscode from 'vscode';
import Mdict from 'js-mdict';


export function activate(context: vscode.ExtensionContext) {

  let disposable = vscode.commands.registerCommand('mdict.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from mdict!');
  });

  context.subscriptions.push(disposable);

  // 这里的 viewType 必须和 package.json 里面一样。
  disposable = vscode.window.registerCustomEditorProvider('mdictView.mdict', new MdictReadonlyEditor(context.extensionUri));

  context.subscriptions.push(disposable);
}

export function deactivate() { }


class MdictDocument implements vscode.CustomDocument {
  uri: vscode.Uri;
  private readonly _mdict: Mdict;
  private _disposables: vscode.Disposable[];

  constructor(uri: vscode.Uri) {
    this.uri = uri;
    this._mdict = new Mdict(uri.fsPath);
    this._disposables = [];
  }

  dispose(): void { }

  public get mdict(): Mdict { return this._mdict; }
  public get disposables(): vscode.Disposable[] { return this._disposables; }

}

class MdictReadonlyEditor implements vscode.CustomReadonlyEditorProvider<MdictDocument> {
  private readonly _extensionUri;
  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  openCustomDocument(uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken): MdictDocument | Thenable<MdictDocument> {
    const backid = openContext.backupId;
    if (backid) {
      uri = vscode.Uri.parse(backid);
    }
    return new MdictDocument(uri);
  }

  resolveCustomEditor(
    document: MdictDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken): void | Thenable<void> {
    // 使能 js 。
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    // 设置图标
    // webviewPanel.iconPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'icon.png');

    this._setWebviewContent(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage((message) => {
      const command = message.command;
      switch (command) {
        case 'associate':
          const _associates = document.mdict.associate(message.text).map(item => item.keyText);
          const associates = Array.from(new Set(_associates));
          webviewPanel.webview.postMessage({
            command: 'associate',
            associates
          });
          break;
        case 'search':
          const definition = document.mdict.lookup(message.query).definition;
          this._setWebviewContent(webviewPanel.webview, definition);
          break;
      }
    }, undefined, document.disposables);
  }

  private _setWebviewContent(webview: vscode.Webview, definition?: string) {
    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js",
      )
    );
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css')
    );

    const mainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    webview.html = /*html*/ `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script type="module" src="${toolkitUri}"></script>
      <script type="module" src="${mainUri}"></script>
      <link href="${codiconsUri}" rel="stylesheet" />
      <style>
        .suggest:hover {
          color: blue;
          cursor: pointer;
          background-color: #32a1ce;
        }
      </style>
      <title>你好</title>
    </head>
    <body>
      <div id="container" style="height: 100vh; display:flex; flex-wrap: wrap;">
        <!-- 左侧搜索框和提示 -->
        <div style="margin: 20px 10px; display: flex; flex-direction: column; max-width: 250px">
          <vscode-text-field id="input" placeholder="Placeholder Text">
          请输入需要查询的内容
            <vscode-button id="btn" slot="end" appearance="icon" aria-label="Confirm">
              <span class="codicon codicon-search"></span>
            </vscode-button>
          </vscode-text-field>

          <div style="border: thick double #32a1ce; flex-grow: 1; margin: 8px 0px; overflow-y: scroll;" id="associate">
          </div>
        </div>

        <div style="margin: 5px 5px; flex: auto">
          ${definition}
        </div>
      </div>
    </body>
    </html>
    `;
  }

}


