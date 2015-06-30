var sosos = (function() {

	/**
	 * SET PRIVATE VARIABLES
	 * @ignore
	 */

	var that = function(){},
		date = new Date(),
		eventListeners = {},
		eventListenersFunctions = {},
		incrementingId = 0;


	// Get all data on the browser and create the sosos.browser object
	getAllBrowserData();


	/**
	 * Data related to Plastiq based on the current user session
	 * @param 	{string} sessionData.referrer The site that referred the user to Plastiq
	 * @param 	{string} sessionData.cid Campaign ID for the current session
	 */

	that.sessionData = {
		// referrer: (oldSessionData.referrer ? oldSessionData.referrer : document.referrer),
		cid: (oldSessionData.cid ? oldSessionData.cid : (getUrlParamsAfterHash().cid ? getUrlParamsAfterHash().cid : getRequestUrlParams().cid))
	};

	checkForPrivateMode();

	sessionStorage.setItem('sessionData', JSON.stringify(that.sessionData));


	/**
	 * Define configuration variables for the app
	 * @param 	{string} config.api Root directory for the api service
	 * @param 	{string} config.baseURL Root URL for the app
	 * @param 	{string} config.baseURLString String of the base URL object for the app
	 * @param 	{string} config.templateURL String of URL view / parameter layout
	 * @param 	{number} config.defaultRate Base rate for Plastiq if none defined
	 * @param 	{string} config.postcodeanywhere API key to acces postcodeanywhere service
	 * @param 	{object} config.date Contains the current day, month, year, shortYear, and utc.
	 * @param 	{array} config.countries All the contries for plastiq {abbr: 'US', name: 'UNITED STATES'}
	 * @param 	{array} config.formCountries All the contries for plastiq forms {value: 'US', label: 'UNITED STATES'}
	 * @param 	{array} config.months All the months {name: 'January'}
	 * @param 	{array} config.years All the years {year: 2014}
	 */

	that.config = {
		api: '/services/v1/',

		// routing parameters
		URLPrefix: '/app/', // This is for templates and links within templates. It can get changed from "routes.js" if it is in the pay now app
		baseURL: '/app/#', // This is for the address bar url. It can get changed from "routes.js" if it is in the pay now app
		baseURLString: '{"baseView":"_","baseViewParams":"_","canopyView":"_","canopyViewParams":"_","drawerView":"_","drawerViewParams":"_","overlayView":"_","overlayViewParams":"_"}',
		viewsArrays: ['base', 'canopy', 'drawer', 'overlay'],
		templateURL: '/:baseView/:baseViewParams/:canopyView/:canopyViewParams/:drawerView/:drawerViewParams/:overlayView/:overlayViewParams',
		serviceTimeout: 1000 * 60 * 3,
		date: {
			day: date.getDate(),
			month: date.getMonth() + 1,
			year: date.getFullYear(),
			shortYear: date.getFullYear().toString().substring(2),
			utc: date
		}
	};


	/**
	 * Get the URL params
	 * @return 	{object} with the URL params
	 */

	that.getRequestUrlParams = function() {
		return getRequestUrlParams();
	}

	function getRequestUrlParams() {
		var result = {},
			getParams = window.location.search.substr(1).split("&");

		_.each(getParams, function(param) {
			var paramArray = param.split('=');

			result[paramArray[0]] = paramArray[1];
		});

		if(!result){

		}

		return result;
	}


	/**
	 * Public access to getUrlParamsAfterHash
	 * @return 	{object} with URL params after the URL hash
	 */

	that.getUrlParamsAfterHash = function() {
		return getUrlParamsAfterHash();
	}


	/**
	 * Get the URL params that are set after the URL hash
	 * @return 	{object} with the URL params after the URL hash
	 */

	function getUrlParamsAfterHash() {
		var result = {},
			getParams = location.hash.substring(location.hash.lastIndexOf('?') + 1, location.hash.length).split("&");

		if(!getParams[0].length){
			getParams = location.search.substring(location.search.lastIndexOf('?') + 1, location.search.length).split("&");
		}

		_.each(getParams, function(param) {
			var paramArray = param.split('=');

			result[paramArray[0]] = paramArray[1];
		});

		if(!result){

		}

		return result;
	}


	/**
	 * Add an event listener for the app. This is custom to give more control.
	 * @param 	{DOM} el Element, Window, or Document to add the listener too
	 * @param 	{string} eventName Type of event with namespaceing support click.modalClose
	 * @param 	{function} eventFunction Function to call when the event fires
	 */

	that.on = function(el, eventName, eventFunction) {
		if (!el || !eventName || !eventFunction) return;

		var elId = (el == window ? 'window' : that.getId(el)),
			eventType = eventName.split('.')[0],
			elEventGroup;

		if (!eventListeners[elId]) eventListeners[elId] = {};

		if (!eventListeners[elId][eventType]) {
			eventListeners[elId][eventType] = {};

			if (el == window) {
				window['on' + eventType] = function() {
					loopFunctionsCall(eventListeners[elId][eventType]);
				}
			} else {
				el.addEventListener(eventType, function() {
					loopFunctionsCall(eventListeners[elId][eventType]);
				});
			}
		}

		elEventGroup = eventListeners[elId][eventType];

		if (eventType == eventName) {
			if (elEventGroup[eventName]) {
				elEventGroup[eventName].push(eventFunction);
			} else {
				elEventGroup[eventName] = [eventFunction];
			}
		} else {
			elEventGroup[eventName] = eventFunction;
		}

		function loopFunctionsCall(eventFunctions) {
			_.each(eventFunctions, function(eventFunction) {
				if (typeof eventFunction == 'function') {
					eventFunction();
				} else {
					loopFunctionsCall(eventFunction);
				}
			});
		}
	};


	/**
	 * Remove an event listener from the app.
	 * @param 	{DOM} el Element, Window, or Document to remove the listener from
	 * @param 	{string} eventName The name of the event you want to remove
	 */

	that.off = function(el, eventName) {
		return;
		if (!el || !eventName) return;

		var elId = that.getId(el),
			eventsSplit = eventName.split('.'),
			eventType = eventsSplit[0],
			elEventGroup;

		if (eventListeners[elId] && eventListeners[elId][eventType]) {
			if (eventsSplit.length == 1) {
				delete eventListeners[elId][eventType];

				if (el == window) {
					window['on' + eventType] = null;
				} else {
					el.removeEventListener(eventType, eventListenersFunctions[elId + eventType]);
				}
			} else {
				delete eventListeners[elId][eventType][eventName];
			}
		}
	}


	/**
	 * Get or create the sosos specified id for an element
	 * @param 	{DOM} el Element or Document
	 * @return 	{string} of the plastiq specified id
	 */

	that.getId = function(element) {
		// move window check down here :-)
		if (element == document) return 'document';

		if (!element.hasAttribute('data-sosos-id')) {
			element.setAttribute('data-sosos-id', 'sososEl' + incrementingId);

			incrementingId++;
		}

		return element.getAttribute('data-sosos-id');
	};


	/**
	 * Populate data into an object
	 * @param 	{object} obj Object that you want the data populated into
	 * @param 	{object} data Object of data that you want to populate from
	 */

	that.process = function(obj, data) {
		_.each(data, function(value, key) {
			obj[key] = value;
		});
	}


	/**
	 * Gets the curent browsers scroll bar width
	 * @return 	{number} of pixels wide the current browsers scroll bar is
	 */

	that.scrollBarWidth = function() {
		var scrollBarWidth = 0,
			scrollDiv = document.createElement('div');

		scrollDiv.className = 'scrollbar-measure';
		document.body.appendChild(scrollDiv);

		scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
		document.body.removeChild(scrollDiv);

		return scrollBarWidth;
	}


	/**
	 * Checks to see if all parameters in an object are set to a value
	 * @param 	{object} obj Object to check
	 * @return 	{boolean} wheather all the parameters are set or not
	 */

	that.allTrue = function(obj) {
		var allTrue = true;

		_.each(obj, function(value, key) {
			if (value != true) {
				allTrue = false;

				return false;
			}
		});

		return allTrue;
	}


	/**
	 * Checks to see if all parameters in an object are not set
	 * @param 	{object} obj Object to check
	 * @return 	{boolean} wheather all the parameters are not set
	 */

	that.allFalse = function(obj) {
		var allFalse = true;

		_.each(obj, function(value, key) {
			if (value != false) {
				allFalse = false;

				return false;
			}
		});

		return allFalse;
	}


	/**
	 * Converts the case of an objects keys
	 * @param 	{object} obj Object to convert its keys casing
	 * @param 	{string} casing Type of casing to convert the objects keys too
	 */

	that.convertCase = function(obj, casing) {
		_.each(obj, function(value, key) {
			var newKey = key.toString().caseify(casing);

			if (newKey != key) {
				obj[newKey] = value;

				delete obj[key];
			}
		});
	}


	/**
	 * Creates a collection of dropdown choices
	 * @param 	{array} values Takes an array of strings of dropdown values
	 * @return 	{array} returns array of objects with corresponding value & altText for dropdown
	 */

	that.createDropdownChoices = function(choices) {
		_.map(choices, function(choice) {
			if (!choice.value) that.process(choice, {value: choice.name});
			that.process(choice, {altText: choice.name});
		});

		return choices;
	}


	/**
	 * Gets the current state the app is in from the URL
	 * @param 	{string} URL A URL to get the views states from
	 * @return 	{object} with the app views state
	 */

	that.getCurrentState = function(URL) {
		var baseURLArray = that.getTemplateURL().split('/'),
			URLArray = URL.split('/'),
			params = {};

		baseURLArray.shift();
		URLArray.shift();

		_.each(baseURLArray, function(value, key) {
			params[value.replace(':', '')] = URLArray[key];
		});

		return params;
	}


	/**
	 * Gets the difference in urls from to url objects
	 * @param 	{object} obj1 URL Object
	 * @param 	{object} obj2 URL Object 2
	 * @return 	{object} with the URL difference
	 */

	that.URLDifference = function(obj1, obj2) {
		var objDiff = {};

		_.each(obj1, function(value, key) {
			if (key == 'URLDiff') return true;

			if ((!obj2[key] || obj2[key] != value) && value && value.length && value != '-') {
				objDiff[key] = value;
			}
		});

		return objDiff;
	};


	/**
	 * Gets the difference between two objects
	 * @param 	{object} obj1 Object you want to compare the data against
	 * @param 	{object} obj2 Object you want to set the difference from
	 * @param 	{boolean} inclution True if you want to include
	 * @param 	{boolean} onlyNonObjects True if you want to exclude objects
	 * @param 	{boolean} reverse True if want to compare objects in reverse (useful when obj1 is undefined)
	 * @return 	{object} with the difference in the two objects
	 */

	that.objDiff = function(obj1, obj2, inclution, onlyNonObjects, reverse) {
		var objDiff = {};

		if (onlyNonObjects) {
			_.each(obj1, function(value, key) {
				if (!(obj2[key] instanceof Object) && obj2 && obj2[key] != undefined && obj2[key] != value) {
					objDiff[key] = obj2[key];
				} else if (!obj2 || (!obj2[key] && inclution)) {
					objDiff[key] = value;
				}
			});
		} else if (reverse) {
			_.each(obj2, function(value, key) {
				if (obj1 && obj1[key] != undefined && obj1[key] != value) {
					objDiff[key] = obj2[key];
				} else if (!obj1 || (!obj1[key] && inclution)) {
					objDiff[key] = value;
				}
			});
		} else {
			_.each(obj1, function(value, key) {
				if (obj2 && obj2[key] != undefined && obj2[key] != value) {
					objDiff[key] = obj2[key];
				} else if (!obj2 || (!obj2[key] && inclution)) {
					objDiff[key] = value;
				}
			});
		}

		return objDiff;
	};


	/**
	 * Creates a URL from an object of parameters and a template URL
	 * @param 	{object} params An object with URL parameter data
	 * @param 	{string} templateURL Template URL you want to base the URL off of
	 * @return 	{string} with the URL template filled out with the URL parameters
	 */

	that.constructURL = function(params, templateURL) {
		var newURL = '',
			templateArray = templateURL.split('/');

		templateArray.splice(0, 1);

		_.each(templateArray, function(section) {
			var isVar = (section.indexOf(':') == -1 ? false : true);

			newURL += '/';
			section = section.replace(':', '');

			if (params[section]) {
				newURL += params[section];
			} else {
				newURL += (isVar ? '_' : section);
			}
		});

		return newURL;
	};


	/**
	 * Gets the current state the app is in from the URL
	 * @param 	{object} newParams Parameters you want to fill the old object with
	 * @param 	{object} oldParams Parameters you want to replace data with
	 * @return 	{object} with the data from the new object in the old object
	 */

	that.getParams = function(newParams, oldParams) {
		// need to check for not only the - but everything else.
		var adjustedParams = _.clone(oldParams);

		_.each(newParams, function(value, key) {
			adjustedParams[key] = value;
		});

		return adjustedParams;
	};


	/**
	 * Gets a URLs parameter
	 * @param 	{string} URL A URL to get the params from
	 * @return 	{object} with the params from the URL split out into an object
	 */

	that.getUrlParams = function(URL) {
		var templateURLArray = that.getTemplateURL().split('/'),
			URLArray = URL.split('/'),
			params = {};

		_.each(templateURLArray, function(param, key) {
			if (param.indexOf(':') == 0) {
				params[param.replace(':', '')] = URLArray[key] ? URLArray[key] : '-';
			}
		});

		return params;
	};


	/**
	 * Get the views that need to be replace based on previous url
	 * @param 	{object} params A URL object to check what views need to be replaced
	 * @return 	{object} with the app views that need to be replaced
	 */

	that.checkAdjustment = function(params) {
		var adjust = false;

		_.each(params, function(value) {
			if (value == '-') {
				adjust = true;

				return false;
			}
		});

		return adjust;
	};


	/**
	 * Get the views that need to be updated
	 * @param 	{object} viewMap Template views object
	 * @param 	{object} paramsDelta Object of views that changed
	 * @return 	{array} of the views that need to be updated
	 */

	that.getChangingViews = function(viewMap, paramsDelta) {
		var views = [];

		_.each(viewMap, function(value, key) {
			_.each(value, function(view) {
				if (paramsDelta[view]) {
					views.push(key);

					return false;
				}
			});
		});

		return views;
	}


	/**
	 * Get the difference between two dates
	 * @param 	{date} date1 The start date
	 * @param 	{date} date2 The end date you want to get the difference too
	 * @param 	{string} interval The interval that you want to get (days, weeks, months, years)
	 * @return 	{number} of specified intervals between the two dates
	 */

	that.dateDiff = function(date1, date2, interval) {
		var difference;

		switch (interval) {
			case 'days':
				var t2 = date2.getTime(),
					t1 = date1.getTime();

				difference = parseInt((t2 - t1) / (24 * 3600 * 1000));

				break;
			case 'weeks':
				var t2 = date2.getTime(),
					t1 = date1.getTime();

				difference = parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));

				break;
			case 'months':
				var date1Y = date1.getFullYear(),
					date2Y = date2.getFullYear(),
					date1M = date1.getMonth(),
					date2M = date2.getMonth();

				difference = (date2M + 12 * date2Y) - (date1M + 12 * date1Y);

				break;
			case 'years':
				difference = date2.getFullYear() - date1.getFullYear();

				break;
		}

		return difference;
	}


	/**
	 * Gets the future date based on an interval and x number of the interval
	 * @param 	{date} date A date that you want to start from
	 * @param 	{number} skips The total number that you want to jump into the future
	 * @param 	{string} interval The type of interval you want to jump (days, weeks, months, years)
	 * @return 	{object} with the app views state
	 */

	that.futureDate = function(date, skips, interval) {
		var futureDate = _.clone(date);

		if (!futureDate) return undefined;

		switch (interval) {
			case 'days':
				futureDate.setDate(skips + futureDate.getDate())

				break;
			case 'weeks':
				futureDate.setDate((skips * 7) + futureDate.getDate())

				break;
			case 'months':
				var years = Math.floor(skips / 12),
					months = skips - (years * 12),
					currentMonth = futureDate.getMonth();

				if ((currentMonth + months) > 11) {
					years++;
					months = months - 11;
				}

				futureDate.setFullYear(futureDate.getFullYear() + years);
				futureDate.setMonth(months + currentMonth)

				break;
			case 'years':
				futureDate.setFullYear(futureDate.getFullYear() + skips);

				break;
		}

		return futureDate;
	}


	/**
	 * Get the last day of the month in a given date
	 * @param 	{date} date A Date you want to get the month from
	 * @return 	{date} of the last day of the month
	 */

	that.getLastDayOfMonth = function(year, month) {
		return moment([year, month, 1]).endOf('month').date();
	}


	/**
	 * Check if a date is in an array of dates
	 * @param 	{array} dateArray Array of dates you want to check
	 * @param 	{date} compareDate Date to see if it is in the array
	 * @return 	{boolean} whether it is in the array or not
	 */

	that.dateArrayContains = function(dateArray, compareDate) {
		var inArray = false;

		_.each(dateArray, function(date) {
			if (date.getTime() == compareDate.getTime()) {
				inArray = true;

				return false;
			}
		});

		return inArray;
	}


	/**
	 * Get a value from an object that is further than the root of the object
	 * @param 	{object} obj Object that you want to query down into
	 * @param 	{string} query The key that you want to query too
	 * @param 	{boolean} returnPrior Get the parent from the query and return that instead
	 * @return 	{anything} of the queried value
	 */

	that.drillObject = function(obj, query, returnPrior) {
		var queryArray = (query ? query.split('.') : []),
			result = obj;

		_.each(queryArray, function(value, key) {
			if (result) result = result[value];

			if (returnPrior && queryArray.length == key + 1) {
				return false;
			}
		});

		return result;
	}


	/**
	 * Queries down into an object and sets a value
	 * @param 	{object} obj The object you want to set the value on
	 * @param 	{string} query The keys that you want to search on the object
	 * @param 	{anything} settingValue The value that you want to set
	 * @return 	{object} at the drilldown level with the new value set
	 */

	that.drillAndSet = function(obj, query, settingValue) {
		var queryArray = query.split('.'),
			result = obj;

		_.each(queryArray, function(value, key) {
			if (settingValue && key == (queryArray.length - 1)) {
				result[value] = settingValue;
			} else {
				result = result[value];
			}
		});

		return result;
	}


	/**
	 * Converts an object of objects to an array of objects
	 * @param 	{object} objs An object of objects
	 * @param 	{keyid} string Key that you want to set the objects key too within the object
	 * @return 	{array} of the objects
	 */

	that.objectToArray = function(objs, keyid) {
		var arr = [];

		_.each(objs, function(obj, key) {
			obj[keyid] = key;
			arr.push(obj);
		});

		return arr;
	}


	/**
	 * Create a date from a date time stamp
	 * @param 	{string} dateTime A time stamp
	 * @return 	{date} that was created from a time stamp
	 */

	that.newDate = function(dateTime) {
		var t = dateTime.split(/[- :]/);

		return new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
	}


	/**
	 * Get objects that are in or not in an array of keys
	 * @param 	{object} objects Object of objects
	 * @param 	{array} array Array of keys to find or remove from the object of objects
	 * @param 	{boolean} notIncluded If you want to include the objects in the array or disclude them
	 * @return 	{array} with the objects removed or included in the array
	 */

	that.getObjects = function(objects, array, notIncluded) {
		var results = [];

		_.each(objects, function(object, key) {
			if (array.indexOf(key) != -1 && !notIncluded) {
				results.push(object);
			} else if (array.indexOf(key) == -1 && notIncluded) {
				results.push(object);
			}
		});

		return results;
	}


	/**
	 * Get the variables from a URL
	 * @param 	{string} URL The part of the URL that includes variables
	 * @return 	{object} with the variables from the URL
	 */

	that.getVars = function(URL) {
		if (!URL) return {};

		var variables = {},
			varArray = URL.split('&');

		_.each(varArray, function(value) {
			var keyValue = value.split(':');

			variables[keyValue[0]] = keyValue[1];
		});

		return variables;
	}


	/**
	 * Get the current browsers type of character set encoding
	 * @return 	{string} of the current browsers character set encoding
	 */

	function getBrowserEncoding() {
		if (navigator.userAgent.toLowerCase().indexOf("msie") != -1 && (parseInt(navigator.appVersion) >= 4) && navigator.userAgent.toLowerCase().indexOf(".net clr") != -1) {
			return document.charset;
		} else {
			return document.characterSet;
		}
	}

	/**
	 * Public call to get and set all the data on the current browser
	 */

	that.getAllBrowserData = function() {
		getAllBrowserData();
	}


	/**
	 * Get and set all the current browser data
	 * @param 	{string} browser.vendor Browser vendor
	 * @param 	{string} browser.version Browser version
	 * @param 	{string} browser.appName Browser appName
	 * @param 	{string} browser.appCodeName Browser appCodeName
	 * @param 	{string} browser.userAgent Browser userAgent
	 * @param 	{string} browser.appVersion Browser appVersion
	 * @param 	{string} browser.product Browser product
	 * @param 	{string} browser.productVendor Browser product vendor
	 * @param 	{string} browser.encoding Browser encoding
	 * @param 	{string} browser.jsVersion JavaScript Version
	 * @param 	{string} browser.os Operating System
	 * @param 	{number} browser.colorBits Color Bits
	 * @param 	{number} browser.colorNumbers Color Numbers
	 * @param 	{number} browser.resolutionWidth Screen Resolution width
	 * @param 	{number} browser.resolutionHeight Screen Resolution height
	 * @param 	{number} browser.width Browser Width
	 * @param 	{number} browser.height Browser Height
	 * @param 	{boolean} browser.supportsCookie Browser properties Cookies
	 * @param 	{boolean} browser.supportsHTML5Storage Browser properties HTML5 Storage
	 * @param 	{boolean} browser.supportsJava Browser properties Java
	 * @param 	{string} browser.language Browser language
	 * @param 	{array} browser.languages Languages browser has loaded
	 * @param 	{number} browser.maxTouchPoints Touch points the screen recgonizes
	 * @param 	{string} browser.speed Current internet speed in Mbps (not an accurate Mbps reading, but accurate relative to others of the same test)
	 */

	function getAllBrowserData() {
		that.browser = {
			vendor: browser().split(' ')[0],
			version: browser().split(' ')[1],
			isMobile: (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false),
			appName: navigator.appName,
			appCodeName: navigator.appCodeName,
			userAgent: navigator.userAgent,
			appVersion: navigator.appVersion,
			product: navigator.product,
			productVendor: navigator.vendor,
			encoding: getBrowserEncoding(),
			jsVersion: typeof jsVersion !== 'undefined' ? jsVersion : '1.7',
			os: navigator.platform,
			colorBits: window.screen.colorDepth,
			colorNumbers: Math.pow(2, window.screen.colorDepth),
			resolutionWidth: screen.width,
			resolutionHeight: screen.height,
			windowWidth: window.innerWidth,
			windowHeight: window.innerHeight,
			supportsCookie: (document.cookie ? true : false),
			supportsHTML5Storage: (window.localStorage ? true : false),
			supportsJava: navigator.javaEnabled(),
			language: navigator.language,
			languages: navigator.languages,
			touchPoints: navigator.maxTouchPoints,

			speed: 0
		}

		getBrowserSpeed();
	}

	/**
	 * Get browser data
	 * @return 	{string} with the browser data
	 */

	function browser() {
		var ua = navigator.userAgent,
			M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [],
			tem;

		if (/trident/i.test(M[1])) {
			tem = /\brv[ :]+(\d+)/g.exec(ua) || [];

			return 'IE ' + (tem[1] || '');
		}

		if (M[1] === 'Chrome') {
			tem = ua.match(/\bOPR\/(\d+)/)
			if (tem != null) return 'Opera ' + tem[1];
		}

		M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];

		if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);

		return M.join(' ');
	}


	/**
	 * Calculate the current speed of the internet connection
	 */

	function getBrowserSpeed() {
		var imageAddr = '/app/img/happyPanda.png',
			xhr = new XMLHttpRequest(),
			startTime;

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var duration = ((new Date()).getTime() - startTime) / 1000,
					bitsLoaded = xhr.getResponseHeader('Content-Length') * 8,
					speedMbps = ((bitsLoaded / duration) * .000001).toFixed(2);

				that.browser.speed = speedMbps;
			} else {
				that.browser.speed = 0;
			}
		};

		startTime = (new Date()).getTime();

		xhr.open('GET', imageAddr + '?cb=' + startTime, true);
		xhr.send(null);
	}


	that.promiseBag = function () {
		var deferred = $q.defer(),
			promises = (arguments && arguments[0] && _.isArray(arguments[0]) ? arguments[0] : arguments),
			promisesRemaining = promises.length;

		_.each(promises, function(promise){
			promise.then(function(status){
				promiseFinished(status);
			});
		});

		function promiseFinished(status) {
			if (status === false) deferred.resolve(false);

			promisesRemaining--;

			if (!promisesRemaining) deferred.resolve(true);
		}

		return deferred.promise;
	};


	/**
	 * (Safari iOS) in Private Browsing Mode, looks like browser supports localStorage but all calls to setItem
	 * throw QuotaExceededError. We detect this and just drop calls to setItem to avoid entire page breaking,
	 * without checking at each usage of Storage.
	 */
	function checkForPrivateMode() {
		if (typeof localStorage === 'object') {
			try {
				localStorage.setItem('testStorage', 1);
				localStorage.removeItem('testStorage');
			} catch (error) {
				Storage.prototype._setItem = Storage.prototype.setItem;
				Storage.prototype.setItem = function() {};

				console.error('Your web browser does not support storing settings locally. In Safari, a common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you.');
		    }
		}
	}

	return that;
})();



