/**
 * Environment interface to define the shape of the environment objects
 */
export interface Environment {
  /**
   * Flag indicando se é ambiente de produção
   */
  production: boolean;
  
  /**
   * URLs dos MFEs remotos
   */
  remoteUrls: {
    [key: string]: string;
  };
}
