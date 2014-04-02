
var kg = window.kg || {};

/**
 * Device is a single device communicating over the network.
 */
(function (kg) {

    if (kg.device) {
        return;
    }

    /**
     * @param {kg.tlgBuilder} tlgBuilder
     * @param {null|jQuery}   $element
     * @param {null|jQuery}   $numpad
     */
    var device = function createDevice(tlgBuilder, $element, $numpad) {
        this._tlgBuilder = tlgBuilder;

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
        this._isReceiving = false;

        if ($element) {
            this.setElement($element);
        }

        this._numpad = new kg.numpad($numpad);
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
     */
    device.prototype.sendTlg = function sendTlg(to) {
        this._tlgs.push(this._tlgBuilder.create(this, to));

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
        if (packet.isCollision()) {
            this._isCollision = true;
        } else {
            this._isReceiving = true;
        }

        if (packet.isTo(this)) {
            changeColor.call(this, packet.getColor());
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

            return this;
        }

        if (this.isReceiving()) {
            this._isReceiving = false;

            return this;
        }

        if (tlg = this.getNextTlgForTx()) {

            if (this.isTxBlocked()) {
                tlg.sendCount = 0;
            } else {
                changeColor.call(this, tlg.color);
                sendPacket(this._connections, new kg.packet(this, tlg.to, this, tlg.color));
                tlg.sendCount++;
            }
        } else {
            changeColor.call(this, null);
            updateRetryCount.call(this, 0);
        }

        return this;
    };

    /**
     * Resolves an occurred collison by waiting for a random amount of time
     * until retransmitting. Waiting is triggered only if this device is
     * actually in the middle of transmitting and is not already waiting
     * for a slot time.
     */
    device.prototype.handleCollision = function handleCollision() {
        this._isCollision = false;

        // If the device is waiting for its slot time, it shouldn't be
        // pariticipating in the current conflict resolving.
        if (this.isWaiting()) {
            return;
        }

        // The device is not sending any telegrams at the moment. Thus, it
        // shouldn't take part in the current conflict resolving.
        if (!this.isSending()) {
            return;
        }

        this._waitTime = 50 * this._numpad.calculateSlotTime();

        updateRetryCount.call(this, this._numpad.getFailedAttemptCount());

        this._numpad.toggleSelected(null);

        console.log(this._$element.attr('id') + ': wait time is ' + this._waitTime + ' ticks');
    };

    device.prototype.updateNumpad = function updateNumpad() {
        var selector = '.numpad-' + (this._waitTime / 50);

        this._$numpad.find(selector)[0].classList.add('numpad-selected');
    };

    device.prototype.getNextTlgForTx = function getNextTlgForTx() {
        var tlg;

        while (this._tlgs.length > 0) {
            tlg = this._tlgs[0];

            // This telegram shouldn't even be on the list anymore as all of
            // its packets have been sent, discard it and move on to fetching
            // the next telegram.
            if (tlg.sendCount >= tlg.length) {
                this._numpad.reset();
                this._tlgs.shift();

                console.log(this._$element.attr('id') + ': sent to ' + tlg.to._$element.attr('id'));

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
     * Whether the device is receiving data.
     *
     * @returns {Boolean}
     */
    device.prototype.isReceiving = function isReceiving() {
        return this._isReceiving;
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
        return this.isCollision() || this.isReceiving();
    };

    /**
     * Whether the current device is sending packets.
     *
     * @return {Boolean}
     */
    device.prototype.isSending = function isSending() {
        return this._tlgs.length > 0;
    };

    /**
     * Whether the current device is waiting for its time slot to transmit.
     *
     * @return {Boolean}
     */
    device.prototype.isWaiting = function isWaiting() {
        return this._waitTime > 0;
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

    /**
     * Changes the color of a device.
     *
     * @param {String} color
     */
    function changeColor(color) {
        this._$element.find('g').children().css('fill', color ? color : '');
    }

    /**
     * Updates the retry count of a device (the number of device a single
     * packet has been attempted to transmit).
     *
     * @param {Integer} retryCount
     */
    function updateRetryCount(retryCount)
    {
        this._$element.find('.txt-retry-count').text(retryCount);
    }

    kg.device = device;

})(kg);
