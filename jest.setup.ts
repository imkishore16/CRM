// Polyfill for TextEncoder/TextDecoder which is required for some dependencies
if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
  }
  if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
  }