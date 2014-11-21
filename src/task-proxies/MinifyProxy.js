/**
 * Created by ElyDeLaCruz on 10/5/2014.
 */
require('sjljs');

// Import base task proxy to extend
var TaskProxy = require('../TaskProxy'),
    path = require('path'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    crypto = require('crypto');

module.exports = TaskProxy.extend("MinifyProxy", {

    /**
     * Regsiters bundle with uglify gulp task.
     * @param bundle {Bundle}
     * @param gulp {gulp}
     * @param wrangler {GulpBundleWrangler}
     */
    registerBundle: function (bundle, gulp, wrangler) {

        // Task string separator
        var separator = wrangler.getTaskStrSeparator();

        // Create task for bundle
        gulp.task('minify' + separator + bundle.options.name, function () {

            // Check for sections on bundle that can be minified
            var ext = 'js',
                concatFile = path.join(wrangler.cwd, wrangler.tasks.concat[ext + 'BuildPath'], bundle.options.name + '.' + ext);

            // Give gulp the list of sources to process
            gulp.src(concatFile)

                // Minify current source in the {artifacts}/ext directory
                .pipe(uglify())

                // Add file header
                .pipe(header(wrangler.tasks.minify.header, {bundle: bundle, fileExt: ext, fileHash: "{{hash goes here}}"}))

                // Dump to the directory specified in the `uglify` call above
                .pipe(gulp.dest(path.join(wrangler.cwd, wrangler.tasks.minify[ext + 'BuildPath'])));

            // Minify css files

        }); // end of uglify task

    } // end of `registerBundle`

}); // end of export
