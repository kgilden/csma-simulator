
var kg = window.kg || {};

/**
 * Numpad deals with choosing the exponential backoff and visually indicating
 * which one is currently active.
 *
 * @param {kg}     kg
 * @param {jQuery} $
 */
(function (kg, $) {

    if (kg.numpad) {
        return;
    }

    var defaults;

    defaults = {
        class_active: 'numpad-key-active',
        class_chosen: 'numpad-key-chosen',
        class_key: 'numpad-key',
        class_selected: 'numpad-key-selected',
        maxAttemptCount: 3
    };

    /**
     * @param {jQuery} $numpad
     * @param {Array}  options
     */
    var numpad = function createNumpad($numpad, options) {
        this.setNumpad($numpad);

        this._settings = $.extend({}, defaults, options);
        this._failedAttemptCount = 0;
        this._manualSlotTime = null;

        registerListeners.call(this);
    };

    /**
     * @param {jQuery} $numpad
     */
    numpad.prototype.setNumpad = function setNumpad($numpad) {
        if (!($numpad instanceof $)) {
            throw 'Numpad must be an instance of `jQuery`.';
        }

        if ($numpad.length !== 1) {
            throw 'The `jQuery` object must be selected a single dom element, got ' + $numpad.length;
        }

        this._$numpad = $numpad;
    };

    /**
     * Calculates the next slot time. After c collisions a random number of
     * slot times between 0 and 2^c - 1 is chosen.
     *
     * For the 1st collision, the sender will wait for 0 or 1 slot times. After
     * the 2nd collision, the sender will wait anywhere from 0 to 3 slot times
     * (inclusive), and so on.
     *
     * After n failed attempts the the delay will not increase (between 0 and
     * 2^n - 1).
     *
     * @see http://en.wikipedia.org/wiki/Exponential_backoff
     *
     * @return {Number}
     */
    numpad.prototype.calculateSlotTime = function calculateSlotTime() {
        var c,
            maxSlotTime,
            slotTime;

        this._failedAttemptCount += 1;

        if (this._failedAttemptCount < this._settings.maxAttemptCount) {
            c = this._failedAttemptCount;
        } else {
            c = this._settings.maxAttemptCount;
        }

        maxSlotTime = Math.pow(2, c);

        if (this._manualSlotTime === null) {
            slotTime = Math.round(Math.random() * (maxSlotTime - 1));
        } else {
            slotTime = this._manualSlotTime;
        }

        this.markActive(maxSlotTime = Math.pow(2, c));
        this.markChosen(slotTime);

        return slotTime;
    };

    /**
     * Resets the failed attempt count.
     */
    numpad.prototype.reset = function reset() {
        this._failedAttemptCount = 0;
        this.markChosen(null);
        this.markActive(0);
    };

    /**
     * Marks the n-th key (0-based) chosen.
     *
     * @param {Number|null} n  The n-th key or null for none
     */
    numpad.prototype.markChosen = function markChosen(n) {
        var $allKeys = this.getKeys(),
            class_chosen = this._settings.class_chosen;

        removeClass($allKeys, class_chosen);

        if (null !== n) {
            addClass($allKeys.slice(n, n + 1), class_chosen);
        }
    };

    /**
     * Marks the n-th key (0-based) manually selected. The key is unselected,
     * if it's already selected.
     *
     * @param {Number|null} n  The n-th key or null for none
     */
    numpad.prototype.toggleSelected = function toggleSelected(n) {
        var $allKeys = this.getKeys(),
            $selectedKey = $allKeys.slice(n, n + 1),
            class_selected = this._settings.class_selected;

        if (hasClass($selectedKey, class_selected)) {
            removeClass($allKeys, class_selected);

            this._manualSlotTime = null;
        } else {
            removeClass($allKeys, class_selected);
            addClass($selectedKey, class_selected);

            this._manualSlotTime = n;
        }
    };

    /**
     * Marks n keys active.
     *
     * @param {Number} n The number of keys to mark active
     */
    numpad.prototype.markActive = function markActive(n) {
        var $allKeys = this.getKeys();

        // First off, mark all keys inactive.
        removeClass($allKeys, this._settings.class_active);

        // Then mark only the first n keys active.
        addClass($allKeys.slice(0, n), this._settings.class_active);
    };

    /**
     * Gets all numpad keys as a jQuery object.
     *
     * @returns {jQuery}
     */
    numpad.prototype.getKeys = function getKeys() {
        return this._$numpad.find('.' + this._settings.class_key);
    };

    /**
     * @param {jQuery} $element
     * @param {String} className
     *
     * @returns {Boolean} Whether the 1st element has the specified class
     */
    function hasClass($element, className) {
        var classList = $element[0].classList,
            i = null;

        for (i in classList) {
            if (classList[i] === className) {
                return true;
            }
        }

        return false;
    }

    /**
     * Adds a class to the elements.
     *
     * @param {jQuery} $elements
     * @param {String} className
     */
    function addClass($elements, className) {
        $elements.each(function () {
            this.classList.add(className);
        });
    }

    /**
     * Removes a class from the elements.
     *
     * @param {jQuery} $elements
     * @param {String} className
     */
    function removeClass($elements, className) {
        $elements.each(function () {
            this.classList.remove(className);
        });
    }

    /**
     * Registers all the necessary listeners. This function must be called
     * like `registerListeners.call()` so that `this` would point to the numpad.
     */
    function registerListeners() {
        var me = this;

        me.getKeys().on('click', function (e) {
            keyClickHandler.call(me, e);
        });
    }

    /**
     * Handles numpad key click events. This function must be called like
     * `keyClickHandler.call()` so that `this` would point to the numpad.
     */
    function keyClickHandler(e) {
        var $clickedKey = $(e.currentTarget);

        this.toggleSelected(this.getKeys().index($clickedKey));
    }

    kg.numpad = numpad;

})(kg, jQuery);