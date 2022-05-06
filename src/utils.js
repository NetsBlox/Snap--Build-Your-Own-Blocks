'use strict';
// loaded before main nb scripts
/* globals ensureFullUrl */

var utils = {};

utils.requestPromise = function(request, data) {
    // takes an xhr request
    return new Promise(function(resolve, reject) {
        // stringifying undefined => undefined
        if (data) {
            request.setRequestHeader(
                'Content-Type',
                'application/json; charset=utf-8'
            );
        }
        request.send(JSON.stringify(data));
        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status >= 200 && request.status < 300) {
                    resolve(request);
                } else {
                    var err = new Error(request.statusText || 'Unsuccessful Xhr response');
                    err.request = request;
                    reject(err);
                }
            }
        };
    });
};

utils.memoize = function(func){
    var cache = {};
    return function(){
        var key = JSON.stringify(arguments);
        if (cache[key]){
            return cache[key];
        }
        else{
            var val = func.apply(null, arguments);
            cache[key] = val;
            return val;
        }
    };
};

utils.getUrlSync = function(url, parser = x => x) {
    url = ensureFullUrl(url);
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send();
    if (request.status === 200) {
        return parser(request.responseText);
    }
    throw new Error('unable to retrieve ' + url);
};

utils.getUrlSyncCached = utils.memoize(utils.getUrlSync);

utils.defer = function() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    return deferred;
};

utils.sleep = function(time=0) {
    return new Promise(resolve => setTimeout(resolve, time));
};

utils.takeWhile = (items, fn) => {
    const newList = [];
    for (let i = 0; i < items.length; i++) {
        if (fn(items[i])) {
            newList.push(items[i]);
        } else {
            return newList;
        }
    }

    return newList;
};

utils.zip = (...lists) => {
    const len = Math.min(...lists.map(l => l.length));
    const zipped = [];
    for (let i = 0; i < len; i++) {
        zipped[i] = lists.map(l => l[i]);
    }

    return zipped;
};

utils.partition = (array, predicate) => {
    const result = [[], []];
    array.forEach(item => {
        const index = predicate(item) ? 0 : 1;
        result[index].push(item);
    });
    return result;
};

utils.pick = (obj, keys) => {
    return keys.reduce((result, k) => {
        result[k] = obj[k];
        return result;
    }, {});
};
