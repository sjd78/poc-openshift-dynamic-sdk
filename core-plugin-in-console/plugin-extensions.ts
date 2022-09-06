import type {
  EncodedExtension,
  RoutePage as RoutePageSDK,
  HrefNavItem as HrefNavItemSDK,
} from '@openshift/dynamic-plugin-sdk';

// TODO: Extensions from this file are from the core SKD and are type limited
//       to "core.*/*".  These do not have extension providers in console
//       container openshift/origin-console:latest (2-Sept-2022).  Patch the type
//       definitions to use 'console' instead of 'core' as a hack work-around.

// TODO: remove the 'core' to 'console' type name conversion when appropriate
type RoutePage = RoutePageSDK & {
  type: 'console.page/route'
}

// TODO: remove the 'core' to 'console' type name conversion when appropriate
type HrefNavItem = HrefNavItemSDK & {
  type: 'console.navigation/href'
}

export default [
  {
    type: 'console.page/route',
    properties: {
      exact: true,
      path: '/example',
      component: { $codeRef: 'ExamplePage' },
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'console.navigation/href',
    properties: {
      id: 'example',
      name: 'Core Plugin Example',
      href: '/example',
      perspective: 'admin', // If not specified, contributes to the default perspective.
      // section: 'home', // If not specified, render this item as a top level link.
    },
  } as EncodedExtension<HrefNavItem>,
];
