describe('kg.cable', function () {

    it('should be able to be instantiated', function () {
        var cable = new kg.cable();

        expect(cable._$element).toBeDefined();
        expect(cable._packetRx).toBeDefined();
        expect(cable._packetTx).toBeDefined();
        expect(cable._connections).toBeDefined();
        expect(cable._settings).toBeDefined();
    });

    it('can use a jQuery object as a visual representation', function () {
        var cable = new kg.cable(),
            $baz = $('<div id="baz" />');

        // Only jQuery objects allowed.
        expect(function () { cable.setElement('foo'); }).toThrow();

        // The jQuery object must contain a single element.
        expect(function () { cable.setElement($()); }).toThrow();
        expect(function () { cable.setElement($('<div><div /><div /></div>').find('div')); }).toThrow();

        cable.setElement($baz);
        expect(cable._$element).toEqual($baz);
    });

    it('supports connecting other devices to it', function () {
        var cable = new kg.cable();

        cable.addConnection({});

        expect(cable._connections.length).toEqual(1);
    });

    it('creates a conflict packet, if it receives more than a single packet per tick', function () {
        var cable = new kg.cable(),
            packet = {isRegular: function () { return true; }, isCollision: function () { return false; }};

        cable.receivePacket(packet);
        cable.receivePacket(packet);

        expect(cable._packetRx.isCollision()).toEqual(true);
    });

    it('doesn\'t send out packets during a `preTick`', function () {
        var cable = new kg.cable(),
            connection = {},
            packet = {isRegular: function () { return true; }, isCollision: function () { return false; }, isPrevious: function () { return false; }, clone: function () { return this; }};

        connection.receivePacket = jasmine.createSpy();

        cable.addConnection(connection);
        cable.receivePacket(packet);
        cable.preTick();

        expect(connection.receivePacket).not.toHaveBeenCalled();
    });

    it('drops all packets after the conflicting packet', function () {
        var cable = new kg.cable(),
            conflict = {isCollision: function () { return true; }, isRegular: function () { return false; }},
            regular = {isCollision: function () { return false; }, isRegular: function () { return true; }};

        cable.receivePacket(conflict);
        cable.receivePacket(regular);

        expect(cable._packetRx).toEqual(conflict);
    });

    it('keeps ignoring packets on subsequent ticks after a conflict', function () {
        var cable = new kg.cable(),
            conflict = {},
            regular = {};

        conflict.isRegular = regular.isCollision = function () { return false; };
        conflict.isCollision = regular.isRegular = function () { return true; };

        cable.receivePacket(conflict);

        cable.preTick();
        cable.tick();

        cable.receivePacket(regular);

        expect(cable._packetRx).toEqual(conflict);

    });

    it('doesn\'t send a packet back to its source', function () {
        var cable = new kg.cable(),
            source = new kg.cable(),
            target = new kg.cable(),
            packet;

        packet = {
            isRegular: function () { return true; },
            isCollision: function () { return false; },
            clone: function () {},
            isPrevious: function (previous) { return previous === source; },
        };

        spyOn(source, 'receivePacket');
        spyOn(target, 'receivePacket');

        cable.addConnection(source);
        cable.addConnection(target);
        cable.receivePacket(packet);

        cable.preTick();
        cable.tick();

        expect(source.receivePacket.calls.length).toEqual(0);
        expect(target.receivePacket.calls.length).toEqual(1);
    });

    it('changes the element class based on the received packet type', function () {

        var $element = $('<div class="cbl-def" />'),
            cable = new kg.cable($element, {class_default: 'foo', class_data: 'baz'});

        cable.preTick();
        cable.tick();

        cable.receivePacket({
            isRegular: function () { return true; },
            isCollision: function () { return false; },
        });

        cable.preTick();
        cable.tick();

        expect($element.hasClass('foo')).toEqual(false);
        expect($element.hasClass('baz')).toEqual(true);
    });
});