if (!Object.defineProperty) {

	/**
	 * Get the size on an object.
	 * @return 		{number} of parameters in the object
	 */

	Object.prototype.size = function() {
		var size = 0,
			key;

		for (key in this) {
			if (this.hasOwnProperty(key) && key != 'size' && this[key] != undefined) size++;
		}

		return size;
	};
} else {
	Object.defineProperty(Object.prototype, 'size', {
		value: function() {
			var size = 0,
				key;

			for (key in this) {
				if (this.hasOwnProperty(key) && this[key] != undefined) size++;
			}

			return size;
		},
		writable: true
	});
}


/**
 * Remove a value from an array.
 * @param 	{string-number-boolean} value The value you want removed from the array
 */

Array.prototype.remove = function(value) {
	var index = this.indexOf(value);

	if (index != -1) {
		this.splice(index, 1);
	}
}

/**
 * Get the previous element.
 * @return 	{DOM} of the previous element.
 */

Element.prototype.prev = function() {
	if (this.previousElementSibling) return this.previousElementSibling;

	var parent = this.parentNode,
		children = parent.childNodes,
		prev;

	for (var i = 1; i < children.length; i++) {
		if (children[i] === this[0]) {
			prev = children[i-1];
		}
	}

	return prev;
}


/**
 * Add html to an element.
 * @param 	{HTML} content The html you want the element to contain
 */

