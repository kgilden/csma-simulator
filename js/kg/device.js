
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

        // A queue of telegrams to be sent out. Each element is an object
        // containing the the initial length of the telegram and the number
        // of sent packets as well as the target device.
        this._tlgs = [];

        // Number of failed attempts
        this._failedAttempts = 0;

        // A list of connections from this device.
        this._connections = [];

        // Whether the device received a packet within the previous cycle.
        this._receivedPacket = false;

        if ($element) {
            this.setElement($element);
        }
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
        this._tlgs.push({
            target: target,
            length: length,
            sendCount: 0
        });

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
        this._receivedPacket = true;

        if (packet.isCollision()) {
            this._isCollision = true;
        }

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
        var tlg;

        if (this._waitTime) {
            this._waitTime--;

            this._receivedPacket = false;

            return this;
        }

        if (tlg = this.getNextTlgForTx()) {

            if (this.isTxBlocked()) {
                // Oh shit, the line is blocked! Better reset the telegram
                // send count.
                tlg.sendCount = 0;

                this._failedAttempts += (this._failedAttempts < 7 ? 1 : 0);

                this._waitTime = 10 * Math.round(Math.random() * (Math.pow(2, this._failedAttempts) - 1));

            } else {

                this._failedAttempts = 0;

                sendPacket(this._connections, new kg.packet(this, tlg.target, this));
                tlg.sendCount++;

            }

        }

        // Reset the flag for the next cycle.
        this._receivedPacket = false;

        return this;
    };

    device.prototype.getNextTlgForTx = function getNextTlgForTx() {
        var tlg;

        while (this._tlgs.length > 0) {
            tlg = this._tlgs[0];

            // This telegram shouldn't even be on the list anymore as all of
            // its packets have been sent, discard it and move on to fetching
            // the next telegram.
            if (tlg.sendCount >= tlg.length) {
                this._tlgs.shift();

                continue;
            }

            // The telegram is ready for use.
            return tlg;
        }
    };

    /**
     * Whether there is a collision in the system.
     *
     * @returns {Boolean}
     */
    device.prototype.isCollision = function isCollision() {
        return this._isCollision;
    };

    /**
     * Whether the device is blocked for transmitting packets. This can happen
     * when there's either a conflict or some other device is transmitting.
     *
     * @returns {Boolean}
     */
    device.prototype.isTxBlocked = function isTxBlocked() {
        // Either the device received a packet within the previous cycle
        // or there has been a conflict.
        return this._receivedPacket || this.isCollision();
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