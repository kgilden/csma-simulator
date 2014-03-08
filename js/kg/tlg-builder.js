
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
        this._colors = [
            '#85C700',
            '#C7C400',
            '#0000C7',
            '#C700C7',
            '#00C7C7'
        ]
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
            from: from,
            to: to,
            length: this._tlgLength,
            sendCount: 0,
            color: getNextColor.call(this)
        };
    }

    /**
     * Gets the next color in line.
     *
     * @return {String}
     */
    function getNextColor() {
        var color;

        this._colors.push(color = this._colors.shift());

        return color;
    }

    kg.tlgBuilder = builder;

})(kg);
