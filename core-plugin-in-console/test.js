const _ = require('lodash');

// from: https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/src/shared-modules.ts#L40-L60
const sharedPluginModulesMetadata = {
  '@openshift-console/dynamic-plugin-sdk': {},
  '@openshift-console/dynamic-plugin-sdk-internal': {},
  '@patternfly/react-core': {},
  '@patternfly/react-table': {},
  '@patternfly/quickstarts': {},
  react: {},
  'react-helmet': { singleton: false, allowFallback: true },
  'react-i18next': {},
  'react-router': {},
  'react-router-dom': {},
  'react-redux': {},
  redux: {},
  'redux-thunk': {},
};

// from: https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin.ts#L88-L108
const reduced = Object.entries(sharedPluginModulesMetadata).reduce(
  (acc, [moduleRequest, moduleMetadata]) => {
    const adaptedMetadata = _.defaults({}, moduleMetadata, {
      singleton: true,
      allowFallback: false,
    });

    const moduleConfig = {
      singleton: adaptedMetadata.singleton,
    };

    if (!adaptedMetadata.allowFallback) {
      moduleConfig.import = false;
    }

    acc[moduleRequest] = moduleConfig;
    return acc;
  },
  {},
);

console.log(JSON.stringify(reduced, undefined, 3));
