
var kg = window.kg || {};

/**
 * Simulator is the central component to control the simulation and all of
 * its components.
 */
(function (kg, $) {
    'use strict';

    if (kg.simulator) {
        return;
    }

    var defaults,
        simulator;

    defaults = {
        deviceNames: ['apollo', 'hermes', 'pluto', 'vesta', 'minerva'],
        deviceClass: '.device',
        cableClass: '.cbl',
        tickRate: 1,
        tlgLength: 30
    };

    simulator = function createSimulator(options) {
        var settings = $.extend({}, defaults, options),
            $devices = $(settings.deviceClass, kg.context),
            $cables = $(settings.cableClass, kg.context),
            simulator = this;

        this._settings = settings;

        // Device setup.
        $devices.each(function addDevicesToSimulator() {
            simulator.addDevice(new kg.device($(this)));
        });

        // Cable setup.
        $cables.each(function addCablesToSimulator() {
            simulator.addCable(new kg.cable($(this)));
        });

        // Hook up devices and cables.
        connectComponents(simulator);

        // Timer setup.
        setInterval(function callTickHandler(simulator) {
            simulator.tickHandler.call(simulator);
        }, 1000 / settings.tickRate, simulator);
    };

    simulator.prototype.tickHandler = function tickHandler() {
        var components = this.getComponents(),
            cables = this.getCables(),
            id = null;

        for (id in cables) cables[id].preTick();
        for (id in components) components[id].tick();
    };

    /**
     * Gets all components (both devices and cables) mapped by their
     * respective DOM element IDs.
     *
     * @returns {Object}
     */
    simulator.prototype.getComponents = function getComponents() {
        this._components = this._components || {};

        return this._components;
    };

    /**
     * Gets all devices participating in the simulation.
     *
     * @returns {Array}
     */
    simulator.prototype.getDevices = function getDevices() {
        this._devices = this._devices || [];

        return this._devices;
    };

    /**
     * Adds a new device to the simulator.
     *
     * @param {kg.device}
     */
    simulator.prototype.addDevice = function addDevice(device) {
        var me = this;

        me.getDevices().push(device);
        me.getComponents()[device._$element.attr('id')] = device;

        device._$element.on('click', function (e) {
            device.sendTlg(null, me._settings.tlgLength);
        });

        return me;
    };

    /**
     * Gets all cables participating in the simulation.
     *
     * @returns {Array}
     */
    simulator.prototype.getCables = function getCables() {
        this._cables = this._cables || [];

        return this._cables;
    };

    /**
     * Adds a new cable to the simulator.
     *
     * @param {kg.cable}
     */
    simulator.prototype.addCable = function addCable(cable) {
        this.getCables().push(cable);
        this.getComponents()[cable._$element.attr('id')] = cable;

        return this;
    };

    /**
     * Connects all of the components of a simulator.
     *
     * @param {kg.simulator}
     */
    function connectComponents(simulator) {
        var components = simulator.getComponents(),
            id = null,
            i,
            relatedIds;

        for (id in components) {

            if (!components.hasOwnProperty(id)) {
                continue;
            }

            relatedIds = findRelatedIds(components[id]._$element);

            for (i = 0; i < relatedIds.length; i++) {

                if (!(relatedIds[i] in components)) {
                    throw 'trying to connect a component with nonexisting id `' + relatedIds[i] + '` to component `' + id + '`';
                }

                components[id].addConnection(components[relatedIds[i]]);
            }
        }
    }

    /**
     * Finds element ids related to the given element. It basically looks
     * for classes starting with `rel-` and breaks up anything that comes
     * after it from the hyphens. For example the class `foo rel-bah-baz rel-gah`
     * would yeld ['bah', 'baz', 'gah'].
     *
     * @param {jQuery} $element
     *
     * @return {Array}
     */
    function findRelatedIds($element) {
        var classNames = $element.attr('class'),
            classParts = [],
            relatedIds = [];

        classNames = classNames.split(' ');

        for (var i in classNames) {

            if (!classNames[i].match(/^rel-/)) {
                continue;
            }

            classParts = classNames[i].split('-');
            classParts.shift();

            relatedIds = relatedIds.concat(classParts);

        }

        return relatedIds;
    }

    kg.simulator = simulator;

})(kg, jQuery);
