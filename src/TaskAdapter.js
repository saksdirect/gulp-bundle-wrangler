/**
 * Created by elydelacruz on 10/4/15.
 */

'use strict';

let TaskAdapterConfig = require('./TaskAdapterConfig'),
    contextName = 'TaskAdapter';

class TaskAdapter {

    constructor (config, taskManager) {
        var _config = {};
        Object.defineProperties(this, {
            taskManager: {value: taskManager},
            config: {
                set: (value) => {
                    var classOfValue = sjl.classOf(value);
                    if (classOfValue === 'Object') {
                        _config = value instanceof TaskAdapterConfig ? value :
                            new TaskAdapterConfig(value);
                    }
                    else {
                        throw Error('`' + contextName + '.config` only accepts values of type "object" or' +
                            ' of sub-class `TaskAdapterConfig`.  Type recieved: "' + classOfValue + '".');
                    }
                },
                get: () => {
                    return _config;
                }
            }
        });
        this.config = config;
    }

    registerBundle (bundle, taskManager) {
        return this;
    }

    registerBundles (bundles, taskManager) {
        return this;
    }

    canRegisterBundle (bundle, taskManager) {
        return true;
    }
}

module.exports = TaskAdapter;
