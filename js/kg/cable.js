
var kg = window.kg || {};

/**
 * kg.cable acts as a transmitter between devices. It's a single block of
 * the connection in the network. There are a number of cable instances
 * between the devices, each acting on its own. This results in a pixelated
 * line acting as the backbone of our LAN.
 */
(function (kg) {

    if (kg.cable) {
        return;
    }

    /**
     * @param {null|jQuery} $element
     */
    var cable = function createCable($element) {
        // Visual representation of the device.
        this._$element = null;

        // The packet received on this tick.
        this._packetRx = null;

        // The packet to be sent out on the next tick.
        this._packetTx = null;

        // A list of connections to other components.
        this._connections = [];

        if ($element) {
            this.setElement($element);
        }
    };

    /**
     * Sets the visual DOM element that represents the cable.
     *
     * @param {jQuery} $element
     */
    cable.prototype.setElement = function setElement($element) {
        if (!($element instanceof $)) {
            throw 'Element must be an instance of `jQuery`.';
        }

        if ($element.length !== 1) {
            throw 'The `jQuery` object must be selecting a single dom element, got ' + $element.length;
        }

        this._$element = $element;

        return this;
    };

    /**
     * @param {Object} connection Any object capable of transmitting telegrams
     */
    cable.prototype.addConnection = function addConnection(connection) {
        this._connections.push(connection);

        return this;
    };

    /**
     * Receives a packet for transmitting.
     *
     * @param {Object} packet The packet sent to this cable.
     *
     * @returns {Boolean} Whether the messages was successfully received
     */
    cable.prototype.receivePacket = function receivePacket(packet) {
        if (this._packetRx && this._packetRx.isConflict()) {
            // There's already a conflict packet in Rx - the received packet
            // is simply dropped.
            return false;
        }

        if (this._packetRx && this._packetRx.isRegular() && packet.isRegular()) {
            // There's a regular packet in Rx and another regular packet was
            // received. This marks the beginning of a conflict.

            this._packetRx = kg.packet.conflict();

            updateElement(this._$element, this._packetRx);

            return false;
        }

        // There's either no packet in Rx in which case any packet will do or
        // a conflicting packet was received and thus the previous one is
        // overriden.
        this._packetRx = packet;

        updateElement(this._$element, packet);

        return packet.isRegular();
    };

    /**
     * Orders the cable to simulate a clock tick.
     */
    cable.prototype.tick = function tick() {
        var packet;

        if (packet = this._packetTx) {

            this._packetTx = null;

            sendPacket(this._connections, packet);
        }

        this._packetTx = this._packetRx;
        this._packetRx = null;

        return this;
    };

    /**
     * Sends a single packet to the connected devices.
     *
     * @param {Array}     connections An array of connections
     * @param {kg.packet} the packet to be sent
     */
    function sendPacket(connections, packet) {
        for (var i in connections) {

            if (packet.isPrevious(connections[i])) {
                // Don't send the packet back to where it came from.
                continue;
            }

            connections[i].receivePacket(packet);
        }
    }

    /**
     * Updates the dom element to reflect the current state of this piece
     * of cable based on the packet.
     *
     * @param {jQuery|null} $element The target element
     * @param {Object}      packet   The packet to be used
     */
    function updateElement($element, packet) {
        if (!$element) {
            return;
        }

        if (packet.isRegular()) {
            $element.addClass('packet-regular');
        } else {
            $element.addClass('packet-conflict');
        }
    }

    kg.cable = cable;

})(kg);
