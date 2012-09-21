Evme.Utils = new function() {
    var _this = this, userAgent = "", connection, cssPrefix = "", iconsFormat = null,
        isKeyboardVisible = false, _title = "Everything", isNewUser,
        _parseQuery = parseQuery();

    this.ICONS_FORMATS = {
        "Small": 10,
        "Large": 20
    };
    var CONTAINER_ID = "doat-container",
        COOKIE_NAME_CREDENTIALS = "credentials",
        DYNAMIC_TITLE = false;

    this.FFOSMessages = {
        "APP_CLICK": "open-in-app",
        "APP_INSTALL": "add-bookmark",
        "SWIPE_LEFT_TO_RIGHT": false,
        "SWIPE_RIGHT_TO_LEFT": "home"
    };

    this.log = function(message) {
        console.log("(" + (new Date().getTime()) + ") DOAT: " + message);
    };
    this.isLauncher = function() {
        return (window.location.href.indexOf("mode=launcher") !== -1);
    };
    this.isB2G = function() {
        return navigator.mozApps && ("getSelf" in navigator.mozApps);
    };
    this.getB2GHeight = function() {
        return Math.max(400, _this.B2GCalc(window.innerHeight));
    };
    this.getB2GWidth = function() {
        return _this.B2GCalc(window.innerWidth);
    };
    this.B2GCalc = function(x) {
        return window.innerWidth > 320 ?  x*2/3 : x;
    };
    this.sendToFFOS = function(type, data) {
        switch (type) {
            case Evme.Evme.Utils.FFOSMessages.APP_CLICK:
                EvmeManager.openApp(data);
                break;
            case Evme.Evme.Utils.FFOSMessages.APP_INSTALL:
                EvmeManager.addBookmark(data);
                break;
        }
    };

    this.getID = function() {
        return CONTAINER_ID;
    };

    this.getRoundIcon = function(imageSrc, size, shadowOffset, callback) {
        // canvas
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            radius = size/2;

        canvas.setAttribute("width", size);
        canvas.setAttribute("height", size);

        !shadowOffset && (shadowOffset = 0);

        // create clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI, false);
        ctx.clip();

        // generate image
        var img = new Image()
        img.onload = function() {
            ctx.drawImage(img,0,0, size, size);

            // send to get shadow
            var data = canvas.toDataURL();
            getShadow(data, size, shadowOffset, callback)
        };
        img.src = imageSrc;
    };

    var getShadow = function(imageSrc, size, shadowOffset, callback) {
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");

        canvas.setAttribute("width", size+shadowOffset);
        canvas.setAttribute("height", size+shadowOffset);

        ctx.shadowColor="rgba(0,0,0,0.3)";
        ctx.shadowOffsetY = shadowOffset;

        // generate image
        var img = new Image()
        img.onload = function() {
            ctx.drawImage(img,0,0, size, size);
            var data = canvas.toDataURL();
            callback(data);
        };
        img.src = imageSrc;
    }

    this.init = function() {
        userAgent = navigator.userAgent;
        cssPrefix = _getCSSPrefix();
        connection = Connection.get();
        isTouch = "ontouchstart" in window;
    };

    this.isNewUser = function() {
        if (isNewUser === undefined) {
            isNewUser = !Evme.Storage.get("counter-ALLTIME");
        }
        return isNewUser;
    };

    this.updateObject = function(configData, groupConfig) {
        if (!groupConfig) return;

        for (var key in groupConfig) {
            eval('configData["' + key.replace(/=>/g, '"]["') + '"] = groupConfig[key]');
        }

        return configData;
    };

    this.formatImageData = function(image) {
        if (!image || typeof image !== "object") {
            return image;
        }
        if (!image.MIMEType || image.data.length < 10) {
            return null;
        }

        return "data:" + image.MIMEType + ";base64," + image.data;
    };

    this.getIconGroup = function() {
        return JSON.parse(JSON.stringify(Evme.__config.iconsGroupSettings));
    }

    this.getIconsFormat = function() {
        return iconsFormat || _getIconsFormat();
    };

    this.isKeyboardVisible = function(){
        return isKeyboardVisible;
    };

    this.setKeyboardVisibility = function(value){
        isKeyboardVisible = value;
        if (isKeyboardVisible) {
            $("#doat-container").addClass("keyboard-visible");
        } else {
            $("#doat-container").removeClass("keyboard-visible");
        }
    };

    this.connection = function(){
        return connection;
    };

    this.isOnline = function(callback) {
        Connection.online(callback);
    };

    this.getUrlParam = function(key) {
        return _parseQuery[key]
    };

    this.cssPrefix = function() {
        return cssPrefix;
    };

    this.convertIconsToAPIFormat = function(icons) {
        var aIcons = [];
        if (icons instanceof Array) {
            for (var i=0; i<icons.length; i++) {
                aIcons.push(f(icons[i]));
            }
        } else {
            for (var i in icons) {
                aIcons.push(f(icons[i]));
            }
        }
        aIcons = aIcons.join(",");
        return aIcons;

        function f(icon) {
            return (icon && icon.id && icon.revision && icon.format)? icon.id + ":" + icon.revision + ":" + icon.format : "";
        }
    }

    this.hasFixedPositioning = function(){
        return false;
    };

    this.isVersionOrHigher = function(v1, v2) {
        if (!v2){ v2 = v1; v1 = Evme.Evme.Utils.getOS().version; };
        if (!v1){ return undefined; }

        var v1parts = v1.split('.');
        var v2parts = v2.split('.');

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return true;
            }

            if (v1parts[i] == v2parts[i]) {
                continue;
            } else if (parseInt(v1parts[i], 10) > parseInt(v2parts[i], 10)) {
                return true;
            } else {
                return false;
            }
        }

        if (v1parts.length != v2parts.length) {
            return false;
        }

        return true;
    };

    this.User = new function() {
        this.creds = function() {
            var credsFromCookie = Evme.Evme.Utils.Cookies.get(COOKIE_NAME_CREDENTIALS);
            return credsFromCookie;
        };
    };

    this.Cookies = new function() {
        this.set = function(name, value, expMinutes, _domain) {
            var expiration = "",
                path = norm("path","/"),
                domain = norm("domain", _domain);

            if (expMinutes) {
                expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + expMinutes);
                expiration = expiration.toGMTString();
            }
            expiration = norm("expires", expiration);

            var s = name + "=" + escape(value) + expiration + path + domain;

            try {
                document.cookie = s;
            } catch(ex) {}

            return s;
        };

        this.get = function(name) {
            var results = null;

            try {
                results = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
            } catch(ex) {}

            return (results)? unescape(results[2]) : null;
        };

        this.remove = function(name) {
            Evme.Evme.Utils.Cookies.set(name, "", "Thu, 24-Jun-1999 12:34:56 GMT");
        };

        function norm(k, v) {
            return k && v ? "; "+k+"="+v : "";
        }
    };

    // check that cookies are enabled by setting and getting a temp cookie
    this.bCookiesEnabled = function(){
        var key = "cookiesEnabled",
            value = "true";

        // set
        _this.Cookies.set(key, value, 10);

        // get and check
        if (_this.Cookies.get(key) === value){
            _this.Cookies.remove(key);
            return true;
        }
    };

    // check that localStorage is enabled by setting and getting a temp value
    this.bLocalStorageEnabled = function(){
        return Evme.Storage.enabled();
    };

    function _getIconsFormat() {
        return _this.ICONS_FORMATS.Large;
    }

    function _getCSSPrefix() {
        return (/webkit/i).test(navigator.appVersion) ? '-webkit-' :
                (/firefox/i).test(navigator.userAgent) ? '-moz-' :
                (/msie/i).test(navigator.userAgent) ? '-ms-' :
                'opera' in window ? '-o-' : '';
    }

    this.getCurrentSearchQuery = function(){
        return Evme.Brain.Searcher.getDisplayedQuery();
    };

    this.CONNECTION = {
        "EVENT_ONLINE": "ononline",
        "EVENT_OFFLINE": "onoffline"
    };

    var Connection = new function(){
        var _this = this,
            currentIndex,
            consts = {
                SPEED_UNKNOWN: 100,
                SPEED_HIGH: 30,
                SPEED_MED: 20,
                SPEED_LOW: 10
            },
            types = [
                {
                    "name": undefined,
                    "speed": consts.SPEED_UNKNOWN
                },
                {
                    "name": "etherenet",
                    "speed": consts.SPEED_HIGH
                },
                {
                    "name": "wifi",
                    "speed": consts.SPEED_HIGH
                },
                {
                    "name": "2g",
                    "speed": consts.SPEED_LOW
                },
                {
                    "name": "3g",
                    "speed": consts.SPEED_MED
                }
            ],
            onLine = true, imageToPoll = "", pollingInterval = 0, timeoutPolling = null,
            ERROR_TIMEOUT = 0,
            EVENT_ONLINE = "ononline", EVENT_OFFLINE = "onoffline";

        this.init = function() {
            imageToPoll = "http://corp.everything.me/img/bg-pages.png";
            pollingInterval = 2000;
            ERROR_TIMEOUT = 5000;

            window.addEventListener(EVENT_ONLINE, function(){
                onLine = true;
                window.clearTimeout(timeoutPolling);
            });
            window.addEventListener(EVENT_OFFLINE, function(){
                onLine = false;
                checkConnection();
            });

            if (imageToPoll && pollingInterval) {
                checkConnection();
            }

            _this.set();
        };

        function checkConnection(cb) {
            window.clearTimeout(timeoutPolling);

            var img = new Image();
            img.timeout = null;
            img.onload = function() {
                window.clearTimeout(img.timeout);
                if (!onLine) {
                    fireEvent(EVENT_ONLINE);
                }
                cb && cb(true);
            };
            img.onerror = function() {
                window.clearTimeout(img.timeout);
                timeoutPolling = window.setTimeout(checkConnection, pollingInterval);
                if (onLine) {
                    fireEvent(EVENT_OFFLINE);
                }
                cb && cb(false);
            };

            img.timeout = window.setTimeout(function(){
                img.onload = null;
                img.onerror();
            }, ERROR_TIMEOUT);

            img.src = imageToPoll + "?ts=" + new Date().getTime();
        }

        this.online = function(callback) {
            checkConnection(callback);
        };

        this.get = function(){
            return getCurrent();
        };

        this.set = function(index){
             currentIndex = index || (navigator.connection && navigator.connection.type) || 0;
             return getCurrent();
        };

        function fireEvent(ev) {
            var e = document.createEvent("Events");
            e.initEvent(ev, true, false);
            window.dispatchEvent(e);
        }

        function getCurrent(){
            return aug({}, consts, types[currentIndex]);
        }

        function aug(){
            var main = arguments[0];
            for (var i=1, len=arguments.length; i<len; i++){
                for (var k in arguments[i]){ main[k] = arguments[i][k] }
            };
            return main;
        }

        // init
        _this.init();
    };

    this.init();
};

