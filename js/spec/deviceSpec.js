describe('kg.device', function () {

    it('should be able to be instantiated', function () {
        var device = new kg.device();

        expect(device._$element).toBeDefined();
        expect(device._tlgs).toBeDefined();
        expect(device._failedAttempts).toBeDefined();
        expect(device._receivedPacket).toBeDefined();
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

    it('sends accumulated packets after it\'s not blocked anymore', function () {
        var device = new kg.device(),
            connection = { receivePacket: function () {} };

        spyOn(connection, 'receivePacket');

        device._isCollision = true;
        device.addConnection(connection);
        device.sendTlg(device, 1);
        device.tick();

        expect(connection.receivePacket.calls.length).toEqual(0);
        expect(device._waitTime).toBeGreaterThan(0);

        device._isCollision = false;

        while (device._waitTime) {
            device.tick();
        }

        device.tick();

        expect(connection.receivePacket.calls.length).toEqual(1);
    });

    it('only accepts packets addressed to it', function () {
        var packetA = {isTo: function () { return false; }},
            packetB = {isTo: function () { return true; }},
            device = new kg.device();

        packetA.isCollision = packetB.isCollision = function () { return false; };

        expect(device.receivePacket(packetA)).toEqual(false);
        expect(device.receivePacket(packetB)).toEqual(true);
    });
});