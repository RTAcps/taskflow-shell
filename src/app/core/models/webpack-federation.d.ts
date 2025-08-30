// Type declarations for webpack Module Federation
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
declare const __webpack_share_scopes__: { default: any };

interface Container {
  init(shareScope: any): Promise<void>;
}

interface RemoteContainer {
  [key: string]: Container;
}

declare global {
  interface Window {
    taskflow_shell: RemoteContainer;
  }
}
