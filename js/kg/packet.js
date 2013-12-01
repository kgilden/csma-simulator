
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

        this.setIsConflict(false);
    };

    /**
     * Creates a new conflicting packet.
     *
     * @param {kg.device|kg.cable|null} from Originating source of the packet
     */
    packet.conflict = function createConflictingPacket(from) {
        var conflict = new packet(from);

        conflict.setIsConflict(true);

        return conflict;
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
     * Whether the packet was previously in the given object.
     *
     * @param {Object} previous
     *
     * @returns {Boolean}
     */
    packet.prototype.isPrevious = function isPrevious(previous) {
        return this._previous === previous;
    }

    /**
     * @returns {Boolean}
     */
    packet.prototype.isRegular = function isRegular() {
        return !this._isConflict;
    };

    /**
     * @returns {Boolean}
     */
    packet.prototype.isConflict = function isConflict() {
        return this._isConflict;
    };

    /**
     * @param {Boolean} isConflict
     */
    packet.prototype.setIsConflict = function setIsConflict(isConflict) {
        this._isConflict = isConflict;
    };

    kg.packet = packet;

})(kg);
