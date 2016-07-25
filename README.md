repfinder
=========
A Node.js web app for finding your representative in the Hungarian
Parliament.

Installation
------------
In order to run repfinder, you have to install all app dependencies
and build the app locally:

```
npm install
bower install
npm run build
```

The build steps are slightly different in production, so you have to
do this initially even if you are running the app on a production
server.

Development
-----------
repfinder has a number of gulp.js tasks associated with it. They
are located in `gulp/tasks`.

In particular, `gulp watch` builds the app and then waits for any
file changes to take place. `gulp build` simply runs all build tasks
in parallel.

Configuration
-------------
repfinder uses `node-config`. All configuration files are located
in the `config` directory.

There is also an additional configuration file for gulp tasks that
is sometimes used in the app as well (`gulp/config.js`). This file
defines common paths that the app uses.

API Keys
--------
This app needs three API keys for it to work in production:

 * A Google Maps API key for geocoding.
 * A Google reCaptcha API key for the CAPTCHA.
 * An API key distributed by the Hungarian Parliament. You can
 sign up for a key [here](http://www.parlament.hu/w-api-tajekoztato).

These keys are copied into `api-keys.js` and then exported as a JS
object:

```
module.exports = {
	MAPS_API_KEY: '',
	PARLIAMENT_API_KEY: '',
	RECAPTCHA_API_KEY: ''
};
```

Running the app
---------------
Once all dependencies have been installed, you can run the app via:

```
node repfinder
````