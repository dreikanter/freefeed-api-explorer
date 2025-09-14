import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
// @ts-ignore - highlightjs-copy doesn't have types
import CopyButtonPlugin from 'highlightjs-copy';

let initialized = false;

function init() {
  if (initialized || typeof window === 'undefined') return;

  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('json', json);
  hljs.addPlugin(
    new CopyButtonPlugin({
      autohide: false,
    })
  );

  initialized = true;
}

export function initHighlight() {
  init();
  return hljs;
}

// Initialize immediately when module is imported (client-side only)
if (typeof window !== 'undefined') {
  init();
}

export { hljs };
