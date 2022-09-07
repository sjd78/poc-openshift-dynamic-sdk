# Sample plugin

This project is a blend of:
  - https://github.com/openshift/dynamic-plugin-sdk/blob/main/packages/sample-plugin
  - https://github.com/spadgett/console-plugin-template


## Development

Basic setup is to run a http server for the plugin assets and to run openshift console
via a container.  The container runs console and is configured to load the plugin as
a dynamin plugin.

### Running the plugin

#### Option 1: Plugin static dev build

In one terminal window, build and serve the plugin:
```sh
  yarn install
  yarn build:dev
  yarn http-server
```

#### Options 2: Plugin dynamically via webpack-dev-server

With automated patching of configurations, manifests and generated output, the
plugin can be run from the webpack dev server.  In one terminal window, build
and serve the plugin:
```sh
  yarn install
  yarn start
```


### Running the OCP console

In another terminal window, login to an OCP cluster and run console from a container.
This requires:
  - The [oc](https://console.redhat.com/openshift/downloads) command
  - An [OpenShift cluster](https://console.redhat.com/openshift/create)
    ([OpenShift Local / CRC](https://access.redhat.com/documentation/en-us/red_hat_openshift_local/2.5/html/getting_started_guide/introducing_gsg)
    is an easy option for a development)
  - A container engine, [Docker](https://www.docker.com) or [podman 3.2.0+](https://podman.io)

Using `crc`:
```sh
  crc start
  crc console --credentials
  eval $(crc oc-env)
  oc login # using the kubeadmin credentails given above
  yarn start:console
```

Using any other `oc`:
```sh
  oc login # to your openshift cluster
  yarn start:console
```

This will run the OpenShift console in a container connected to the cluster
you've logged into. The plugin HTTP server runs on port 9001 with CORS enabled.

Navigate to <http://localhost:9000/example> to see the running plugin.

