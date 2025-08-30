const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'taskflow-shell',
  remotes: {
    "taskflow-component": "taskflow-component@https://taskflow-component.netlify.app/remoteEntry.js",
    "taskflow-reactive": "taskflow-reactive@https://taskflow-reactive.netlify.app/remoteEntry.js",
    "taskflow-functional": "taskflow-functional@https://taskflow-functional.netlify.app/remoteEntry.js",
  },
  shared: {
    ...shareAll({ 
      singleton: true, 
      strictVersion: false, 
      requiredVersion: 'auto',
      eager: false 
    }),
  },
  experiments: {
    federationRuntime: 'hoisted'
  }
});

