describe('kg.device', function () {

    it('should be able to be instantiated', function () {
        var device = new kg.device();

        expect(device._$element).toBeDefined();
        expect(device._packets).toBeDefined();
        expect(device._connections).toBeDefined();
    });

    it('can use a jQuery object as a visual representation', function () {
        var device = new kg.device(),
            $baz = $('<div id="baz" />');

        // Only jQuery objects allowed.
        expect(function () { device.setElement('foo'); }).toThrow();

        // The jQuery object must have selected a single element.
        expect(function () { device.setElement($()); }).toThrow();
        expect(function () { device.setElement($('<div><div /><div /></div>').find('div')); }).toThrow();

        device.setElement($baz);
        expect(device._$element).toEqual($baz);
    });

    it('converts telegrams to individual packets for sending', function () {
        var target = {},
            device,
            expected;

        device = new kg.device();
        device.sendTlg(target, 2);

        expected = [
            {source: device, target: {}},
            {source: device, target: {}},
        ];

        for (var i in expected) {
            expect(device._packets[i].isFrom(device)).toEqual(true);
            expect(device._packets[i].isTo(target)).toEqual(true);
            expect(device._packets[i].isPrevious(device)).toEqual(true);
        }
    });

    it('sends telegrams through connections', function () {
        var device,
            connection = {};

        connection.receivePacket = function () {};

        spyOn(connection, 'receivePacket');

        device = new kg.device();
        device.addConnection(connection);

        device.sendTlg(device, 1);
        device.tick();

        expect(connection.receivePacket.calls.length).toEqual(1);
    });

    it('only accepts packets addressed to it', function () {
        var packetA = {isTo: function () { return false; }},
            packetB = {isTo: function () { return true; }},
            device = new kg.device();

        expect(device.receivePacket(packetA)).toEqual(false);
        expect(device.receivePacket(packetB)).toEqual(true);
    });
});