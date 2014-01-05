/**
 * Adds support for SVG to the following jQuery functions:
 *
 *  - addClass;
 *  - removeClass;
 *  - hasClass
 *
 * Inspired by https://github.com/JeremiePat/SVG-DOM-helpers
 */
(function ($) {
    'use strict';

    var oldMethods = {
        addClass: $.fn.addClass,
        removeClass: $.fn.removeClass,
        hasClass: $.fn.hasClass
    };

    $.fn.addClass = function addClass(value) {
        var len = this.length,
            i = 0,
            elem,
            classes,
            currentClass;

        if (typeof value === 'string' && value) {
            classes = value.match(/\S+/g) || [];

            for (; i < len; i++) {
                elem = this[i];

                if (!(elem instanceof SVGElement)) {
                    continue;
                }

                // Because the className property can be animated through SVG,
                // we have to reach the baseVal property of the className
                // SVGAnimatedString object.
                currentClass = elem.className.baseVal;

                // Note that all browsers which currently support SVG also
                // support Array.forEach().
                classes.forEach(function (newClass) {
                    var tester = new RegExp('\\b' + newClass + '\\b', 'g');

                    if (-1 === currentClass.search(tester)) {
                        currentClass += ' ' + newClass;
                    }
                });

                // Only assign if different to avoid unneeded rendering.
                if (currentClass !== elem.className.baseVal) {
                    elem.setAttribute('class', currentClass);
                }
            }
        }

        return oldMethods.addClass.apply(this, arguments);
    };

    $.fn.removeClass = function removeClass(value) {
        var len = this.length,
            i = 0,
            elem,
            classes,
            currentClass;

        if (typeof value === 'string' && value) {
            classes = value.match(/\S+/g) || [];

            for(; i < len; i++) {
                elem = this[i];

                if (!(elem instanceof SVGElement)) {
                    continue;
                }

                // Because the className property can be animated through SVG,
                // we have to reach the baseVal property of the className
                // SVGAnimatedString object.
                currentClass = elem.className.baseVal;

                // Note that all browsers which currently support SVG also
                // support Array.forEach().
                classes.forEach(function (oldClass) {
                    var tester = new RegExp('\\b' + oldClass + '\\b', 'g');

                    currentClass = currentClass.replace(tester, ' ');
                });

                // Only assign if different to avoid unneeded rendering.
                if (currentClass !== elem.className.baseVal) {
                    elem.setAttribute('class', currentClass.trim());
                }
            }
        }

        return oldMethods.removeClass.apply(this, arguments);
    };

    $.fn.hasClass = function hasClass(selector) {
        var tester = new RegExp('\\b' + selector + '\\b', 'g'),
            len = this.length,
            i = 0,
            elem,
            currentClass;

        for(; i < len; i++) {
            elem = this[i];
            if (!(elem instanceof SVGElement)) {
                continue;
            }

            currentClass = elem.className.baseVal;

            if (currentClass.search(tester) > -1) {
                return true;
            }
        }

        return oldMethods.hasClass.apply(this, arguments);
    };

})(jQuery);