Element.prototype.html = function(content) {
	if (typeof content == 'string') {
		this.innerHTML = content;
	} else {
		this.innerHTML = '';
		this.appendChild(content);
	}
}


/**
 * Query for elements that contain a certain attribute.
 * @param 	{string} attribute The attribute you want the element to have
 * @return 	{nodeList} of elements that contain the queried attribute
 */

Element.prototype.queryAttribute = function(attribute) {
	var elements = [],
		children = this.querySelectorAll('*');

	_.each(children, function(child) {
		if (child.getAttribute(attribute) != null) elements.push(child);
	});

	return elements;
}


/**
 * Get the scroll offset of an element to its parent scroll.
 * @return 	{number} of px the element is offset
 */

Element.prototype.scrollOffset = function() {
	var that = this,
		offset = this.offsetTop,
		parent = that.parentElement,
		parentScroll = false;

	if (!parent) return 0;

	while (parentScroll != true && parent) {
		offset += parent.offsetTop;

		if (parent.css('overflow') == 'scroll') {
			parentScroll = true;
		} else {
			parent = parent.parentElement;
		}
	}

	return offset;
}


/**
 * Get the element that matches the queried selector.
 * @param 	{string} selector The query that you want the cloest element to match
 * @return 	{number} of px the element is offset
 */

