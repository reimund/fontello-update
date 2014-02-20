# Fontello-update

Easily update your Fontello config with this nodejs package.

## Workflow

1. Run fontello-update with an initial fontello config.
2. Pick and remove fonts on the website, press the Update session button.
3. Run fontello-update to download the new config.

Use together with [grunt-fontello](https://www.npmjs.org/package/grunt-fontello) to automatically download the latest package.

## Example

 ```javascript

var fontelloUpdate = require('fontello-update');

fontelloUpdate({
	config: 'fontello.json',
	dest: 'fontello.json'
});

```

## Options
* **config** - The config file to use. Default: 'config.json'.
* **overwrite** - Overwrite existing config file. Default: true.
* **dest** - Config file destination: Default: 'config.json'.
* **open** - Open the package on the fontello website. Default: false.
* **session** - The session to use. Default: null.

## Return value
The fontello update function returns a promise. For example, to use it in an
asyncronous Grunt task, you would do something like:

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
