/**
 * Created by edelacruz on 10/8/2014.
 */

"use strict";

require("sjljs");

var mocha = require('gulp-mocha'),
    duration = require('gulp-duration'),
    TaskProxy = require('../TaskProxy'),
    chalk = require('chalk');

module.exports = TaskProxy.extend("MochaProxy", {

    registerGulpTask: function (taskName, gulp, bundle, wrangler) {
        var taskConfig = sjl.extend(true,
                JSON.parse(JSON.stringify(wrangler.tasks.mocha)), bundle.options.mocha),
            mochaOptions = taskConfig.options;

        gulp.task(taskName, function () {
            wrangler.log(chalk.cyan('\n  Running "' + taskName + '":'), '--mandatory');
            gulp.src(taskConfig.testsDir)
                .pipe(mocha(mochaOptions))
                .pipe(duration(chalk.cyan("mocha \"" + bundle.options.alias + "\" duration")));
        });
    },

    /**
     * @param bundle {Bundle}
     * @param gulp {gulp}
     * @param wrangler {Wrangler}
     */
    registerBundle: function (bundle, gulp, wrangler) {

        // Task string separator
        var self = this;

        if (!self.isBundleValidForTask(bundle)) {
            return;
        }

        this.registerGulpTask('mocha:' + bundle.options.alias, gulp, bundle, wrangler);

    },


    registerBundles: function (bundles, gulp, wrangler) {
        var self = this,
            taskName,
            tasks = [];

        bundles.forEach(function (bundle) {
            if (!self.isBundleValidForTask(bundle)) {
                return;
            }
            taskName = 'mocha:' + bundle.options.alias;
            self.registerGulpTask(taskName, gulp, bundle, wrangler);
            tasks.push(taskName);
        });

        gulp.task('mocha', function () {
            wrangler.log('\n  Running "mocha" task(s):', '--mandatory');
            wrangler.launchTasks(tasks, gulp);
        });
    },

    isBundleValidForTask: function (bundle) {
        return bundle && bundle.has('mocha');
    }
});