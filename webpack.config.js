const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

// Detecta se está em produção pelo env NODE_ENV ou variável customizada
const isProd = process.env.NODE_ENV === 'production';

module.exports = withModuleFederationPlugin({
  remotes: {
    "taskflow-component": isProd
      ? "taskflow-component@https://taskflow-component.netlify.app/remoteEntry.js"
      : "taskflow-component@http://localhost:4201/remoteEntry.js",
    "taskflow-reactive": isProd
      ? "taskflow-reactive@https://taskflow-reactive.netlify.app/remoteEntry.js"
      : "taskflow-reactive@http://localhost:4202/remoteEntry.js",
    "taskflow-functional": isProd
      ? "taskflow-functional@https://taskflow-functional.netlify.app/remoteEntry.js"
      : "taskflow-functional@http://localhost:4203/remoteEntry.js",
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
