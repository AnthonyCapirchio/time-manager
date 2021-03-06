var Loop = function(interval, method) {

    var cycle, playing = false;


    return {
        /**
         * [start description]
         * @return {object} Instance of the current object
         */

        start: function() {

            playing = true
            self    = this;


            cycle = function() {

                method.call(self);

                if (playing) setTimeout(cycle, (interval * 1000));
            };

            cycle();

            return this;
        },


        /**
         * [stop description]
         * @return {object} Instance of the current object
         */
        stop: function() {
            playing = false;

            return this;
        }
    };
}


Timer = function(interval, method){

    var interval    = interval || 10;
    var method      = method || function(){};
    var loop        = null;
    var index       = 0;

    function getIndex(){
        return index;
    }

    function setIndex(value){
        return index = value;
    }

    function iterate(value){
        return setIndex(getIndex() +1);
    }

    return {
        start: function(){


            loop = Loop(interval, function(){

                method( iterate() );
            });

            loop.start();
        },
        index:function(value){
            return value !== undefined ? setIndex(value) : getIndex();
        },
        stop: function(){
            loop.stop();
        }
    }
}

module.exports.Timer = Timer;


var CronTab = function() {


    var regex = {
            digit: /^[0-9]+$/,
            willcard: /^\*$/,
            array: /^[0-9,]+$/,
            interval: /^\*\/[0-9]+$/
        },
        logs = {
            _logs: [],
            push: function(log) {
                _logs.push(log);
                if (listeners['error-log'] && 'function' == typeof listeners['error-log']) {
                    listeners['error-log'](log);
                }
            }
        },
        listeners = {},
        subscribers = {},
        cronProcess = function() {
            var date = new Date(),
                currentTime = date.getHours() + ':' + date.getMinutes() + ':' + (('' + date.getSeconds()).length < 2 ? '0' + date.getSeconds() : date.getSeconds());

            if (subscribers[currentTime]) {
                for (var action in subscribers[currentTime]) {
                    if ('function' == typeof subscribers[currentTime][action]) {
                        try {
                            subscribers[currentTime][action]();
                        } catch (e) {
                            logs.push({
                                time: currentTime,
                                message: e
                            });
                        }
                    }
                }
            }
        },
        clock = setInterval(cronProcess, 1000);

    function extractTimeValue(rawValue, type) {
        var tempArray = [],
            durations = {
                'hours': 24,
                'minutes': 60,
                'secondes': 60
            };

        switch (true) {

            case regex.digit.test(rawValue):
                tempArray.push(rawValue);
                break;

            case regex.willcard.test(rawValue):
                for (var i = 0; i < durations[type]; i++) {
                    tempArray.push((i < 10 ? '0' : '') + i);
                }
                break;

            case regex.interval.test(rawValue):
                var interval = rawValue.replace('*/', '');
                for (var i = 0; i < durations[type]; i++) {
                    if (0 === i % interval) {
                        tempArray.push((i < 10 ? '0' : '') + i);
                    }
                }
                break;

            case regex.array.test(rawValue):
                tempArray = JSON.parse(rawValue);
                break;
        }

        return tempArray;
    }


    return {
        subscribe: function(time, action) {

            var hours = extractTimeValue(time[0], 'hours'),
                minutes = extractTimeValue(time[1], 'minutes'),
                secondes = extractTimeValue(time[2], 'secondes');

            for (var i = 0; i < hours.length; i++) {
                for (var j = 0; j < minutes.length; j++) {
                    for (var k = 0; k < secondes.length; k++) {
                        var agregedTime = [hours[i], minutes[j], secondes[k]].join(':');

                        subscribers[agregedTime] = subscribers[agregedTime] || [];
                        subscribers[agregedTime].push(action);
                    }
                }
            }

            return this;
        },
        unsubscribe: function(time, action) {
            // @TODO
            return this;
        },
        on: function(eventName, action) {
            listeners[eventName] = listeners[eventName] || [];
            listeners[eventName].push(action);

            return this;
        },
        kill: function() {
            clearInterval(clock);
        }
    }
}


module.exports.CronTab = CronTab;