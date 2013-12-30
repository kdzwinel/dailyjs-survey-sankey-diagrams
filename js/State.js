(function () {
    function State() {
        var currentState = {};

        var listeners = {
            'change': []
        };

        this.change = function (newValues) {
            var change = {
                year: false,
                questions: false,
                minLinkValue: false,
                splitMultipleAnswers: false
            };

            if (isNumber(newValues.year) && newValues.year !== currentState.year) {
                change.year = true;
                currentState.year = newValues.year;
            }

            if (isNumber(newValues.question1)&& isNumber(newValues.question2)) {
                currentState.question1 = newValues.question1;
                currentState.question2 = newValues.question2;

                change.questions = true;
            }

            if (isNumber(newValues.minLinkValue) && currentState.minLinkValue !== newValues.minLinkValue) {
                currentState.minLinkValue = newValues.minLinkValue;

                change.minLinkValue = true;
            }

            if((newValues.splitMultipleAnswers === true || newValues.splitMultipleAnswers === false) && currentState.splitMultipleAnswers !== newValues.splitMultipleAnswers) {
                currentState.splitMultipleAnswers = newValues.splitMultipleAnswers;

                change.splitMultipleAnswers = true;
            }

            if (change.year || change.questions || change.minLinkValue || change.splitMultipleAnswers) {
                trigger('change', change);
            }
        };

        this.get = function (value) {
            return (value !== undefined) ? currentState[value] : currentState;
        };

        this.on = function (event, callback) {
            if (!listeners[event]) {
                throw "Unknown event " + event;
            }

            listeners[event].push(callback);

            return this;
        };

        function trigger(event, data) {
            listeners[event].forEach(function (callback) {
                callback(data, currentState);
            });
        }

        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
    }

    window.State = State;
})();