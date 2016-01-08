/**
 * Created by elydelacruz on 10/4/15.
 * @todo Figure out if we need to create an `TaskManagerEnv` object to enforce that the inner used properties are set
 */

'use strict';

let TaskAdapter = require('./TaskAdapter'),
    TaskManagerConfig = require('./TaskManagerConfig'),
    TaskRunnerAdapter = require('./TaskRunnerAdapter'),
    BundleConfig = require('./BundleConfig'),
    sjl = require('sjljs'),
    SjlSet = sjl.ns.stdlib.SjlSet,
    SjlMap = sjl.ns.stdlib.SjlMap,
    gwUtils = require('./Utils'),
    path = require('path'),
    fs = require('fs'),
    contextName = 'TaskManager';

class TaskManager extends TaskManagerConfig {

    constructor(config) {

        // Call super
        super();

        // Private variables that we expose to the outside start with `_`
        var self = this,
            _argv               = {},
            _configBase         = '',
            _configPath         = '',
            _cwd                = '',
            _pwd                = '',
            _taskRunnerAdapter  = {};

        // Define properties
        Object.defineProperties(self, {
            argv: {
                get: () => {
                    return _argv;
                },
                set: (value) => {
                    sjl.throwTypeErrorIfNotOfType(contextName, '_argv', value, Object);
                    _argv = value;
                }
            },
            availableBundleNames: {},
            availableTaskNames: {},
            availableStaticTaskNames: {},
            bundles: {
                value: new SjlMap()
            },
            bundleFileNames: {
                value: new SjlSet()
            },
            sessionBundleNames: {
                value: new SjlSet()
            },
            configBase: {
                get: () => {
                    return _configBase;
                },
                set: (value) => {
                    sjl.throwTypeErrorIfNotOfType(
                        contextName, '_configBase', value, String,
                        'Only strings are allowed for this property');
                    _configBase = value;
                }
            },
            commands: {
                value: new SjlSet()
            },
            configPath: {
                get: () => {
                    return _configPath;
                },
                set: (value) => {
                    sjl.throwTypeErrorIfNotOfType(
                        contextName, '_configPath', value, String,
                        'Only strings are allowed for this property');
                    _configPath = value;
                }
            },
            config: {
                value: config
            },
            taskAdapters: {
                value: new Map()
            },
            sessionTaskNames: {
                value: new SjlSet()
            },
            splitCommands: {
                value: new Map()
            },
            staticTaskAdapters: {
                value: new Map()
            },
            sessionStaticTaskNames: {
                value: new SjlSet()
            },
            taskRunnerAdapter: {
                get: () => {
                    return _taskRunnerAdapter;
                },
                set: (value) => {
                    var retVal = this;
                    if (value && value instanceof TaskRunnerAdapter) {
                        _taskRunnerAdapter = value;
                    }
                    else if (value && value instanceof TaskRunnerAdapter === false) {
                        throw new TypeError (contextName + '.taskRunnerAdapter only accepts types of `TaskRunnerAdapter` or ' +
                            'subclasses of `TaskRunnerAdapter`.  Type recieved: \'' + sjl.classOf(value) + '\'.');
                    }
                }
            },
            cwd: {
                get: () => {
                    return _cwd;
                },
                set: (value) => {
                    sjl.throwTypeErrorIfNotOfType(contextName, '_cwd', value, String);
                    _cwd = value;
                }
            },
            pwd: {
                get: () => {
                    return _pwd;
                },
                set: (value) => {
                    sjl.throwTypeErrorIfNotOfType(contextName, '_pwd', value, String);
                    _pwd = value;
                }
            }
        });

        this.set(config);
        this.init();
    }