Element.prototype.closest = function(selector) {
	var selectors = selector.split(' '),
		parent = this.parentElement;

	function matchesSelectors(parent) {
		return elmSelectorMatch(parent, selectors);
	}

	while (parent) {
		if (matchesSelectors(parent)) {
			return parent;
		} else {
			parent = parent.parentElement;
		}
	}

	return parent;
}


/**
 * Checks if the element contains the list of selectors
 * @param 	{DOM} elm The element to match against
 * @param 	{array} selectors Array of selectors to query
 * @return 	{number} of px the element is offset
 */

function elmSelectorMatch(elm, selectors) {
	var matches = true;

	_.each(selectors, function(value) {
		if (value.indexOf('.') != -1) {
			if (!elm.hasClass(value.replace('.', ''))) {
				matches = false;

				return false;
			}
		} else if (value.indexOf('#') != -1) {
			if (elm.id != value.replace('#', '')) {
				matches = false;

				return false;
			}
		} else if (value.indexOf('[') != -1) {
			if (elm.getAttribute(value.replace(/[[\]]/g, '')) === null) {
				matches = false;

				return false;
			}
		} else {
			if (elm.tagName.toLowerCase() != value) {
				matches = false;

				return false;
			}
		}
	});

	return (matches === true ? true : false);
}


