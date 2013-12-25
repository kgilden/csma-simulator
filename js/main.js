/**
 * A simple ethernet simulator
 *
 * Author: Kristen Gilden <kristen.gilden@gmail.com>
 */

(function (document, kg, $) {

    var svgObject,
        context;

    if (!(svgObject = document.getElementById('js-simulation'))) {
        throw 'No object with id "js-simulation" found.';
    }

    kg.context = svgObject.contentDocument;

    new kg.simulator();

})(document, kg, jQuery);