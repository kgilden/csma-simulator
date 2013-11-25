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
        var device,
            expected;

        device = new kg.device();
        device.sendTlg({}, 2);

        expected = [
            {source: device, target: {}},
            {source: device, target: {}},
        ];

        for (var i in expected) {
            expect(device._packets[i].source).toEqual(expected[i].source);
            expect(device._packets[i].target).toEqual(expected[i].target);
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

    it('ignores packets not addressed to it', function () {
        var packet,
            deviceA = new kg.device(),
            deviceB = new kg.device();

        packet = {
            source: deviceB,
            target: deviceB
        };

        expect(deviceA.receivePacket(packet)).toBeFalsy();
    });

    it('accepts packets addressed to it', function () {
        var packet,
            deviceA = new kg.device(),
            deviceB = new kg.device();

        packet = {
            source: deviceB,
            target: deviceA
        };

        expect(deviceA.receivePacket(packet)).toBeTruthy();
    });
});