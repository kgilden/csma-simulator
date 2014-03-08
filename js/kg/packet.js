
var kg = window.kg || {};

/**
 * kg.packet is the component which gets transmitted between the devices.
 */
(function (kg) {

    if (kg.packet) {
        return;
    }

    /**
     * @param {kg.device|kg.cable|null} from     Originating source of the packet
     * @param {kg.device|null}          to       The target which should receive it
     * @param {kg.device|kg.cable|null} previous Previous location of the packet
     * @param {String}                  color    Packet color
     */
    var packet = function createPacket(from, to, previous, color) {
        this._from     = from || null;
        this._to       = to || null;
        this._previous = previous || null;
        this._color    = color;

        this._colorVariations = [
            hexToRgb(increaseBrightness(color, 50)),
            hexToRgb(increaseBrightness(color, 40)),
            hexToRgb(increaseBrightness(color, 30)),
            hexToRgb(increaseBrightness(color, 20)),
            hexToRgb(increaseBrightness(color, 10)),
            hexToRgb(increaseBrightness(color, 0)),
        ];
    };

    /**
     * Creates a new collision packet.
     *
     * @param {kg.device|kg.cable|null} from Originating source of the packet
     */
    packet.collision = function createCollisionPacket(from) {
        var collision = new packet(from, null, null, '#FF0000');

        collision.setIsCollision(true);

        return collision;
    };

    /**
     * @param {kg.device|kg.cable|null} previous Optionally modify the previous location
     *
     * @returns {kg.packet} A clone of the packet
     */
    packet.prototype.clone = function clone(previous) {
        var clone = new packet(this._from, this._to, previous || this._previous, this._color);

        clone.setIsCollision(this.isCollision());

        return clone;
    };

    /**
     * @param {Object} from
     *
     * @returns {Boolean} Whether the packet originated form the specified object
     */
    packet.prototype.isFrom = function isFrom(from) {
        return this._from === from;
    };

    /**
     * @param {Object} to
     *
     * @returns {Boolean} Whether the packet is to be sent to the specified object
     */
    packet.prototype.isTo = function isTo(to) {
        return this._to === to;
    };

    /**
     * @param {Object} previous
     *
     * @returns {Boolean} Whether the previous location of the packet was the specified object
     */
    packet.prototype.isPrevious = function isPrevious(previous) {
        return this._previous === previous;
    };

    /**
     * @returns {Boolean}
     */
    packet.prototype.isRegular = function isRegular() {
        return !this._isCollision;
    };

    /**
     * @returns {Boolean}
     */
    packet.prototype.isCollision = function isCollision() {
        return this._isCollision;
    };

    /**
     * @param {Boolean} isCollision
     */
    packet.prototype.setIsCollision = function setIsCollision(isCollision) {
        this._isCollision = isCollision;
    };

    /**
     * Gets the packet color.
     *
     * @return {String}
     */
    packet.prototype.getColor = function getColor() {
        return this._color;
    };

    /**
     * Gets the variations of the packet color.
     *
     * @return {String}
     */
    packet.prototype.getColorVariations = function getColorVariations() {
        return this._colorVariations;
    };

    /**
     * Increases the brightness of a hex color code by 'percent' %.
     *
     * Source: stackoverflow.com/questions/6443990#6444043
     *
     * @param {String}  hex
     * @param {Integer} percent
     *
     * @return {String}
     */
    function increaseBrightness(hex, percent) {
        // strip the leading # if it's there
        hex = hex.replace(/^\s*#|\s*$/g, '');

        // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
        if(hex.length == 3){
            hex = hex.replace(/(.)/g, '$1$1');
        }

        var r = parseInt(hex.substr(0, 2), 16),
            g = parseInt(hex.substr(2, 2), 16),
            b = parseInt(hex.substr(4, 2), 16);

        return '#' +
           ((0|(1<<8) + r + (256 - r) * percent / 100).toString(16)).substr(1) +
           ((0|(1<<8) + g + (256 - g) * percent / 100).toString(16)).substr(1) +
           ((0|(1<<8) + b + (256 - b) * percent / 100).toString(16)).substr(1);
    }

    /**
     * Source: stackoverflow.com/questions/5623838#5624139
     *
     * @param {String} hex
     *
     * @return {String}
     */
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? 'rgb(' +
            parseInt(result[1], 16) + ', ' +
            parseInt(result[2], 16) + ', ' +
            parseInt(result[3], 16) +
        ')' : null;
    }

    kg.packet = packet;

})(kg);