/**
 * Remove the element
 */

Element.prototype.remove = function() {
	if (this.parentElement) this.parentElement.removeChild(this);
}


/**
 * Get an elements siblings
 * @param 	{string} selector String to match the elements siblings against
 * @return 	{nodeList} of elements that are siblings of the element
 */

Element.prototype.siblings = function(selector) {
	var siblings = this.parentElement.children;

	if (selector) {
		var matchingSiblings = [],
			selectors = selector.split(' ');

		_.each(siblings, function(sibling) {
			if (elmSelectorMatch(sibling, selectors)) matchingSiblings.push(sibling);
		});

		return matchingSiblings;
	} else {
		return siblings;
	}
}


/**
 * Remove the list of nodes
 */

NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
	for (var i = 0, len = this.length; i < len; i++) {
		if (this[i] && this[i].parentElement) {
			this[i].parentElement.removeChild(this[i]);
		}
	}
}


/**
 * Get the width of the text in the element
 * @return 	{number} of px wide the elements total text is
 */

Element.prototype.getTextWidth = function() {
	var fontFamily = this.css('font-family'),
		fontSize = this.css('font-size'),
		text = this.textContent,
		div = document.createElement('div'),
		totalWidth = 0;

	if (!text.length) return totalWidth;

	div.addClass('text-width-check');
	div.css('font-family', fontFamily);
	div.css('font-size', fontSize);
	div.textContent = text;

	document.body.insertBefore(div, document.body.childNodes[0]);
	totalWidth = div.css('width');
	div.remove();

	return totalWidth;
}


