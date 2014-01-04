
var kg = window.kg || {};

/**
 * kg.cable acts as a transmitter between devices. It's a single block of
 * the connection in the network. There are a number of cable instances
 * between the devices, each acting on its own. This results in a pixelated
 * line acting as the backbone of our LAN.
 */
(function (kg, $) {

    if (kg.cable) {
        return;
    }

    var defaults = {
        class_default: 'cbl-def',
        class_data: 'cbl-dat',
        class_collision: 'cbl-nok'
    };

    /**
     * @param {null|jQuery} $element
     */
    var cable = function createCable($element, options) {
        // Visual representation of the device.
        this._$element = null;

        // The packet received on this tick.
        this._packetRx = null;

        // The packet to be sent out on the next tick.
        this._packetTx = null;

        // A list of connections to other components.
        this._connections = [];

        // Cable settings (options are merged into default values).
        this._settings = $.extend({}, defaults, options);

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
     * Clears packets from the cable.
     */
    cable.prototype.clear = function clear() {
        this._packetRx = null;
    };

    /**
     * Receives a packet for transmitting.
     *
     * @param {Object} packet The packet sent to this cable.
     *
     * @returns {Boolean} Whether the messages was successfully received
     */
    cable.prototype.receivePacket = function receivePacket(packet) {

        if (this._packetRx && this._packetRx.isCollision()) {
            // There's already a collision in Rx - the received packet
            // is simply dropped.
            return false;
        }

        if (this._packetRx && this._packetRx.isRegular() && packet.isRegular()) {
            // There's a regular packet in Rx and another regular packet was
            // received. This marks the beginning of a collision.

            this._packetRx = kg.packet.collision();

            return false;
        }

        // There's either no packet in Rx in which case any packet will do or
        // a conflicting packet was received and thus the previous one is
        // overriden.
        this._packetRx = packet;

        return packet.isRegular();
    };

    /**
     * Executes all necessary tasks prior to the tick.
     */
    cable.prototype.preTick = function moveRxToTx() {
        if (!this._packetRx) {
            return this;
        }

        this._packetTx = this._packetRx;

        if (!this._packetRx.isCollision()) {
            // Keep collision packets in the cable.
            this._packetRx = null;
        }

        return this;
    };

    /**
     * Orders the cable to simulate a clock tick.
     */
    cable.prototype.tick = function updateAndTransmitPacket() {
        updateElement(this._$element, this._packetTx, [
            this._settings.class_default,
            this._settings.class_data,
            this._settings.class_collision
        ]);

        if (!this._packetTx) {
            return this;
        }

        transmitPacket(this._packetTx, this, this._connections);

        this._packetTx = null;

        return this;
    };

    /**
     * Updates the dom element to reflect the current state of this piece
     * of cable based on the packet.
     *
     * @param {jQuery|null} $element   The target element
     * @param {Object}      packet     The packet to be used
     * @param {Array}       classNames List of used class names
     */
    function updateElement($element, packet, classNames) {
        if (!$element) {
            return;
        }

        var classList = $element[0].classList;

        // First remove all previous `cbl-*` classes.
        for (var i in classNames) {
            classList.remove(classNames[i]);
        }

        // Now, based on the packet type and whether a packet was even sent,
        // decide which class to add.
        if (!packet) {
            classList.add(classNames[0]);
        } else {
            classList.add(packet.isRegular() ? classNames[1] : classNames[2]);
        }
    }

    /**
     * Transmits the packet to all connected components except for the
     * connection from where the packet was received.
     *
     * @param {kg.packet} The packet to transmit
     * @param {kg.cable}  New previous location of the packet
     * @param {Array}     A list of components where to send the packet
     */
    function transmitPacket(packet, newPrevious, connections) {
        for (var i in connections) {

            if (packet.isPrevious(connections[i])) {
                // Don't send the packet back to where it came from.
                continue;
            }

            connections[i].receivePacket(packet.clone(newPrevious));
        }
    }

    kg.cable = cable;

})(kg, jQuery);
