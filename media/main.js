const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const input = document.getElementById('input');
  const associate = document.getElementById('associate');

  // 使用 addlistener 的时候不要 on
  input.addEventListener('input', (e) => {
    // 当没有使用输入法或者退格时候
    if(! e.isComposing) getAssociates(input.value);
  });

  input.addEventListener('compositionend', (e) => {
    getAssociates(input.value);
  });


  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.command) {
      case 'associate':
        // console.log(message.associates);
        renderAssociates(associate, message.associates);
        break;
    }
  });

}

function getAssociates(value) {
  if(! value) return;

  // 提示
  vscode.postMessage({
    command: 'associate',
    text: value
  });
}

function renderAssociates(associate, associates) {
  associate.innerHTML = '';
  associates.forEach(element => {
    const item = document.createElement('div');
    item.innerHTML = element;
    item.classList = ['suggest'];
    item.onclick = () => {
      // console.log(element);
      vscode.postMessage({
        command: 'search',
        query: element
      })
    };
    associate.appendChild(item);
  });
}

