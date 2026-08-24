/// <reference types="vite/client" />

// jQuery global (loaded via CDN)
interface JQuery {
  turn(options?: Record<string, unknown>): JQuery;
  turn(method: string, ...args: unknown[]): unknown;
}

interface Window {
  $: typeof jQuery;
  jQuery: (selector: string | Element) => JQuery;
}

declare const $: (selector: string | Element) => JQuery;
declare const jQuery: (selector: string | Element) => JQuery;
