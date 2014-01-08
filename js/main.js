/**
 * A simple ethernet simulator
 *
 * Author: Kristen Gilden <kristen.gilden@gmail.com>
 */

(function (document, kg, $) {

    var svgObject;

    if (!(svgObject = document.getElementById('js-simulation'))) {
        throw 'No object with id "js-simulation" found.';
    }

    // Remotely opening the document requires using an event listener to
    // detect, when the SVG is loaded. Turns out this doesn't work when
    // opening locally.
    if (document.location.hostname) {
        // Source: http://stackoverflow.com/questions/2753732
        svgObject.addEventListener('load', startSimulation, false);
    } else {
        startSimulation();
    }

    function startSimulation() {
        kg.context = svgObject.contentDocument;

        new kg.simulator();
    }

})(document, kg, jQuery);