/* page visibility api polyfill */
(function(global, d){
    var DEFAULT_SPEC_EVENT = "visibilitychange",
        DEFAULT_SPEC_PROP = "hidden",
        prefixes = ["o", "ms", "moz", "webkit"],
        vendorProp, vendorEvent;

    if (typeof d[DEFAULT_SPEC_PROP] !== "undefined") {
        return;
    } else {
        var i = prefixes.length;
        while(i--) {
            var prefix = prefixes[i],
                propName = prefix + "Hidden";

            if (d[propName] !== "undefined") {
                vendorProp = propName;
                vendorEvent = prefix + "visibilitychange";
                break;
            }
        }
    }

    if (vendorEvent) {
        d.addEventListener(vendorEvent, function(){
            setHidden(d[vendorProp]);
        }, false);
    } else {
        var evShow = ("onpageshow" in global)? "pageshow" : "focus",
            evHide = ("onpagehide" in global)? "pagehide" : "blur";

        global.addEventListener(evShow, function(){
            setHidden(false);
        }, false);
        global.addEventListener(evHide, function(){
            setHidden(true);
        }, false);
    }

    function setHidden(hidden) {
        d[DEFAULT_SPEC_PROP] = hidden;
        fireVisibilityEvent();
    }
    function fireVisibilityEvent() {
        var e = d.createEvent("Events");
        e.initEvent(DEFAULT_SPEC_EVENT, true, false);
        d.dispatchEvent(e);
    }
})(this, document);