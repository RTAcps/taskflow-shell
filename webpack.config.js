const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'taskflow-shell',
  remotes: {
    "taskflow-component": "taskflow-component@http://localhost:4201/remoteEntry.js",
    "taskflow-reactive": "taskflow-reactive@http://localhost:4202/remoteEntry.js",
    "taskflow-functional": "taskflow-functional@http://localhost:4203/remoteEntry.js",
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
