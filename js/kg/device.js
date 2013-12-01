
var kg = window.kg || {};

/**
 * Device is a single device communicating over the network.
 */
(function (kg) {

    if (kg.device) {
        return;
    }

    /**
     * @param {null|jQuery} $element
     */
    var device = function createDevice($element) {
        // Visual representation of the device.
        this._$element = null;

        // A queue of packets to be sent out on subsequent ticks.
        this._packets = [];

        // A list of connections from this device.
        this._connections = [];

        if ($element) {
            this.setElement($element);
        }

        this._connections = [];
    };

    /**
     * Sets the visual DOM element that represents the device.
     *
     * @param {jQuery} $element
     */
    device.prototype.setElement = function setElement($element) {
        if (!($element instanceof $)) {
            throw 'Element must be an instance of `jQuery`.';
        }

        if ($element.length !== 1) {
            throw 'The `jQuery` object must be selecting a single dom element, got ' + $element.length;
        }

        this._$element = $element;

        return this;
    };

    device.prototype.addConnection = function addConnecton(connection) {
        this._connections.push(connection);

        return this;
    };

    /**
     * Sends a telegram to a device.
     *
     * @param {kg.device} target The target device
     * @param {String}    length Length of the telegram
     */
    device.prototype.sendTlg = function sendTlg(target, length) {
        for (var i = 0; i < length; i++) {
            this._packets.push(new kg.packet(this, target, this));
        }

        return this;
    };

    /**
     * Receives a packet.
     *
     * @param {kg.packet} packet
     *
     * @returns {Boolean} whether the message was successfully received or
     *                     false, if the message wasn't addressed to this
     *                     device.
     */
    device.prototype.receivePacket = function receivePacket(packet) {
        if (packet.isTo(this)) {
            return true;
        }

        // The packet is not meant for this device.
        return false;
    };

    /**
     * Orders the device to simulate a clock tick.
     */
    device.prototype.tick = function tick() {
        var packet;

        if (packet = this._packets.shift()) {
            sendPacket(this._connections, packet);
        }

        return this;
    };

    /**
     * Sends a single packet to the connected devices.
     *
     * @param {Array}     an array of connections
     * @param {kg.device} target The target device
     */
    function sendPacket(connections, packet) {
        for (var i in connections) {
            connections[i].receivePacket(packet);
        }
    };

    kg.device = device;

})(kg);