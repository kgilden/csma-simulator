
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
        btnPause: '.btn-pause-active, .btn-pause-inactive',
        btnPauseActive: 'btn-pause-active',
        btnPauseInactive: 'btn-pause-inactive',
        btnSpeedIncrease: '.btn-speed-increase',
        btnSpeedDecrease: '.btn-speed-decrease',
        txtFps: '.txt-fps',
        cableClass: '.cbl',
        tickRate: 4,
        tlgLength: 100
    };

    simulator = function createSimulator(options) {
        var settings = $.extend({}, defaults, options),
            $devices = $(settings.deviceClass, kg.context),
            $cables = $(settings.cableClass, kg.context),
            simulator = this;

        this._settings = settings;

        // Whether all the devices are in collision mode. In that case the
        // system should pause to let the user decide whether he would like
        // to manually choose slot times or let the simulator take care of it.
        this._collisionFound = false;

        // Device setup.
        $devices.each(function addDevicesToSimulator() {
            var $element = $(this),
                $numpad = $('#numpad-' + $element.attr('id'), kg.context);

            simulator.addDevice(new kg.device($element, $numpad));
        });

        // Cable setup.
        $cables.each(function addCablesToSimulator() {
            simulator.addCable(new kg.cable($(this)));
        });

        // Hook up devices and cables.
        connectComponents(simulator);

        // Event handler for (un)pausing the simulation.
        $(this._settings.btnPause, kg.context).on('click', function callToggle(e) {
            simulator.toggle();
        });

        // Event handler for increasing the simulation speed.
        $(this._settings.btnSpeedIncrease, kg.context).on('click', function callIncreaseSpeed(e) {
            simulator.increaseSpeed(e);
        });

        // Event handler for decreasing the simulation speed.
        $(this._settings.btnSpeedDecrease, kg.context).on('click', function callDecreaseSpeed(e) {
            simulator.decreaseSpeed(e);
        });

        simulator.updateFpsTxt(this._settings.tickRate);

        // Start the simulation.
        simulator.play();
    };

    /**
     * Starts the simulation.
     */
    simulator.prototype.play = function play() {
        this._intervalId = setInterval(function callTickHandler(simulator) {
            simulator.tickHandler.call(simulator);
        }, 1000 / this._settings.tickRate, this);

        $(this._settings.btnPause, kg.context)
            .removeClass(this._settings.btnPauseActive)
            .addClass(this._settings.btnPauseInactive)
        ;
    };

    /**
     * Stops the simulation.
     */
    simulator.prototype.pause = function pause() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);

            this._intervalId = null;
        }

        $(this._settings.btnPause, kg.context)
            .removeClass(this._settings.btnPauseInactive)
            .addClass(this._settings.btnPauseActive)
        ;
    };

    /**
     * Toggles the simulation (paused vs playing).
     */
    simulator.prototype.toggle = function toggle() {
        if (this._intervalId) {
            this.pause();
        } else {
            this.play();
        }
    };

    /**
     * Updates the display with the new tickrate.
     *
     * @param newTickRate
     */
    simulator.prototype.updateFpsTxt = function updateFpsTxt(newTickRate) {
        $(this._settings.txtFps, kg.context).text(newTickRate + ' fps');
    };

    /**
     * Changes the tickrate by the given delta.
     *
     * @param {Number} delta
     */
    simulator.prototype.changeTickRate = function changeTickRate(delta) {
        var newTickRate = this._settings.tickRate + delta;

        if (newTickRate < 1 || 32 < newTickRate) {
            return;
        }

        console.log('setting tickrate to ' + newTickRate);

        this._settings.tickRate = newTickRate;

        $(this._settings.txtFps, kg.context).text(newTickRate + ' fps');

        // Restarts only if it's already running as to not unintentionally unpause.
        if (this._intervalId) {
            this.pause();
            this.play();
        }
    };

    /**
     * @returns {Number} The tickrate
     */
    simulator.prototype.getTickRate = function getTickRate() {
        return this._settings.tickRate;
    };

    /**
     * Increases the simulation speed by doubling the tickrate.
     *
     * @param e
     */
    simulator.prototype.increaseSpeed = function increaseSpeed(e) {
        this.changeTickRate(this.getTickRate());
    };

    /**
     * Decreases the simulation speed by cutting the tickrate in half.
     *
     * @param e
     */
    simulator.prototype.decreaseSpeed = function decreaseSpeed(e) {
        this.changeTickRate(-0.5 * this.getTickRate());
    };

    simulator.prototype.tickHandler = function tickHandler() {
        var components = this.getComponents(),
            cables = this.getCables(),
            id = null;

        for (id in cables) cables[id].preTick();
        for (id in components) components[id].tick();

        this.handleCollision();
    };

    /**
     * Goes into conflict handling mode, if there is a need.
     *
     * http://en.wikipedia.org/wiki/Exponential_backoff
     * http://en.wikipedia.org/wiki/Carrier_sense_multiple_access_with_collision_avoidance
     */
    simulator.prototype.handleCollision = function handleCollision() {
        var devices = this.getDevices(),
            cables  = this.getCables(),
            i;

        // First of all, each device must be aware that there has been a conflict.
        for (i = 0; i < devices.length; i++) {
            if (!devices[i].isCollision()) {
                return;
            }
        }

        // Pause the simulation right after the collision has reached to all
        // of the devices. This way the user can decide what to do.
        if (!this._collisionFound) {
            this._collisionFound = true;

            this.pause();

            return;
        }

        for (i in cables) {
            cables[i].clear();
        }

        for (i in devices) {
            devices[i].handleCollision();
        }

        this._collisionFound = false;
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
        if (!this._devices) {
            this._devices = [];
        }

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

            me.clickHandler.call(me, e);

        });

        return me;
    };

    simulator.prototype.clickHandler = function clickHandler(e) {
        var device = this.getComponents()[$(e.currentTarget).attr('id')];

        if (!this._from) {
            this._from = device;

            return;
        }

        this._from.sendTlg(device, this._settings.tlgLength);
        this._from = null;
    };

    /**
     * Gets all cables participating in the simulation.
     *
     * @returns {Array}
     */
    simulator.prototype.getCables = function getCables() {
        if (!this._cables) {
            this._cables = [];
        }

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
