/**
 * Created by ElyDeLaCruz on 10/5/2014.
 * @note Allow bundles to have pointers to their gulp task pipes
 */
require('sjljs');

// Import base task proxy to extend
var TaskProxy = require('../TaskProxy'),
    path = require('path'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    minifycss = require('gulp-minify-css'),
    minifyhtml = require('gulp-minify-html'),
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
        var separator = wrangler.getTaskStrSeparator(),
            ext, concatFile,
            dependsOnTasks = ['concat' + separator + bundle.options.name],
            uglifyOptions = {},
            minifyCssOptions = wrangler.tasks.minify.cssTaskOptions;
            minifyHtmlOptions = wrangler.tasks.minify.htmlTaskOptions;

        // Create task for bundle
        gulp.task('minify' + separator + bundle.options.name, dependsOnTasks, function () {

            // Check for sections on bundle that can be minified
            ext = 'js';

            // Get file to minify (concatenated file) @todo later change this to recieve the pipe directly from the concat task
            concatFile = path.join(wrangler.cwd, wrangler.tasks.concat[ext + 'BuildPath'], bundle.options.name + '.' + ext);

            // Give gulp the list of sources to process
            gulp.src(concatFile)

                // Minify current source in the {artifacts}/ext directory
                .pipe(uglify(uglifyOptions))

                // Add file header
                .pipe(header(wrangler.tasks.minify.header, {bundle: bundle, fileExt: ext, fileHash: "{{hash goes here}}"}))

                // Dump to the directory specified in the `uglify` call above
                .pipe(gulp.dest(path.join(wrangler.cwd, wrangler.tasks.minify[ext + 'BuildPath'])));

            // Change extension to css and run similiar script as one above
            ext = 'css';

            concatFile = path.join(wrangler.cwd, wrangler.tasks.concat[ext + 'BuildPath'], bundle.options.name + '.' + ext);

            // Give gulp the list of sources to process
            gulp.src(concatFile)

                // Minify current source in the {artifacts}/ext directory
                .pipe(minifycss(minifyCssOptions))

                // Add file header
                .pipe(header(wrangler.tasks.minify.header, {bundle: bundle, fileExt: ext, fileHash: "{{hash goes here}}"}))

                // Dump to the directory specified in the `uglify` call above
                .pipe(gulp.dest(path.join(wrangler.cwd, wrangler.tasks.minify[ext + 'BuildPath'])));

            // Change extension to css and run similiar script as one above
            ext = 'html';

            concatFile = path.join(wrangler.cwd, wrangler.tasks.concat[ext + 'BuildPath'], bundle.options.name + '.' + ext);

            // Give gulp the list of sources to process
            gulp.src(concatFile)

                // Minify current source in the {artifacts}/ext directory
                .pipe(minifyhtml(minifyHtmlOptions))

                // Dump to the directory specified in the `uglify` call above
                .pipe(gulp.dest(path.join(wrangler.cwd, wrangler.tasks.minify[ext + 'BuildPath'])));

        }); // end of uglify task

    } // end of `registerBundle`

}); // end of export
