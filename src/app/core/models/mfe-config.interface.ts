export interface MfeConfig {
  mfeComponents: {
    [key: string]: {
      remoteEntry: string;
      exposedModule: string;
      componentName: string;
    };
  };
}