/**
 * Get the total height of an elements children
 * @return 	{number} of px high the elements children are
 */

Element.prototype.getChildrenHeight = function() {
	var height = 0,
		children = this.children;

	_.each(this.children, function(child) {
		height += child.offsetHeight;
	});

	return height;
}


/**
 * Check if the element has a class
 * @param 	{string} classToHave Array of selectors to query
 * @return 	{number} of px the element is offset
 */

Element.prototype.hasClass = function(classToHave) {
	var classes = this.className.split(' '),
		hasClass = false;

	_.each(classes, function(value) {
		if (value === classToHave) {
			hasClass = true;

			return false;
		}
	});

	return hasClass;
}


/**
 * Add a class or classes to the element
 * @param 	{string} classToAdd Class or list of classes to add seperated by a ','.
 */

Element.prototype.addClass = function(classToAdd) {
	addClass(this, classToAdd);
}


/**
 * Remove a class or classes from the element
 * @param 	{string} classToRemove Class or list of classes seperated by a ','.
 */

Element.prototype.removeClass = function(classToRemove) {
	removeClass(this, classToRemove);
}


/**
 * Class or classes to toggle on an element
 * @param 	{string} classToToggle Class or Classes seperated by a ','.
 */

Element.prototype.toggleClass = function(classToToggle) {
	toggleClass(this, classToToggle);
}


/**
 * Add a class or classes to the node list
 * @param 	{string} classToAdd Class or list of classes to add seperated by a ','.
 */

NodeList.prototype.addClass = function(classToAdd) {
	_.each(this, function(elm) {
		addClass(elm, classToAdd);
	});
}


/**
 * Remove a class or classes from the node list
 * @param 	{string} classToRemove Class or list of classes seperated by a ','.
 */

