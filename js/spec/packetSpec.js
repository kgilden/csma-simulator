describe('kg.packet', function () {

    it('should be possible to be instantiated', function () {
        var packet = new kg.packet();

        expect(packet._from).toBeDefined();
        expect(packet._to).toBeDefined();
        expect(packet._previous).toBeDefined();
    });

    it('has a method for creating conflicting packets', function () {
        var packet = kg.packet.conflict();

        expect(packet.isConflict()).toEqual(true);
        expect(packet.isRegular()).toEqual(false);
    });

    it('can tell if it originated from a specific source', function () {

        var source = {},
            packet = new kg.packet(source);

        expect(packet.isFrom(source)).toEqual(true);
        expect(packet.isFrom({})).toEqual(false);
    });

    it('can tell if it was previously in a specific object', function () {

        var previous = {},
            packet = new kg.packet(null, null, previous);

        expect(packet.isPrevious(previous)).toEqual(true);
        expect(packet.isPrevious({})).toEqual(false);

    });

});
