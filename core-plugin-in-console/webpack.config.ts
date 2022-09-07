import path from 'path';
import fs from 'fs';

import { DynamicRemotePlugin } from '@openshift/dynamic-plugin-sdk-webpack';
import CSSMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { EnvironmentPlugin, Compiler, Compilation, sources } from 'webpack';
import extensions from './plugin-extensions';

import type { WebpackSharedObject } from '@openshift/dynamic-plugin-sdk-webpack';
import type { WebpackPluginInstance } from 'webpack';
import type { Configuration as WebpackConfiguration } from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const isProd = process.env.NODE_ENV === 'production';

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const parseJSONFile = <TValue = unknown>(filePath: string) =>
  JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TValue;

const pluginJson: any = parseJSONFile('plugin.json');

function buildPluginId(): string {
  const pluginName: string = pluginJson.name;
  const pluginVersion: string = pluginJson.version;

  return `${pluginName}@${pluginVersion}`;
}

/**
 * Shared modules consumed and/or provided by this plugin.
 *
 * This list has be adapted from:
 *   - https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/src/shared-modules.ts#L40-L60
 *   - https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/src/webpack/ConsoleRemotePlugin.ts#L88-L108
 *
 * TODO: Keep aligned with how console handles its modules.  Currently console
 * TODO: hard codes it in `shared-modules.ts` referenced above.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
const pluginSharedModules: WebpackSharedObject = {
  // Use the core SDK as the base instead of the console's SDK
  '@openshift/dynamic-plugin-sdk': { singleton: true, import: false },
  // '@openshift-console/dynamic-plugin-sdk': { singleton: true },
  // '@openshift-console/dynamic-plugin-sdk-internal': { singleton: true },

  // non-SDK modules:
  '@patternfly/react-core': { singleton: true, import: false },
  '@patternfly/react-table': { singleton: true, import: false },
  '@patternfly/quickstarts': { singleton: true, import: false },
  react: { singleton: true, import: false },
  'react-helmet': { singleton: false },
  'react-i18next': { singleton: true, import: false },
  'react-router': { singleton: true, import: false },
  'react-router-dom': { singleton: true, import: false },
  'react-redux': { singleton: true, import: false },
  redux: { singleton: true, import: false },
  'redux-thunk': { singleton: true, import: false },
};

const plugins: WebpackPluginInstance[] = [
  new EnvironmentPlugin({
    NODE_ENV: 'development',
  }),

  // Wrap the core SDK plugin so the output can be patched as necessary to run in console
  new (class PatchedDynamicRemotePlugin {
    apply(compiler: Compiler) {
      // do the federated module builds plus generates the `plugin-manifest.json` file
      new DynamicRemotePlugin({
        // TODO: See 'Patch Manifest' below for details.
        pluginMetadata: 'plugin.json',

        // TODO: See `plugin-extensions.ts` for details.
        extensions,

        // TODO: See above for details about the shared modules.
        sharedModules: pluginSharedModules,

        // TODO: These configs are requried to attempt to load the plugin in console.
        //       The default function used does not work with console container
        //       openshift/origin-console:latest (2-Sept-2022).
        entryCallbackSettings: {
          name: 'window.loadPluginEntry',
          pluginID: buildPluginId(),
        },
      }).apply(compiler);

      // The core SDK generated manifest needs to be patched for the plugin to load
      // via the console SDK.  Additional manifest information is required.

      // Patch Manifest
      compiler.hooks.thisCompilation.tap('PatchManifestJson', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'PatchManifestJson',
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
          },
          (assets) => {
            const existing = JSON.parse(assets['plugin-manifest.json'].source().toString());

            // TODO: Review what needs to be patched in to `DynamicRemotePlugin` generated output.
            const patched = {
              name: existing.name ?? pluginJson.name,
              version: existing.version ?? pluginJson.version,
              displayName: existing.displayName ?? pluginJson.displayName,
              description: existing.description ?? pluginJson.description,
              dependencies: existing.dependencies ?? pluginJson.dependencies,
              extensions: existing.extensions ?? pluginJson.extensions,
            };

            assets['plugin-manifest.json']
              = new sources.RawSource(JSON.stringify(patched, undefined, 2));
          })
      });
    }
  })(),
];

const devServer: WebpackDevServerConfiguration = {
  static: './dist',
  port: 9001,
  // Allow bridge running in a container to connect to the plugin dev server.
  allowedHosts: 'all',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'X-Requested-With, Content-Type, Authorization',
  },
  devMiddleware: {
    writeToDisk: true,
  },
};

const config: Configuration = {
  mode: isProd ? 'production' : 'development',
  entry: {}, // plugin container entry generated by DynamicRemotePlugin
  output: {
    path: pathTo('dist'),
    publicPath: 'http://localhost:9001/',
    chunkFilename: isProd ? 'chunks/[id].[chunkhash].min.js' : 'chunks/[id].js',
    assetModuleFilename: isProd ? 'assets/[contenthash][ext]' : 'assets/[name][ext]',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    plugins: [new TsconfigPathsPlugin()], // pickup import alias definitions from tsconfig.json
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /\/node_modules\//,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: pathTo('tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.(svg|png|jpg|jpeg|gif)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devServer,
  plugins,
  devtool: isProd ? 'source-map' : 'cheap-source-map',
  optimization: {
    minimize: isProd,
    minimizer: [
      '...', // The '...' string represents the webpack default TerserPlugin instance
      new CSSMinimizerPlugin(),
    ],
  },
};

export default config;