NodeList.prototype.removeClass = function(classToRemove) {
	_.each(this, function(elm) {
		removeClass(elm, classToRemove);
	});
}


/**
 * Class or classes to toggle on an node list
 * @param 	{string} classToToggle Class or Classes seperated by a ','.
 */

NodeList.prototype.toggleClass = function(classToToggle) {
	_.each(this, function(elm) {
		toggleClass(elm, classToToggle);
	});
}


/**
 * Capitalize the first letter in a string.
 * @return 	{string} with the first letter capitalized
 */

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}


/**
 * Capitalize the first letter of every word in a string
 * @return 	{string} with the first letter in every word capitalized
 */

String.prototype.titleCase = function() {
	return this.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}


/**
 * Convert the casing of a string
 * @param 	{string} casing Type of case (camel, snake, or spinal)
 * @return 	{string} with the casing changed
 */

String.prototype.caseify = function(casing) {
	if (casing == 'camel') {
		return this.replace(/(\-[a-z])/g, function($1) {
			return $1.toUpperCase().replace('-', '');
		}).replace(/(\_[a-z])/g, function($1) {
			return $1.toUpperCase().replace('_', '');
		});
	} else if (casing == 'snake') {
		return this.replace(/([A-Z])/g, function($1) {
			return "_" + $1.toLowerCase();
		}).replace(/(\-[a-z])/g, function($1) {
			return $1.toLowerCase().replace('-', '_');
		});
	} else if (casing == 'spinal') {
		return this.replace(/([A-Z])/g, function($1) {
			return "-" + $1.toLowerCase();
		}).replace(/(\_[a-z])/g, function($1) {
			return $1.toLowerCase().replace('_', '-');
		});
	};
}


/**
 * Convert all spaces to '_'
 * @return 	{string} with all the spaces changed to '_'
 */

String.prototype.underscoreIt = function() {
	return this.replace(/ /g, '_');
}


/**
 * replace all instances or a string
 * @param 	{string} query Part of the string to replace
 * @param 	{string} replacement String to replace the query with
 * @return 	{string} with all instances in the string that match the query replaced with replacement
 */

String.prototype.replaceInsensitive = function(query, replacement) {
	var regex = new RegExp('(' + query + ')', 'gi');
	return this.replace(regex, replacement);
}


/**
 * decode HTML and URI encoding in a string
 * @param 	{boolean} isHTML If it is HTML vs URI encoding
 * @return 	{string} that is decoded
 */

String.prototype.decodeHTML = function(isHTML) {
	var string = this.replace();

	if (isHTML) {
		var div = document.createElement('div');

		div.innerHTML = string;

		return div.childNodes.length === 0 ? "" : div.childNodes[0].nodeValue;
	}

	return decodeURI(string);
}

/**
 * encode HTML and URI encoding in a string
 * @param 	{boolean} isHTML If it is HTML vs URI encoding
 * @return 	{string} that is decoded
 */

String.prototype.encodeHTML = function(isHTML) {
	var string = this.replace();

	if (isHTML) {
		var div = document.createElement('div');

		div.textContent = string;

		return div.childNodes.length === 0 ? "" : div.innerHTML;
	}

	return encodeURI(string);
}


/**
 * possessiveify a string
 * return {string} that is possessiveified
 */

String.prototype.possessiveify = function() {
	if (this.length > 1) {
		if (_.last(this, 2)[0] === "'") return this.slice(0, this.length - 2) + "s'";
		if (_.last(this) === "s") return this + "'";
	}

	return this + "'s";
}


/**
 * Return the css or set the css to an element
 * @param 	{string} style Style to match on the element
 * @param 	{string} setStyle Value to set on the given style for the element
 * @param 	{boolean} computed Not being used currently TEMPORARY
 * @return 	{string} of the caculated value of the queried style for the element
 */

Element.prototype.css = function(style, setStyle, computed) {

	var returnVal;

	function addStyle(el, style, setStyle) {
		style = style.caseify('camel');
		el.style[style] = setStyle;
		el.style[prefix.lowercase + style.capitalizeFirstLetter()] = setStyle;
	}

	if (setStyle) {
		addStyle(this, style, setStyle);
	} else if (typeof style === 'string') {
		if (!computed) {
			var cssStyle = getComputedStyle(this, null).getPropertyValue(style) || getComputedStyle(this, null).getPropertyValue(prefix.lowercase + style.capitalizeFirstLetter());
			returnVal = this.style.getPropertyValue(style) || getComputedStyle(this, null).getPropertyValue(style) || getComputedStyle(this, null).getPropertyValue(prefix.lowercase + style.capitalizeFirstLetter());
		}
		return returnVal;
	} else {
		var that = this;

		_.each(style, function(style, param) {
			addStyle(that, param, style);
		});
	}
}


/**
 * Get the prefix of the current browsers styles
 * @return 	{string} of the current browsers style prefix
 */

var prefix = (function() {
	var styles = window.getComputedStyle(document.documentElement, ''),
		pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

	pre = (pre ? pre : 'ms');

	var dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

	return {
		dom: dom,
		lowercase: pre,
		css: '-' + pre + '-',
		js: pre[0].toUpperCase() + pre.substr(1)
	};
})();


/**
 * Add a class or classes to element
 * @param 	{DOM} elm Element to add the class too
 * @param 	{string} classToAdd Class or list of classes to add seperated by a ','.
 */

function addClass(elm, classToAdd) {
	if (classToAdd.indexOf(',') != -1) {
		var classes = classToAdd.split(','),
			that = elm;

		_.each(classes, function(classToAdd2) {
			that.addClass(classToAdd2.trim());
		});
	} else if (!elm.hasClass(classToAdd)) {
		elm.className += (elm.className.length ? ' ' : '') + classToAdd;
	}
}


