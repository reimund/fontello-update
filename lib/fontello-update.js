var   _       = require('underscore')
	, Q       = require('q')
	, fs      = require('fs')
	, request = require('request')
	, open    = require('open')
	, url     = 'http://fontello.com/'
;

var AdmZip = require('adm-zip');

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
		if ('404' == res.statusCode) {
			deferred.reject(new Error('No font config found for session ' + session + '.'));
		} else {
			var r = req.pipe(fs.createWriteStream(dest));
			 r.on('close', function() { deferred.resolve(true) });
			 r.on('error', function(error) { deferred.reject(error) });
		}
	});

	return deferred.promise;
}

var unzipPackage = function(archive, session, options)
{
	var   zip       = new AdmZip('./' + archive)
		, entries = zip.getEntries()
	;

	entries.forEach(function(entry) {
		var name = entry.entryName;

		if ('config.json' == name.substring(name.indexOf('/') + 1)) {
			zip.extractEntryTo(name, './tmp', false, options.overwrite);

			// Move file to the target location.
			fs.renameSync('./tmp/config.json', options.dest);

			// Added session to config.
			var config = require('../' + options.dest);
			config.session = session;
			fs.writeFileSync(options.dest, JSON.stringify(config, null, '\t'));

			// Cleanup.
			fs.rmdirSync('./tmp')
			fs.unlinkSync(archive);
		}
	});
}

var updateConfig = function(session, options)
{
	var deferred = Q.defer();

	downloadPackage(session, 'fontello.zip')
		.then(function() {
			unzipPackage('fontello.zip', session, options);
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
		, dest: 'config.json'
		, open: false
	});

	var deferred = Q.defer();

	if (_.isNull(options.session)) {
		// Try to get session from fontello config.
		var config = require('../' + options.config);

		if (_.isEmpty(config.session)) {
			getSession(options)
				.then(function(session) {
					config.session = session;
					fs.writeFileSync(options.config, JSON.stringify(config, null, '\t'));

					if (options.open)
						open(url + session);

					return updateConfig(session, options);
				});
		} else {
			updateConfig(config.session, options)
				.then(function() {
					deferred.resolve(true);
				})
				.catch(function(error) {
					// Remove session field from fontello config (since it failed) and try again.
					config.session = undefined;
					fs.writeFileSync(options.config, JSON.stringify(config, null, '\t'));
					fontelloUpdate(options);
				});
		}
	}
}

module.exports = function(options)
{
	fontelloUpdate(options);
}
