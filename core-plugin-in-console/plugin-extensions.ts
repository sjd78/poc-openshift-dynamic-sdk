import type {
  EncodedExtension,
  RoutePage,
  HrefNavItem,
} from '@openshift/dynamic-plugin-sdk';

export default [
  {
    type: 'core.page/route',
    properties: {
      exact: true,
      path: '/example',
      component: { $codeRef: 'ExamplePage' },
    },
  } as EncodedExtension<RoutePage>,

  {
    type: 'core.navigation/href',
    properties: {
      id: 'example',
      name: 'Core Plugin Example',
      href: '/example',
      perspective: 'admin', // If not specified, contributes to the default perspective.
      // section: 'home', // If not specified, render this item as a top level link.
    }

  } as EncodedExtension<HrefNavItem>,
];