/**
 * Remove a class or classes from element
 * @param 	{DOM} elm Element to add the class too
 * @param 	{string} classToRemove Class or list of classes seperated by a ','.
 */

function removeClass(elm, classToRemove) {
	if (classToRemove.indexOf(',') != -1) {
		var classes = classToRemove.split(','),
			that = elm;

		_.each(classes, function(classToRemove2) {
			that.removeClass(classToRemove2.trim());
		});
	} else if (elm.hasClass(classToRemove)) {
		var classes = elm.className.split(' '),
			newClasses = '';

		_.each(classes, function(thisClass) {
			if (thisClass != classToRemove) newClasses += thisClass + ' ';
		});

		elm.className = newClasses.trim();
	}
}


/**
 * Class or classes to toggle on element
 * @param 	{DOM} elm Element to add the class too
 * @param 	{string} classToToggle Class or Classes seperated by a ','.
 */

function toggleClass(elm, classToToggle) {
	if (classToToggle.indexOf(',') != -1) {
		var classes = classToToggle.split(','),
			that = elm;

		_.each(classes, function(classToToggle2) {
			that.toggleClass(classToToggle2.trim());
		});
	} else {
		if (elm.hasClass(classToToggle)) {
			elm.removeClass(classToToggle);
		} else {
			elm.addClass(classToToggle);
		}
	}
}



// FALLBACKS FOR OLD BROWSERS

// getComputedStyle() fallback

if (!window.getComputedStyle) {

	/**
	 * Fallback for getComputedStyle
	 */

	Window.prototype.getComputedStyle = (function() {
		var Push = Array.prototype.push;

		function getComputedStylePixel(element, property, fontSize) {
			var
				value = element.currentStyle[property].match(/([\d\.]+)(%|cm|em|in|mm|pc|pt|)/) || [0, 0, ''],
				size = value[1],
				suffix = value[2],
				rootSize;

			fontSize = fontSize != null ? fontSize : /%|em/.test(suffix) && element.parentElement ? getComputedStylePixel(element.parentElement, 'fontSize', null) : 16;
			rootSize = property == 'fontSize' ? fontSize : /width/i.test(property) ? element.clientWidth : element.clientHeight;

			return suffix == '%' ? size / 100 * rootSize :
				suffix == 'cm' ? size * 0.3937 * 96 :
				suffix == 'em' ? size * fontSize :
				suffix == 'in' ? size * 96 :
				suffix == 'mm' ? size * 0.3937 * 96 / 10 :
				suffix == 'pc' ? size * 12 * 96 / 72 :
				suffix == 'pt' ? size * 96 / 72 :
				size;
		}

		function setShortStyleProperty(style, property) {
			var
				borderSuffix = property == 'border' ? 'Width' : '',
				t = property + 'Top' + borderSuffix,
				r = property + 'Right' + borderSuffix,
				b = property + 'Bottom' + borderSuffix,
				l = property + 'Left' + borderSuffix;

			style[property] = (style[t] == style[r] && style[t] == style[b] && style[t] == style[l] ? [style[t]] :
				style[t] == style[b] && style[l] == style[r] ? [style[t], style[r]] :
				style[l] == style[r] ? [style[t], style[r], style[b]] : [style[t], style[r], style[b], style[l]]).join(' ');
		}
		// tobi: we can not use native CSSStyleDeclaration ?
		function CSSStyleDeclaration(element) {
			var
				style = this,
				currentStyle = element.currentStyle,
				fontSize = getComputedStylePixel(element, 'fontSize');

			for (property in currentStyle) {
				Push.call(style, property == 'styleFloat' ? 'float' : property.replace(/[A-Z]/, function(match) {
					return '-' + match.toLowerCase();
				}));

				if (property == 'width') style[property] = element.offsetWidth + 'px';
				else if (property == 'height') style[property] = element.offsetHeight + 'px';
				else if (property == 'styleFloat') style['float'] = currentStyle[property];
				else if (/margin.|padding.|border.+W/.test(property) && style[property] != 'auto') style[property] = Math.round(getComputedStylePixel(element, property, fontSize)) + 'px';
				else style[property] = currentStyle[property];
			}

			setShortStyleProperty(style, 'margin');
			setShortStyleProperty(style, 'padding');
			setShortStyleProperty(style, 'border');

			style.fontSize = Math.round(fontSize) + 'px';
		}

		CSSStyleDeclaration.prototype = {
			constructor: CSSStyleDeclaration,
			getPropertyPriority: function() {
				throw Error('NotSupportedError: DOM Exception 9');
			},
			getPropertyValue: function(property) {
				return this[property.replace(/-\w/g, function(match) {
					return match[1].toUpperCase();
				})];
			},
			item: function(index) {
				return this[index];
			},
			removeProperty: function() {
				throw Error('NoModificationAllowedError: DOM Exception 7');
			},
			setProperty: function() {
				throw Error('NoModificationAllowedError: DOM Exception 7');
			},
			getPropertyCSSValue: function() {
				throw Error('NotSupportedError: DOM Exception 9');
			}
		};

		return function(element) {
			return new CSSStyleDeclaration(element);
		};
	})();
}

if (!window.location.origin) {

	/**
	 * Fallback for window.location.origin
	 */

	window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
}

if (!window.addEventListener) {

	/**
	 * Fallback for addEventListener
	 */

	window.addEventListener = window.attachEvent;
}

if (!window.console) {

	/**
	 * Fallback for console.log
	 */

	window.console = {
		log: function() {},
		error: function() {}
	};
}









