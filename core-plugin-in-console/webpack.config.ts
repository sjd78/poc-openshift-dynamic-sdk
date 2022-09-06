import path from 'path';
import { DynamicRemotePlugin } from '@openshift/dynamic-plugin-sdk-webpack';
import CSSMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { EnvironmentPlugin } from 'webpack';
import extensions from './plugin-extensions';

import type { WebpackSharedObject } from '@openshift/dynamic-plugin-sdk-webpack';
import type { WebpackPluginInstance } from 'webpack';
import type { Configuration as WebpackConfiguration } from "webpack";
import type { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

const isProd = process.env.NODE_ENV === 'production';

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

/**
 * Shared modules consumed and/or provided by this plugin.
 *
 * A host application typically provides some modules to its plugins. If an application
 * provided module is configured as an eager singleton, we suggest using `import: false`
 * to avoid bundling a fallback version of the module when building your plugin.
 *
 * Plugins may provide additional shared modules that can be consumed by other plugins.
 *
 * @see https://webpack.js.org/plugins/module-federation-plugin/#sharing-hints
 */
const pluginSharedModules: WebpackSharedObject = {
  '@openshift/dynamic-plugin-sdk': { singleton: true, import: false },
  '@patternfly/react-core': {},
  '@patternfly/react-table': {},
  react: { singleton: true, import: false },
  'react-dom': { singleton: true, import: false },
};

const plugins: WebpackPluginInstance[] = [
  new EnvironmentPlugin({
    NODE_ENV: 'development',
  }),

  // This plugin also generates the `plugin-manifest.json` file
  new DynamicRemotePlugin({
    // NOTE: The plugin only works with `plugin.json` keys:
    //         - name
    //         - version
    //         - exposedModules
    //
    // TODO: Console requires a key `dependencies`.  Even if it is in `plugin.json`
    //       it is stripped out by the manifest generator.
    pluginMetadata: 'plugin.json',

    // TODO: See `plugin-extensions.ts` for details.
    extensions,

    // TODO: Assume this would need to be aligned with how console handles its
    //       modules.  I'm guessing that it would need to mirror whatever handles
    //       the plugin.json->dependencies configs.
    sharedModules: pluginSharedModules,

    // TODO: With a manually patched `plugin-manifets.json` to provide all console
    //       required fields, this config requried to attempt to load the plugin.
    //       The default function used does not work with console container
    //       openshift/origin-console:latest (2-Sept-2022).
    entryCallbackSettings: {
      name: 'window.loadPluginEntry'
    },
  }),
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
