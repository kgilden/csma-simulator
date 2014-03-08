
var kg = window.kg || {};

/**
 * Builds telegrams for the simulation. A telegram in the context of this
 * system is a simple object containing the information about how many
 * packets should be sent from which device to which device.
 */
(function (kg) {

    if (kg.tlgBuilder) {
        return;
    }

    /**
     * Creates a new telegram builder.
     *
     * @param {Integer} tlgLength
     */
    var builder = function createBuilder(tlgLength) {
        this._tlgLength = tlgLength;
    };

    /**
     * Creates a new telegram.
     *
     * @param {device} from The device from which it will be sent
     * @param {device} to   Target device
     *
     * @return {Object}
     */
    builder.prototype.create = function createTlg(from, to) {
        return {
            to: to,
            length: this._tlgLength,
            sendCount: 0
        };
    }

    kg.tlgBuilder = builder;

})(kg);
