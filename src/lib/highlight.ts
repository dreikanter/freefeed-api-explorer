import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
// @ts-ignore - highlightjs-copy doesn't have types
import CopyButtonPlugin from 'highlightjs-copy';

let initialized = false;

export function initHighlight() {
  if (initialized) return hljs;

  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('json', json);
  hljs.addPlugin(new CopyButtonPlugin({
    autohide: false
  }));

  initialized = true;
  return hljs;
}

export { hljs };