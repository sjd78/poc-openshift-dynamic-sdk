import * as React from 'react';
import Helmet from 'react-helmet';
import {
  Page,
  PageSection,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';

import './example.css';

export default function ExamplePage() {
  return (
    <>
      <Helmet>
        <title>Hello, Core SDK Plugin!</title>
      </Helmet>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1">Hello, Core SDK Plugin!</Title>
        </PageSection>
        <PageSection variant="light">
          <TextContent>
            <Text component="p">
              <span className="console-plugin-template__nice">Nice!</span> Your
              plugin is working.
            </Text>
            <Text component="p">
              This is a custom page contributed by the POC Core SDK plugin.
              The extension that adds the page is declared in
              <code>plugin-extensions.ts</code> in the project root along with the
              corresponding nav item. Update <code>plugin-extensions.ts</code> to change
              or add extensions. Code references in <code>plugin-extensions.ts</code> must
              have a corresonding property under key <code>exposedModules</code> in file{' '}
              <code>plugin.json</code> mapping the reference to the module.
            </Text>
          </TextContent>
        </PageSection>
      </Page>
    </>
  );
}
