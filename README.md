# Fontello-update

Easily update your Fontello config with this nodejs package.

## Workflow

1. Run fontello-update with an initial fontello config.
2. Pick and remove fonts on the website and press the 'Save session' button.
3. Run fontello-update to download the new config and font files.

~~Use together with [grunt-fontello](https://www.npmjs.org/package/grunt-fontello) to automatically download the latest package.~~  
Use together with [grunt-fontello-update](https://www.npmjs.org/package/grunt-fontello-update) to run fontello update as a Grunt task.

## Example

 ```javascript

var fontelloUpdate = require('fontello-update');

fontelloUpdate({
	config: 'fontello.json',
	fonts: 'public/font',
	css: 'public/css'
});

```

## Options
* **config** - The config file to use. Default: 'config.json'.
* **overwrite** - Overwrite existing config file. Default: true.
* **fonts** - Font files' destination: Default: 'fonts'.
* **css** - Stylesheets' destination: Default: 'css'.
* **open** - Open the package on the fontello website. Default: false.
* **updateConfigOnly** - Only update the config file (ie don't extract font and css files). Default: false.
* **session** - The session to use. Default: null.

## Return value
The fontello update function returns a promise. For example, to use it in an
asynchronous Grunt task, you would do something like:

```javascript

function fontelloUpdate()
{
	var done = this.async();
	var fontelloUpdate = require('fontello-update');

	fontelloUpdate({
			config: 'fontello.json',
			dest: 'fontello.json'
		})
		.then(done)
		.catch(done)
	;
}
```

## Gulp
Basically Fulfill task relying on promises.

```javascript
var fontelloUpdate = require('fontello-update');

gulp.task('fontello', function() {
  return fontelloUpdate({
    config: 'fontello.json',
    fonts: 'public/font',
    css: 'public/css'
  });
});
```
