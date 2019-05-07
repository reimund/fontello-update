var   _       = require('underscore')
	, Q       = require('q')
	, fs      = require('fs')
	, request = require('request')
	, open    = require('open')
	, url     = 'http://fontello.com/'
	, temp    = require('temp')
	, path    = require('path')
;

// temp.track();

var AdmZip = require('adm-zip');
var tmpFolder = temp.mkdirSync();

var getSession = function(options)
{
	if (_.isEmpty(options))
		options = {};

	var form     = new (require('form-data'));
	var deferred = Q.defer();

	form.append('config', fs.createReadStream(options.config));
	form.submit(url, function(error, res) {
		res.setEncoding('utf8');
		res.on('data', function(data) {
			deferred.resolve(data);
		});
	});

	return deferred.promise;
}

var downloadPackage = function(session, dest)
{
	var deferred = Q.defer();

	var req = request.get(url + session + '/get').on('response', function (res) {
		// Fontello used to throw 404 when the session was expired, now it's 500.
		if (200 !== res.statusCode) {
			deferred.reject('No font config found. The session ' + session + ' has likely expired.');
		} else {
			var r = req.pipe(fs.createWriteStream(dest));
			 r.on('close', function() { deferred.resolve(true) });
			 r.on('error', function(error) { deferred.reject(error) });
		}
	});

	return deferred.promise;
}

var unzipPackage = function(archive, session, options) {
	var zip = new AdmZip(archive);

	zip.extractAllTo(tmpFolder, false, options.overwrite);

	let extractedFolders = fs.readdirSync(tmpFolder);
	let extractedPath = path.join(tmpFolder, extractedFolders[0]);
	let cssPath = path.join(extractedPath, 'css');
	let fontPath = path.join(extractedPath, 'font');
	let cssFiles = fs.readdirSync(cssPath);
	let fontFiles = fs.readdirSync(fontPath);
	let cwd = process.cwd();

	if (!fs.existsSync(path.join(cwd, options.css))) { fs.mkdirSync(path.join(cwd, options.css)); }
	if (!fs.existsSync(path.join(cwd, options.fonts))) { fs.mkdirSync(path.join(cwd, options.fonts)); }

	for (var i in cssFiles) {
		fs.copyFileSync(path.join(cssPath, cssFiles[i]), path.join(cwd, options.css, cssFiles[i]));
	}

	for (var i in fontFiles) {
		fs.copyFileSync(path.join(fontPath, fontFiles[i]), path.join(cwd, options.fonts, fontFiles[i]));
	}

	var config = require(path.join(extractedPath, 'config.json'));

	// Added session to config.
	config.session = session;

	fs.writeFileSync(path.join(cwd, options.config), JSON.stringify(config, null, '\t'));
}

var updateConfig = function(session, options)
{
	var deferred = Q.defer();

	if (options.open) {
		open(url + session);
		deferred.resolve(true);
		return deferred.promise;
	}

	var zipFile  = path.join(temp.mkdirSync(), 'fontello.zip');

	downloadPackage(session, zipFile)
		.then(function() {
			unzipPackage(zipFile, session, options);
			deferred.resolve(true);
		})
		.catch(function(error) {
			deferred.reject(error);
		})
	;

	return deferred.promise;
}

var fontelloUpdate = function(options)
{
	_.defaults(options, {
		  session: null
		, config: 'config.json'
		, overwrite: true
		, fonts: 'font'
		, css: 'css'
		, open: false
		, updateConfigOnly: false
	});

	var deferred = Q.defer();

	if (_.isNull(options.session)) {
		// Try to get session from fontello config.
		var config = require(process.cwd() + '/' + options.config);

		if (_.isEmpty(config.session)) {
			getSession(options)
				.then(function(session) {
					config.session = session;
					fs.writeFileSync(options.config, JSON.stringify(config, null, '\t'));

					return updateConfig(session, options)
						.then(function() {
							deferred.resolve(true);
						})
						.catch(function(error) {
							deferred.reject(error);
						});
				})
				.catch(function(error) {
					deferred.reject(error);
				});
		} else {
			// First attempt
			updateConfig(config.session, options)
				.then(function() {
					deferred.resolve(true);
				})
				.catch(function(error) {
					// Remove session field from fontello config (since it failed) and try again.
					config.session = undefined;
					fs.writeFileSync(options.config, JSON.stringify(config, null, '\t'));

					// Second attempt in case the session was expired
					return fontelloUpdate(options)
						.then(function() {
							deferred.resolve(true);
						})
						.catch(function(error) {
							console.warn('WARNING: Failed to download the package in two attempts.');
							console.warn('Reason: ', error);
							deferred.reject(error);
						});
				});
		}
	}

	return deferred.promise;
}

module.exports = function(options)
{
	return fontelloUpdate(options);
}