    /**
     * @todo add unknown bundle-name, task-name, and static-task-name warnings
     */
    init () {
        // @todo temporary escape here
        if (sjl.empty(this.argv)) {
            return this;
        }

        let splitCommandOn = ':',
            bundleFileNames = this.bundleFileNames
                .addFromArray(fs.readdirSync(this.config.bundlesPath));

        var availableTaskNames          = this.availableTaskNames.addFromArray(Object.keys(this.config.tasks)),
            availableStaticTaskNames    = this.availableStaticTaskNames(Object.keys(this.config.staticTasks)),
            availableBundleNames        = this.availableBundleNames.addFromArray(bundleFileNames.map((fileName) => {
                return fileName.split(/\.(?:json|js|yaml|yml)$/)[0];
            })),
            addedBundleNames            = this.sessionBundleNames,
            addedTaskNames              = this.sessionTaskNames,
            addedStaticTaskNames        = this.sessionStaticTaskNames;

        // Get split commands
        this.argv._.forEach((value) => {
            let splitCommand = this.taskRunnerAdapter.splitCommand(value, splitCommandOn),
                bundle = splitCommand.bundle,
                command = splitCommand.command,
                taskName = splitCommand.taskAlias;

            // Task Names
            if (!sjl.isEmptyOrNotOfType(taskName, String) && availableTaskNames.has(taskName) && !addedTaskNames.has(taskName)) {
                addedTaskNames.add(taskName);
                this._initTaskAdapter(taskName, this.config.tasks[taskName]);
            }
            else {
                throw new Error('An error occurred before registering taskName name "' + taskName + '".' +
                    '  Either the taskName name is empty, not of the correct type, or the taskName was not found in ' +
                    '`available taskNames`.');
            }

            // Static Task Names
            if (sjl.classOfIs(command, String) && command.indexOf(splitCommandOn) === -1
                && !availableTaskNames.has(command)
                && availableStaticTaskNames.has(command)
                && !addedStaticTaskNames.has(command)) {
                addedStaticTaskNames.add(command);
                this._initStaticTaskAdapter(taskName, this.config.staticTasks[taskName]);
            }
            else {
                throw new Error('An error occurred before registering staticTaskName name "' + staticTaskName + '".' +
                    '  Either the staticTaskName name is empty, not of the correct type, or the staticTaskName was not found in ' +
                    '`available staticTaskNames`.');
            }

            // Bundle Names
            if (!sjl.isEmptyOrNotOfType(bundle, String)
                && availableBundleNames.indexOf(bundle) > -1
                && !addedBundleNames.has(bundle)) {
                addedBundleNames.add(bundle);
                this._initBundle(bundle, gwUtils.loadConfigFileFromSupportedExts(
                    path.join(this.cwd, this.configs.bundlesPath, bundle)));
            }
            else {
                throw new Error('An error occurred before registering bundle name "' + bundle + '".' +
                    '  Either the bundle name is empty, not of the correct type, or the bundle was not found in ' +
                    '`available bundles`.');
            }

            // Split commands
            this.splitCommands.set(command, splitCommand);

        }, this);

        // Clear memory
        availableStaticTaskNames = null;
        availableTaskNames = null;

        //console.log('Beginning `TaskManager` run sequence.');
        return this.taskRunnerAdapter.taskRunner;
    }

    getTaskAdapter(taskName) {
        var taskAdapter,
            hasTaskName = this.availableTaskNames.has(taskName),
            taskNameNotRegistered = this.sessionTaskNames.has(taskName);
        if (hasTaskName) {
            if (taskNameNotRegistered) {
                taskAdapter = this._initTaskAdapter(taskName, this.config.tasks[taskName]);
            }
            else {
                taskAdapter = this.taskAdapters.get(taskName);
            }
        }
        else {
            throw new Error ('`' + contextName + 'getTaskAdapter` doesn\'t have a task ' +
                'available for task name "' + taskName + '".  Available task names: \n - ' +
                sjl.implode(this.availableTaskNames, '\n - ') + '.');
        }
        return taskAdapter;
    }

    registerBundle (bundle) {
        var bundleObj;
        this.splitCommands.forEach(function (commandMeta) {
            if (commandMeta.bundle !== bundle.alias) {
                return;
            }
        });
        return bundleObj;
    }

    isTaskRegisteredWithTaskRunner(command) {
        return this.taskRunnerAdapter.has(command);
    }

    registerBundleWithTaskAdapters (bundle, tasksAdapters) {

    }

    _initTaskAdapter(taskName, taskConfig) {
        var FetchedTaskAdapterClass = require(path.join(this.cwd, taskConfig.constructorLocation)),
            taskAdapter = new FetchedTaskAdapterClass(taskConfig, this);
        this.taskAdapters.set(taskName, taskAdapter);
        return taskAdapter;
    }

    _initBundle(bundleName, bundleConfig) {
        var bundleObj = new BundleConfig(bundleConfig);
        this.bundles.set(bundleName, bundleObj);
        return bundleObj;
    }

    _initStaticTaskAdapter(staticTaskName, staticTaskConfig) {
        var staticTaskAdapter = null;
        this.staticTaskAdapters.set(staticTaskName, staticTaskAdapter);
        return staticTaskAdapter;
    }

}

module.exports = TaskManager;
