
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
     */
    var packet = function createPacket(from, to, previous) {
        this._from     = from || null;
        this._to       = to || null;
        this._previous = previous || null;

        this.setIsCollision(false);
    };

    /**
     * Creates a new collision packet.
     *
     * @param {kg.device|kg.cable|null} from Originating source of the packet
     */
    packet.collision = function createCollisionPacket(from) {
        var collision = new packet(from);

        collision.setIsCollision(true);

        return collision;
    };

    /**
     * @param {kg.device|kg.cable|null} previous Optionally modify the previous location
     *
     * @returns {kg.packet} A clone of the packet
     */
    packet.prototype.clone = function clone(previous) {
        var clone = new packet(this._from, this._to, previous || this._previous);

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

    kg.packet = packet;

})(kg);
