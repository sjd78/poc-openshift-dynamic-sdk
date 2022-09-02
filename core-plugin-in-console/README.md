# Sample plugin

This is a blend of:
  - https://github.com/openshift/dynamic-plugin-sdk/blob/main/packages/sample-plugin
  - https://github.com/spadgett/console-plugin-template


## Development

### Option 1: Plugin static dev build, Console running from container

In one terminal window, build and server the plugin:

1. `yarn install`
2. `yarn build`
3. `yarn http-server`

In another terminal window, login to an OCP cluster and run console from a container:

1. `oc login` (requires [oc](https://console.redhat.com/openshift/downloads) and an [OpenShift cluster](https://console.redhat.com/openshift/create))
2. `yarn start:console` (requires [Docker](https://www.docker.com) or [podman 3.2.0+](https://podman.io))

This will run the OpenShift console in a container connected to the cluster
you've logged into. The plugin HTTP server runs on port 9001 with CORS enabled.
Navigate to <http://localhost:9000/example> to see the running plugin.

## ...review if still needed or relevant

The docs below are copied from https://github.com/openshift/dynamic-plugin-sdk/blob/main/packages/sample-plugin/README.md.  They may be useful in future, but I'm not sure on that.

### Docker config

There's docker config with caddy server for easier build and run of the plugin. The Caddy config utilizes two environment variables

* `PLUGIN_URL` - (*defaults to `/`*) defines which URL should be used when pulling assets, **example** `PLUGIN_URL=/foo/bar` will serve the assets on `localhost:8000/foo/bar`
* `FALLBACK_URL` - (*defaults to `/`*) if the file is not found caddy will use this URL as a fallback and will look for index.html (SPA behavior) **example** `FALLBACK_URL=/baz` will serve the index.html from `/baz` folder.

#### Running with docker

The caddy server is by default serving content over from port `8000` in order to see it locally you'll have to map your machine's port to caddy's port

```bash
> docker run -p 80:8000 sample-plugin
```
