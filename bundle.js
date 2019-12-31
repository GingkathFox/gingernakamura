(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
let esiJS = require('esijs')


module.exports = {

async getJumps(orgin, desto) {
    orgin = await esiJS.universe.systems.systemInfo(orgin)
    desto = await esiJS.universe.systems.systemInfo(desto)

    orgin = orgin.id
    desto = desto.id

    let jumps = await esiJS.routes.planRoute(orgin, desto, 'shortest')

    return jumps.length
}
}
},{"esijs":54}],5:[function(require,module,exports){
let getJumps = require('./getJumps')

let b = document.getElementById('b')
        b.onclick = (e) => {
            e.preventDefault()
            getJumps("Tanoo", "Uchoshi")
            .then(r => {
                p.innerText = r
            })
        }
},{"./getJumps":4}],6:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":8}],7:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (config.withCredentials) {
      request.withCredentials = true;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../core/createError":14,"./../core/settle":18,"./../helpers/buildURL":22,"./../helpers/cookies":24,"./../helpers/isURLSameOrigin":26,"./../helpers/parseHeaders":28,"./../utils":30}],8:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":9,"./cancel/CancelToken":10,"./cancel/isCancel":11,"./core/Axios":12,"./core/mergeConfig":17,"./defaults":20,"./helpers/bind":21,"./helpers/spread":29,"./utils":30}],9:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],10:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":9}],11:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);
  config.method = config.method ? config.method.toLowerCase() : 'get';

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"../helpers/buildURL":22,"./../utils":30,"./InterceptorManager":13,"./dispatchRequest":15,"./mergeConfig":17}],13:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":30}],14:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":16}],15:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var isAbsoluteURL = require('./../helpers/isAbsoluteURL');
var combineURLs = require('./../helpers/combineURLs');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Support baseURL config
  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  }

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers || {}
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":11,"../defaults":20,"./../helpers/combineURLs":23,"./../helpers/isAbsoluteURL":25,"./../utils":30,"./transformData":19}],16:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};

},{}],17:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  utils.forEach(['url', 'method', 'params', 'data'], function valueFromConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    }
  });

  utils.forEach(['headers', 'auth', 'proxy'], function mergeDeepProperties(prop) {
    if (utils.isObject(config2[prop])) {
      config[prop] = utils.deepMerge(config1[prop], config2[prop]);
    } else if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (utils.isObject(config1[prop])) {
      config[prop] = utils.deepMerge(config1[prop]);
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });

  utils.forEach([
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength',
    'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken',
    'socketPath'
  ], function defaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });

  return config;
};

},{"../utils":30}],18:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":14}],19:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

},{"./../utils":30}],20:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  // Only Node.JS has a process variable that is of [[Class]] process
  if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  } else if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this,require('_process'))
},{"./adapters/http":7,"./adapters/xhr":7,"./helpers/normalizeHeaderName":27,"./utils":30,"_process":3}],21:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],22:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%40/gi, '@').
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":30}],23:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],24:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":30}],25:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],26:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":30}],27:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":30}],28:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":30}],29:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],30:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');
var isBuffer = require('is-buffer');

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Function equal to merge with the difference being that no reference
 * to original objects is kept.
 *
 * @see merge
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function deepMerge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val);
    } else if (typeof val === 'object') {
      result[key] = deepMerge({}, val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  deepMerge: deepMerge,
  extend: extend,
  trim: trim
};

},{"./helpers/bind":21,"is-buffer":56}],31:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * List all active player alliances.
     * @exports alliances
     * @async
     * @returns {[number]} A array of all active player alliances.
     */
    alliances () {      
        return request({ subUrl: 'alliances' })
    },
    /**
     * Get all current member corporations of an alliance.
     * @exports corps
     * @async
     * @param ID {number} The alliance ID to get the corporations from.
     * @returns {[number]} The corporations in the alliance.
     */
    corps (allianceId) {
        inputValidation({ input: allianceId, type: 'number', message: `The function 'alliance.corps' requires an alliance ID!` })

        return request({ subUrl: `alliances/${allianceId}/corporations` })
    },
    /**
     * Get the icon urls for a alliance.
     * @exports icon
     * @async
     * @param ID {number} The alliance ID to get the icon of.
     * @returns {object} Links to the different sizes of the alliance icon.
     */
    icon (allianceId) {
        inputValidation({ input: allianceId, type: 'number', message: `The function 'alliances.icon' requires an alliance ID!` })

        return request({ subUrl: `alliances/${allianceId}/icons` })
    },
    /**
     * Get public information about an alliance.
     * @exports info
     * @async
     * @param ID {number} The alliance ID to get info from.
     * @returns {object} Public info on the alliance.
     */
    info (allianceId) {
        inputValidation({ input: allianceId, type: 'number', message: `The function 'alliances.info' requires an alliance ID!` })
        
        return request({ subUrl: `alliances/${allianceId}` })
    }
}
},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],32:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Get public information about an alliance.
     * @exports info
     * @async
     * @param ID {number} The alliance ID to get info from.
     * @returns {object} Public info on the alliance.
     */
    affiliation (idArray) {
        inputValidation({ input: idArray, type: 'object', message: `The function 'character.affiliation' requires an array of ids!` })

        return request({ subUrl: 'characters/affiliation', post: true, body: idArray })
    },
    /**
     * GGet a list of all the corporations a character has been a member of.
     * @exports corpHistory
     * @async
     * @param charID {number} The character to get the history of.
     * @returns {object} The character's history.
     */
    corpHistory (characterId) {
        inputValidation({ input: characterId, type: 'number', message: `The function 'character.corpHistory' needs a character ID!` })

        return request({ subUrl: `characters/${characterId}/corporationhistory` })
    },
    /**
     * Get portrait urls for a character.
     * @exports portrait
     * @async
     * @param charID {number} The character to get the portrait of.
     * @returns {object} Links to the different sizes of the character's portrait.
     */
    portrait (characterId) {
        inputValidation({ input: characterId, type: 'number', message: `The function 'character.portrait' needs a character ID!` })

        return request({ subUrl: `characters/${characterId}/portrait` })
    },
    /**
     * Get public information about a character.
     * @exports info
     * @async
     * @param charID {number} The character to get the public info of.
     * @returns {object} Public info on a character.
     */
    info (characterId) {
        inputValidation({ input: characterId, type: 'number', message: `The function 'character.corpHistory' needs a character ID!` })

        return request({ subUrl: `characters/${characterId}` })
    }
}
},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],33:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    public: {
        /**
         * Lists bids on a public auction contract.
         * @exports bids
         * @async
         * @param contractID {number} The auction contract to get the bids of.
         * @param pageNum {number} The page of bids to get. Defaults to `1`.
         * @returns {object} The bids on the auction.
         */
        bids (contractID, pageNumber = 1) {
            inputValidation({ input: contractID, type: 'number', message: `The function 'contracts.public.bids' requires a contract ID!` })
            inputValidation({ input: pageNumber, type: 'number', message: `The input pageNumber for 'contracts.public.bids' needs to be a number` })

            return request({ subUrl: `contracts/public/bids/${contractID}`, query: { page: pageNumber } })
        },
        /**
         * Returns a paginated list of all public contracts in the given region.
         * @exports contracts
         * @async
         * @param regionID {number} The region to get the contracts from.
         * @param pageNum {number} The page of contracts to get. Defaults to `1`.
         * @returns {object} A paginated list of all public contracts in the given region.
        */
        contracts (regionID, pageNumber = 1) {
            inputValidation({ input: regionID, type: 'number', message: `The function 'contracts.public.contracts' requires a region ID!` })
            inputValidation({ input: pageNumber, type: 'number', message: `The input pageNumber for 'contracts.public.contracts' needs to be a number` })

            return request({
                subUrl: `contracts/public/${regionID}`,
                query: { page: pageNumber }
            })
        },
        /**
         * Lists items of a public contract.
         * @exports items
         * @async
         * @param contractID {number} The contract to get items from.
         * @param pageNum {number} The page of contracts to get. Defaults to `1`.
         * @returns {[number]} A array of items.
         */
        items (contractID, pageNumber = 1) {
            inputValidation({ input: contractID, type: 'number', message: `The function 'contracts.public.items' requires a contract ID!` })
            inputValidation({ input: pageNumber, type: 'number', message: `The input pageNumber for 'contracts.public.items' needs to be a number` })

            return request({
                subUrl: `contracts/public/items/${contractID}`,
                query: { page: pageNumber }
            })
        },
    }
}
},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],34:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Get a list of all the alliances a corporation has been a member of
     * @exports allianceHistory
     * @async
     * @param corpID {number} The corporation to get the alliance history of.
     * @returns {[number]} A array of alliance IDs.
     */
    allianceHistory (corporationId) {
        inputValidation({ input: corporationId, type: 'number', message: `The function 'corporation.allianceHistory' requires a corporation ID!` })

        return request({ subUrl: `corporations/${corporationId}/alliancehistory` })
    },
    /**
     * Get the icon urls for a corporation.
     * @exports icon
     * @async
     * @param corpID {number} The corporation ID to get the icon of. 
     * @returns {object} Links to the different sizes of the corporation icon.
     */
    icon (corporationId) {
        inputValidation({ input: corporationId, type: 'number', message: `The function 'corporation.icon' requires a corporation ID!` })

        return request({ subUrl: `corporations/${corporationId}/icons` })
    },
    /**
     * Get public information about a corporation.
     * @exports info
     * @async
     * @param corpID {number} The corporation ID to get info from.
     * @returns {object} Public info on the corporation.
     */
    info (corporationId) {
        inputValidation({ input: corporationId, type: 'number', message: `The function 'corporation.info' requires a corporation ID!` })
        
        return request({ subUrl: `corporations/${corporationId}` })
    },
    /**
     * Get a list of npc corporations.
     * @exports npcCorps
     * @async
     * @returns {[number]} A array of all NPC corporations.
     */
    npcCorps () {
        return request({ subUrl: `corporations/npccorps` })
    }
}
},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],35:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Get information on a dogma attribute.
     * @exports attrInfo
     * @async
     * @param attr {number}
     * @returns {object} Info on the attribute.
     */
    attrInfo (attribute) {
        inputValidation({ input: attribute, type: 'number', message: `The function 'dogma.attrInfo' requires an attribute!` })

        return request({ subUrl: `dogma/attributes/${attribute}` })
    },
    /**
     * Get a list of dogma attribute ids.
     * @exports attrs
     * @async
     * @returns {[number]} A array of all attributes.
     */
    attrs () {
        return request({ subUrl: `dogma/attributes` })
    },
    /**
     * Returns info about a dynamic item resulting from mutation with a mutaplasmid.
     * @exports dynamicItemInfo
     * @param itemID {number} 
     * @param typeID {number}
     * @async
     * @returns {object} Info on the mutation.
     */
    dynamicItemInfo (itemID, typeID) {
        inputValidation({ input: itemID, type: 'number', message: `The function 'dogma.attrs' requires an attribute!` })
        inputValidation({ input: typeID, type: 'number', message: `The function 'dogma.attrs' requires an typeID!` })

        return request({ subUrl: `dogma/dynamic/items/${typeID}/${itemID}` })
    },
    /**
     * Get information on a dogma effect.
     * @exports effectInfo
     * @param effect {number}
     * @async
     * @returns {object} Info on the effect.
     */
    effectInfo (effect) {
        inputValidation({ input: effect, type: 'number', message: `The function 'dogma.effectInfo' requires a effect ID!` })

        return request({ subUrl: `dogma/effects/${effect}` })
    },
    /**
     * Get a list of dogma effect ids.
     * @exports effects
     * @async
     * @returns {[number]} A array of dogma effects.
     */
    effects () {
        return request({ subUrl: `dogma/effects` })
    }
}
},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],36:[function(require,module,exports){
function inputValidation ({ input, type, message, options, optional = false }) {
    // throwError utility function
    const throwError = () => {
        console.error(message)
        throw new Error(message)
    }

    // If is optional and input is undefined, no need to validate
    if (optional && input === undefined) return

    // Do not check for !input or you are making that you won't accepet falsy values such as empty '' or id = 0
    if (input === undefined) throwError()
    if (typeof input !== type) throwError()
    // If options is provided, check that input is included
    if (options && !options.includes(input)) throwError()
}

module.exports = inputValidation

},{}],37:[function(require,module,exports){
const axios = require('axios')
const { link, dataSource } = require('../../esi.json')

/**
 *  subUrl -> remaining url part specific to the function call
 * 
 *  post -> state if the request is of type post, will make a get request otherwise
 * 
 *  body -> data to pass to the request body for requests of type post
 * 
 *  query -> aditional query parameters
 */
function makeRequest ({ subUrl, post = false, body, query}) {
    let request
    let fullURL = `${link}${subUrl}/?datasource=${dataSource}`
    
    // If query params are defined, add them to the end of the full url
    if (query) {
        // Cicle each query entry and add to the full url in the form '&key=value'
        // Because all request already have '?datasource' no need to manage the ? on the first query param
        Object.keys(query).forEach(queryKey => {
            // query params undefined or empty, or array of length 0
            if (query[queryKey] === undefined || query[queryKey] === '') {
                return
            }
            if (query[queryKey].length && query[queryKey].length === 0) {
                return
            }
            fullURL += `&${queryKey}=${query[queryKey]}`
        })
    }

    // If post, make it a post request, make it a get otherwise
    if (post) {
        request = axios.post(fullURL, body) 
    } else {
        request = axios.get(fullURL) 
    }

    // Return the promise request, pre set the 'then' and 'catch' clauses
    return request
        .then(response => {
            // Dont forget to uncomment for 4.0.0
           /*let data = {
               
                headers: response.headers,
                data: response.data
            }*/
            console.log(`WARNING:\n\nIn the next major version of esiJS (4.0.0), all functions will return both the headers and the actual data. Please see README.md for more info.\n\n`)
            return response.data
        }).catch((error) => {
            const esiError = error.response.data.error
            console.error(`Call to '${subUrl}' failed with ESI error:`, esiError)
            throw Error(esiError)
        })
}

module.exports = makeRequest
},{"../../esi.json":55,"axios":6}],38:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    leaderboards: {
        /**
         * Top 100 leaderboard of pilots for kills and victory points separated by total, last week and yesterday
         * @async
         * @returns {object} Character leaderboard of kills and victory points within faction warfare.
         */
        characters () {
            return request({ subUrl: `fw/leaderboards/characters` })
        },
        /**
         * 
         * @async
         * @returns {object} Corporation leaderboard of kills and victory points within faction warfare.
         */
        corps () {
            return request({ subUrl: `fw/leaderboards/corporations` })
        },
        /**
         * Top 4 leaderboard of factions for kills and victory points separated by total, last week and yesterday.
         * @async
         * @returns {object} All-time leaderboard of kills and victory points within faction warfare.
         */
        leaderboard () {
            return request({ subUrl: `fw/leaderboards` })
        }
    },
    /**
     * Statistical overviews of factions involved in faction warfare
     * @async
     * @returns {object} Per faction breakdown of faction warfare statistics.
     */
    stats () {
        return request({ subUrl: `fw/stats` })
    },
    /**
     * An overview of the current ownership of faction warfare solar systems.
     * @async
     * @returns {object}
     */
    systems () {
        return request({ subUrl: `fw/systems` })
    },
    /**
     * Data about which NPC factions are at war.
     * @async
     * @returns {object}
     */
    wars () {
        return request({ subUrl: `fw/wars` })
    }
}

},{"./esiJS-Utils/request":37}],39:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    /**
     * Return a list of current incursions.
     * @async
     * @returns {object}
     */
    incursions () {
        return request({ subUrl: `incursions` })
    }
}

},{"./esiJS-Utils/request":37}],40:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    /**
     * Return a list of industry facilities.
     * @async
     * @returns {object}
     */
    facilities () {
        return request({ subUrl: `industry/facilities` })
    },
    /**
     * Return cost indices for solar systems.
     * @async
     * @returns {object}
     */
    systems () {
        return request({ subUrl: `industry/systems` })
    }
}
},{"./esiJS-Utils/request":37}],41:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    /**
     * Return available insurance levels for all ship types.
     * @async
     * @returns {object}
     */
    prices () {
        return request({ subUrl: `insurance/prices` })
    }
}

},{"./esiJS-Utils/request":37}],42:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Return a single killmail from its ID and hash.
     * @async
     * @param {number} killID 
     * @param {string} killHash 
     * @returns {object}
     */
    killmailInfo (killID, killHash) {
        inputValidation({ input: killID, type: 'number', message: `The function 'killMail.killMailInfo' requires a kill ID!` })
        inputValidation({ input: killHash, type: 'string', message: `The function 'killMail.killMailInfo' requires a kill hash!` })

        return request({ subUrl: `killmails/${killID}/${killHash}` })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],43:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Return a list of offers from a specific corporation’s loyalty store.
     * @async
     * @param {number} corporationId 
     * @returns {object}
     */
    offers (corporationId) {
        inputValidation({ input: corporationId, type: 'number', message: `The function 'loyalty.offers' requires a corporation ID!` })

        return request({ subUrl: `loyalty/stores/${corporationId}/offers` })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],44:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    groups: {
        /**
         * Get information on an item group.
         * @async
         * @param {number} groupID 
         * @returns {object}
         */
        groupInfo (groupID) {
            inputValidation({ input: groupID, type: 'number', message: `The function 'market.groups.groupInfo' requires a group ID!` })

            return request({ subUrl: `markets/groups/${groupID}` })
        },
        /**
         * Get a list of item groups.
         * @async
         * @returns {[number]}
         */
        groups () {
            return request({ subUrl: `markets/groups` })
        },
    },
    /**
     * Return a list of historical market statistics for the specified type in a region.
     * @async
     * @param {number} regionID 
     * @param {number} typeID 
     * @returns {object}
     */
    history (regionID, typeID) {
        inputValidation({ input: regionID, type: 'number', message: `The function 'market.history' requires a region ID!` })
        inputValidation({ input: typeID, type: 'number', message: `The function 'market.history' requires a type ID!` })

        return request({ subUrl: `markets/${regionID}/history`, query: { type_id: typeID } })
    },
    /**
     * Return a list of orders in a region.
     * @async
     * @param {number} regionID
     * @param {number} typeID 
     * @param {string} bOs 
     * @param {number} pageNumber
     */
    orders (regionID, typeID, bOs = 'all', pageNumber = 1) {
        bOsOptions = ['all', 'sell', 'buy']
        inputValidation({ input: regionID, type: 'number', message: `The function 'market.orders' requires a region ID!` })
        inputValidation({ input: pageNumber, type: 'number', message: `The input pageNumber for 'market.orders' requires a number!` })
        inputValidation({ input: bOs, type: 'string', options: bOsOptions , message: `The function 'market.orders' bOs input must be 'all', 'sell', or 'buy'!` })
        inputValidation({ input: typeID, type: 'number', optional: true, message: `The function 'market.orders' requires a type ID!`})

        return request({
            subUrl: `markets/${regionID}/orders`,
            query: {
                order_type: bOs,
                page: pageNumber,
                type_id: typeID
            }
        })
    },
    /**
     * Return a list of prices.
     * @async
     * @returns {object}
     */
    prices () {
        return request({ subUrl: `markets/prices` })
    },
    /**
     * Return a list of type IDs that have active orders in the region, for efficient market indexing.
     * @async
     * @param {number} regionID 
     * @param {number} pageNumber 
     * @returns {object}
     */
    types (regionID, pageNumber = 1) {
        inputValidation({ input: regionID, type: 'number', message: `The function 'market.types' requires a region ID!` })
        inputValidation({ input: pageNumber, type: 'number', message: `The input pageNumber for 'market.types' needs to be a number` })
        
        return request({ subUrl: `markets/${regionID}/types` })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],45:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Return information of an opportunities group.
     * @async
     * @param {number} groupID 
     * @returns {object}
     */
    groupInfo (groupID) {
        inputValidation({ input: groupID, type: 'number', message: `The function 'opportunities.groupInfo' requires a group ID!` })

        return request({ subUrl: `opportunity/groups/${groupID}` })
    },
    /**
     * Return a list of opportunities groups.
     * @async
     * @returns {object}
     */
    groups () {
        return request({ subUrl: `opportunities/groups` })
    },
    /**
     * Return information of an opportunities task.
     * @async
     * @param {number} groupID 
     * @returns {object}
     */
    taskInfo (taskID) {
        inputValidation({ input: taskID, type: 'number', message: `The function 'opportunities.taskInfo' requires a task ID!` })

        return request({ subUrl: `opportunity/tasks/${groupID}` })
    },
    /**
     * Return a list of opportunities tasks.
     * @async
     * @returns {object}
     */
    tasks () {
        return request({ subUrl: `opportunities/tasks` })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],46:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Get information on a planetary factory schematic.
     * @async
     * @param {number} schematicID
     * @returns {object}
     */
    schematicInfo (schematicID) {
        inputValidation({ input: schematicID, type: 'number', message: `The function 'planetaryInteraction.schematicInfo' requires a schematic ID!` })

        return request({ subUrl: `universe/schematics/${schematicID}` })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],47:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Get the systems between the origin and the destination.
     * @async
     * @param {number} origin 
     * @param {number} destination 
     * @param {string} flag 
     * @param {[number]} avoid 
     * @returns {[number]}
     */
    planRoute (origin, destination, flag = 'secure', avoid = []) {
        const flagOptions = ['shortest', 'secure', 'insecure']
        inputValidation({ input: origin, type: 'number', message: `The function 'routes.planRoute' requires a origin!` })
        inputValidation({ input: destination, type: 'number', message: `The function 'routes.planRoute' requires a destination!` })
        inputValidation({ input: flag, type: 'string', options: flagOptions, message: `The input flag for 'routes.planRoute' must be 'shortest', 'secure' or 'insecure'!` })

        return request({
            subUrl: `route/${origin}/${destination}`,
            query: { avoid, flag }
        })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],48:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Search for entities that match a given sub-string.
     * @async
     * @param {string} search 
     * @param {string} category 
     * @param {boolean} strict 
     * @returns {object}
     */
    search (search, category, strict = false) {
        let categories = [
            'agent',
            'alliance',
            'character',
            'constellation',
            'corporation',
            'faction',
            'inventory_type',
            'region',
            'solar_system',
            'station'
        ]
        
        inputValidation({ input: search, type: 'string', message: `The function 'search.search' requires a search input!` })
        inputValidation({
            input: category,
            type: 'string',
            options: categories,
            message: `The function input category of 'search.search' must be one of the following: ${categories.join(', ')}!`
        })
        inputValidation({ input: strict, type: 'boolean', message: `The function input strict of 'search.search' must be false or true!` })

        return request({
            subUrl: `search`,
            query: {
                categories: category,
                search,
                strict
            }
        })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],49:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    /**
     * Shows sovereignty data for campaigns.
     * @async
     * @returns {object}
     */
    campaigns () {
        return request({ subUrl: `sovereignty/campaigns` })
    },
    /**
     * Shows sovereignty information for solar systems.
     * @async
     * @returns {object}
     */
    map () {
        return request({ subUrl: `sovereignty/map` })
    },
    /**
     * Shows sovereignty data for structures.
     * @async
     * @returns {object}
     */
    structures () {
        return request({ subUrl: `sovereignty/structures` })
    }
}

},{"./esiJS-Utils/request":37}],50:[function(require,module,exports){
const request = require('./esiJS-Utils/request')

module.exports = {
    /**
     * EVE Server status.
     * @async
     * @returns {object}
     */
    status () {
        return request({ subUrl: `status` })
    }
}

},{"./esiJS-Utils/request":37}],51:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    ancestries: {
        /**
         * Get all character ancestries.
         * @async
         * @returns {array}
         */
        ancestries () {
            return request({ subUrl: `universe/ancestries` })
        }
    },
    belts: {
        /**
         * Get information on an asteroid belt.
         * @async
         * @param {number} beltId 
         * @returns {object}
         */
        beltInfo (beltId) {
            inputValidation({ input: beltId, type: 'number', message: `The function 'universe.belts.beltInfo requires a belt ID!` })

            return request({ subUrl: `universe/asteroid_belts/${beltID}` })
        }
    },
    bloodlines: {
        /**
         * Get a list of bloodlines.
         * @async
         * @returns {object}
         */
        bloodlines () {
            return request({ subUrl: `universe/bloodlines` })
        },
    },
    bulk: {
        /**
         * Resolve a set of IDs to names and categories. 
         * Supported ID’s for resolving are: 
         * Characters, Corporations, Alliances, Stations, Solar Systems, Constellations, Regions, Types, Factions
         * @async
         * @param {[number]} IDs 
         * @returns {array}
         */
        idsToNames (IDs) {
            inputValidation({ input: IDs, type: 'object', message: `The function 'universe.bulk.idsToNames requires IDs to be an array!` })

            return request({ subUrl: `universe/names`, post: true, body: IDs })
        },
        /**
         * Resolve a set of names to IDs in the following categories: 
         * agents, alliances, characters, constellations, corporations factions, inventory_types, regions, stations, and systems. 
         * Only exact matches will be returned. All names searched for are cached for 12 hours.
         * @async
         * @param {[string]} names 
         * @returns {array}
         */
        namesToIds (names) {
            inputValidation({ input: names, type: 'object', message: `The function 'universe.bulk.namesToIds requires names to be an array!` })

            return request({ subUrl: `universe/ids`, post: true, body: names })
        }
    },
    categories: {
        /**
         * Get a list of item categories.
         * @async
         * @returns {[number]}
         */
        categories () {
            return request({ subUrl: `universe/categories` })
        },
        /**
         * Get information on an item category.
         * @async
         * @param {number} categoryID 
         * @returns {object}
         */
        categoryInfo (categoryID) {
            inputValidation({ input: categoryID, type: 'number', message: `The function 'universe.categories.categoryInfo requires a category ID!` })
            
            return request({ subUrl: `universe/categories/${categoryID}` })
        }
    },
    constellations: {
        /**
         * Get information on a constellation.
         * @async
         * @async
         * @param {number} constellationID 
         * @returns {object}
         */
        constellationInfo (constellationID) {
            inputValidation({ input: constellationID, type: 'number', message: `The function 'universe.constellations.constellationInfo requires a constellation ID!` })
            
            return request({ subUrl: `universe/constellations/${constellationID}` })
        },
        /**
         * Get a list of constellations.
         * @async
         * @returns {[number]}
         */
        constellations () {
            return request({ subUrl: `universe/constellations` })
        }
    },
    factions: {
        /**
         * Get a list of factions.
         * @async
         * @returns {object}
         */
        factions () {
            return request({ subUrl: `universe/factions` })
        }
    },
    graphics: {
        /**
         * Get information on a graphic.
         * @async
         * @param {number} graphicID 
         * @returns {object}
         */
        graphicInfo (graphicID) {
            inputValidation({ input: graphicID, type: 'number', message: `The function 'universe.graphics.graphicInfo requires a graphic ID!` })
            
            return request({ subUrl: `universe/graphics/${graphicID}` })
        },
        /**
         * Get a list of graphics.
         * @async
         * @returns {[number]}
         */
        graphics () {
            return request({ subUrl: `universe/graphics` })
        }
    },
    groups: {
        /**
         * Get information on an item group.
         * @async
         * @param {number} groupID
         * @returns {object} 
         */
        groupInfo (groupID) {
            inputValidation({ input: groupID, type: 'number', message: `The function 'universe.graphics.graphicInfo requires a group ID!` })
            
            return request({ subUrl: `universe/groups/${groupID}` })
        },
        /**
         * Get a list of item groups.
         * @async
         * @returns {[number]}
         */
        groups () {
            return request({ subUrl: `universe/groups` })
        }
    },
    moons: {
        /**
         * Get information on a moon.
         * @async
         * @async
         * @param {number} moonID 
         * @returns {object}
         */
        moonsInfo (moonID) {
            inputValidation({ input: moonID, type: 'number', message: `The function 'universe.moons.moonsInfo requires a moon ID!` })
            
            return request({ subUrl: `universe/moons/${moonID}` })
        }
    },
    planets: {
        /**
         * Get information on a planet.
         * @async
         * @param {number} planetID 
         * @returns {object}
         */
        planetInfo (planetID) {
            inputValidation({ input: planetID, type: 'number', message: `The function 'universe.planets.planetInfo requires a planet ID!` })
            
            return request({ subUrl: `universe/planets/${planetID}` })
        }
    },
    races: {
        /**
         * Get a list of character races.
         * @async
         * @returns {object}
         */
        races () {
            return request({ subUrl: `universe/races` })
        }
    },
    regions: {
        /**
         * Get information on a region.
         * @async
         * @async
         * @param {number} regionID 
         * @returns {objectt}
         */
        regionInfo (regionID) {
            inputValidation({ input: regionID, type: 'number', message: `The function 'universe.regions.regionInfo requires a region ID!` })
            
            return request({ subUrl: `universe/regions/${regionID}` })
        },
        /**
         * Get a list of regions.
         * @async
         * @returns {[number]}
         */
        regions () {
            return request({ subUrl: `universe/regions` })
        }
    },
    stargates: {
        /**
         * Get information on a stargate.
         * @async
         * @param {number} stargateID 
         * @returns {object}
         */
        stargateInfo (stargateID) {
            inputValidation({ input: stargateID, type: 'number', message: `The function 'universe.stargates.stargateInfo requires a stargate ID!` })
            
            return request({ subUrl: `universe/stargates/${stargateID}` })
        }
    },
    stars: {
        /**
         * Get information on a star.
         * @async
         * @param {number} starID 
         * @returns {object}
         */
        starInfo (starID) {
            inputValidation({ input: starID, type: 'number', message: `The function 'universe.stars.starInfo requires a star ID!` })
             
            return request({ subUrl: `universe/stars/${starID}` })
        }
    },
    stations: {
        /**
         * Get information on a station.
         * @async
         * @async
         * @param {number} stationID 
         * @returns {object}
         */
        stationInfo (stationID) {
            inputValidation({ input: stationID, type: 'number', message: `The function 'universe.stations.stationInfo requires a station ID!` })
             
            return request({ subUrl: `universe/stations/${stationID}` })
        }
    },
    structures: {
        /**
         * List all public structures.
         * @async
         * @returns {[number]}
         */
        structures () {
            return request({ subUrl: `universe/structures` })
        }
    },
    systems: {
        /**
         * Get information on a solar system.
         * @async
         * @param {number} systemID 
         * @returns {object}
         */
        systemInfo (systemID) {
            inputValidation({ input: systemID, type: 'number', message: `The function 'universe.systems.systemInfo' requires a system ID!` })
             
            return request({ subUrl: `universe/systems/${systemID}` })
        },
        /**
         * Get the number of jumps in solar systems within the last hour ending at the timestamp of the Last-Modified header, 
         * excluding wormhole space. Only systems with jumps will be listed.
         * @async
         * @returns {object}
         */
        systemJumps () {
            return request({ subUrl: `universe/system_jumps` })
        },
        /**
         * Get the number of ship, pod and NPC kills per solar system within the last hour ending at the timestamp of the Last-Modified header, 
         * excluding wormhole space. Only systems with kills will be listed.
         * @async
         * @returns {object}
         */
        systemKills () {
            return request({ subUrl: `universe/system_kills` })
        },
        /**
         * Get a list of solar systems.
         * @async
         * @returns {[number]}
         */
        systems () {
            return request({ subUrl: `universe/systems` })
        }
    },
    types: {
        /**
         * Get information on a type.
         * @async
         * @param {number} typeID 
         * @returns {object}
         */
        typeInfo (typeID) {
            inputValidation({ input: typeID, type: 'number', message: `The function 'universe.types.typeInfo requires a type ID!` })
            
            return request({ subUrl: `universe/types/${typeID}` })
        },
        /**
         * Get a list of type ids.
         * @async
         * @returns {[number]}
         */
        types () {
            return request({ subUrl: `universe/types` })
        }
    },
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],52:[function(require,module,exports){
(function (__dirname){
module.exports = {
    /**
     * Gets the settings for esiJS.
     * @returns {object} A JSON object with the settings.
     */
    getSettings() {
        let path = require('path')
        let join = path.join(__dirname, `../esi.json`)
        const fs = require('fs')
        let settings = fs.readFileSync(join,'Utf8')
        return JSON.parse(settings)
    },
    /**
     * Sets the settings for esiJS.
     * @param {string} link 
     * @param {string} dataSource 
     * @returns true
     */
    setSettings(link = 'latest', dataSource = 'tranquility') {
        const fs = require('fs')
        let path = require('path')
        let join = path.join(__dirname, '../../esi.json')
        let server = 'https://esi.evetech.net/'
        let paths = 'latest v1 legacy dev'.split(' ')
        let DS = 'tranquility singularity'.split(' ')
    
        if (!link || !paths.includes(link) || !dataSource || !DS.includes(dataSource)) {
            throw Error(`setSettings needs first arg to be one of these: ${paths}, and second arg to be one of these: ${DS}`)
        }
    
        link = `${server}${link}/`
        fs.writeFileSync(join, JSON.stringify( { link, dataSource }, null, 2) )
        return true
    },
    /**
     * Pause execution of code for a specified amount of time.
     * @exports sleep
     * @async
     * @param millis {number} The time to delay (in milliseconds)
     */
    async sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis))
    }
}
}).call(this,"/node_modules/esijs/Functions")
},{"fs":1,"path":2}],53:[function(require,module,exports){
const request = require('./esiJS-Utils/request')
const inputValidation = require('./esiJS-Utils/inputValidation')

module.exports = {
    /**
     * Return details about a war.
     * @param {number} warID
     * @returns {object}
     */
    warInfo (warID) {
        inputValidation({ input: warID, type: 'number', message: `The function 'wars.warInfo' requires a war ID!` })
         
        return request({ subUrl: `wars/${warID}` })
    },
    /**
     * Return a list of kills related to a war.
     * @param {number} warID
     * @returns {object}
     */
    warKills (warID) {
        inputValidation({ input: warID, type: 'number', message: `The function 'wars.warkills' requires a war ID!` })
         
        return request({ subUrl: `wars/${warID}/killmails` })
    },
    /**
     * Return a list of wars.
     * @param {number} maxWarID Optional. Only return wars with ID smaller than this.
     * @returns {[number]}
     */
    wars (maxWarID = ' ') { // this should work
        return request({ 
            subUrl: `wars`, 
            query: {
                max_war_id: maxWarID 
            } 
        })
    }
}

},{"./esiJS-Utils/inputValidation":36,"./esiJS-Utils/request":37}],54:[function(require,module,exports){
module.exports = {
    util: require('./Functions/utility'),
    alliance: require('./Functions/alliances'),
    character: require('./Functions/character'),
    contracts: require('./Functions/contracts'),
    corporation: require('./Functions/corporation'),
    dogma: require('./Functions/dogma'),
    fw: require('./Functions/factionWarfare'),
    incursions: require('./Functions/incursions'),
    industry: require('./Functions/industry'),
    insurance: require('./Functions/insurance'),
    killmails: require('./Functions/killmails'),
    loyalty: require('./Functions/loyalty'),
    market: require('./Functions/market'),
    opportunities: require('./Functions/opportunities'),
    pi: require('./Functions/planetaryInteraction'),
    routes: require('./Functions/routes'),
    search: require('./Functions/search'),
    sov: require('./Functions/sovereignty'),
    status: require('./Functions/status'),
    universe: require('./Functions/universe'),
    wars: require('./Functions/wars')
}

},{"./Functions/alliances":31,"./Functions/character":32,"./Functions/contracts":33,"./Functions/corporation":34,"./Functions/dogma":35,"./Functions/factionWarfare":38,"./Functions/incursions":39,"./Functions/industry":40,"./Functions/insurance":41,"./Functions/killmails":42,"./Functions/loyalty":43,"./Functions/market":44,"./Functions/opportunities":45,"./Functions/planetaryInteraction":46,"./Functions/routes":47,"./Functions/search":48,"./Functions/sovereignty":49,"./Functions/status":50,"./Functions/universe":51,"./Functions/utility":52,"./Functions/wars":53}],55:[function(require,module,exports){
module.exports={
  "link": "https://esi.evetech.net/latest/",
  "dataSource": "tranquility"
}
},{}],56:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

module.exports = function isBuffer (obj) {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

},{}]},{},[5]);
