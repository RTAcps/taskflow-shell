/**
 * Environment interface to define the shape of the environment objects
 */
export interface Environment {
  production: boolean;
  remoteUrls: {
    [key: string]: string;
  };
  cors?: {
    enableProxy: boolean;
    proxyUrls: string[];
  };
}
