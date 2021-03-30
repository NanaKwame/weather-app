// This code is a simple interface to the Dark Sky API.
// It handles retrieving new data from .json files included in
// a sketch, or live data for a latitude/longitude via a server.

// Updated 2021-03-18 to add requestForecast() function to update
// the weather, and requestForecast('gps') to use GPS location.
// It also adds callbacks for weather loading and errors.

// Usage:
// requestWeather(42.3596764, -71.0958358);  // MIT
// requestWeather('data.json');  // read from a file
// requestWeather('gps');  // current GPS location

// Also possible to do with a callback:
// requestWeather('gps', function() {
//   ...do something here when the weather is updated
// });

// Or a second callback that handles errors:
// requestWeather('gps', function() {
//   ...do something here when the weather is updated
// }, function(errorMessage) {
//   console.error(errorMessage);  // print the message to the console
// });

// These functions wrap what's available in the API, but advanced users who
// understand how JSON objects work can access the information directly
// via the 'data' field:
//
// w = requestWeather();
// if (w.ready) {
//   console.log(w.data);  // print the JSON object as returned by the API
//   conosole.log(w.hourly);  // same as w.data.hourly, but here as a convenience
// }

// The Dark Sky docs page is now unavailable, but you can still read it here:
// https://web.archive.org/web/20200402135354/https://darksky.net/dev/docs

function requestWeather() {
  "use strict";

  function Weather() {
    this.ready = false;
    this.data = null;
    let self = this;

    let userLoadCallback = null;
    let userErrorCallback = null;


    // Deprecated; use getTimeMoment() instead
    this.getTime = function(range) {
      return this.getTimeMoment(range);
    }


    // returns the time using the Moment class (for easier handling)
    this.getTimeMoment = function(range) {
      if (range) {
        // get array of times as seconds
        let sec = gatherRange(range, 'time');
        let outgoing = [ ];
        for (let i = 0; i < sec.length; i++) {
          // create each instant by multiplying seconds from the api to millis expected by Date()
          outgoing.push(new Moment(sec[i] * 1000));
        }
        return outgoing;
      }
      return new Moment(this.currently.time * 1000);
    };


    // return the time or a series of times as a JavaScript Date object
    this.getTimeDate = function(range) {
      if (range) {
        // get array of times as seconds
        let sec = gatherRange(range, 'time');
        let outgoing = [ ];
        for (let i = 0; i < sec.length; i++) {
          // create each instant by multiplying seconds from the api to millis expected by Date()
          outgoing.push(new Date(sec[i] * 1000));
        }
        return outgoing;
      }
      return new Date(this.currently.time * 1000);
    };


    // time in seconds, as returned from the api
    this.getTimeSeconds = function(range) {
      return range ? gatherRange(range, 'time') : this.currently.time;
    };


    // short summary of the weather
    this.getSummary = function(range) {
      return range ? gatherRange(range, 'summary') : this.currently.summary;
    };


    // gets an icon name for the current weather
    this.getIcon = function(range) {
      return range ? gatherRange(range, 'icon') : this.currently.icon;
    };


    // only current... does not work for minutes, hours, days
    this.getNearestStormDistance = function() {
      return this.currently.nearestStormDistance;
    };


    // only current... does not work for minutes, hours, days
    this.getNearestStormBearing = function() {
      return this.currently.nearestStormBearing;
    };


    // amount of precipitation (in inches)
    this.getPrecipIntensity = function(range) {
      return range ? gatherRange(range, 'precipIntensity') : this.currently.precipIntensity;
    };


    // percent chance of precipitation (0..1)
    this.getPrecipProbability = function(range) {
      return range ? gatherRange(range, 'precipProbability') : this.currently.precipProbability;
    };


    // getTemperature() returns the current temperature
    // getTemperature('hourly') returns the predicted temperatures for the next 49 hours
    // for individual days, only the minimum and maximum temperatures are available,
    // use getTemperatureMin() and getTemperatureMax() instead.
    this.getTemperature = function(range) {
      if (range === 'daily') {
        throw TypeError("Use getTemperatureMin('daily') and getTemperatureMax('daily') instead");
      }
      return range ? gatherRange(range, 'temperature') : this.currently.temperature;
    };


    // get the minimum daily temperature
    this.getTemperatureMin = function(range) {
      if (range !== 'daily') {
        throw TypeError("only getTemperatureMin('daily') is available");
      }
      return gatherRange(range, 'temperatureMin');
    };


    // get the maximum daily temperature
    this.getTemperatureMax = function(range) {
      if (range !== 'daily') {
        throw TypeError("only getTemperatureMax('daily') is available");
      }
      return gatherRange(range, 'temperatureMax');
    };


    // what the temperature feels like
    this.getApparentTemperature = function(range) {
      if (range === 'daily') {
        throw TypeError("Use getApparentTemperatureMin('daily') and getApparentTemperatureMax('daily') instead");
      }
      return range ? gatherRange(range, 'apparentTemperature') : this.currently.apparentTemperature;
    };


    // get the minimum daily temperature
    this.getApparentTemperatureMin = function(range) {
      if (range !== 'daily') {
        throw TypeError("only getApparentTemperatureMin('daily') is available");
      }
      return gatherRange(range, 'apparentTemperatureMin');
    };


    // get the maximum daily temperature
    this.getApparentTemperatureMax = function(range) {
      if (range !== 'daily') {
        throw TypeError("only getApparentTemperatureMax('daily') is available");
      }
      return gatherRange(range, 'apparentTemperatureMax');
    };


    // returns humidity percentage as number (0..1)
    this.getHumidity = function(range) {
      return range ? gatherRange(range, 'humidity') : this.currently.humidity;
    };


    // wind speed in miles per hour
    this.getWindSpeed = function(range) {
      return range ? gatherRange(range, 'windSpeed') : this.currently.windSpeed;
    };


    // wind direction in degrees (0..359), but only if getWindSpeed() is not 0
    this.getWindBearing = function(range) {
      return range ? gatherRange(range, 'windBearing') : this.currently.windBearing;
    };


    // percent of sky covered by clouds (0..1)
    this.getCloudCover = function(range) {
      return range ? gatherRange(range, 'cloudCover') : this.currently.cloudCover;
    };


    // sea level air pressure in millibars
    this.getPressure = function(range) {
      return range ? gatherRange(range, 'pressure') : this.currently.pressure;
    };


    // "The columnar density of total atmospheric ozone...in Dobson units"
    this.getOzone = function(range) {
      return range ? gatherRange(range, 'ozone') : this.currently.ozone;
    };


    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Internal functions, you can safely ignore these


    function gatherRange(range, name) {
      if (range === 'hourly') {
        return gatherField(name, self.hourly.data);
      } else if (range === 'daily') {
        return gatherField(name, self.daily.data);
      } else {
        throw TypeError("Use 'daily', 'hourly', or 'minutely'");
      }
    }


    function gatherField(name, array) {
      var outgoing = [ ];
      var len = array.length;
      for (var i = 0; i < len; i++) {
        outgoing.push(array[i][name]);
      }
      return outgoing;
    }


    function loadCallback(data) {
      //console.log('got load');
      self.data = data;  // keep a copy of the original

      self.currently = data.currently;
      self.minutely = data.minutely;
      self.hourly = data.hourly;
      self.daily = data.daily;
      self.flags = data.flags;  // not really needed

      self.ready = true;

      if (userLoadCallback != null) {
        userLoadCallback(self);
      }
    }


    function errorCallback(response) {
      console.error('Error while trying to retrieve the weather:');
      console.error(response);

      if (userErrorCallback != null) {
        userErrorCallback(response);
      }
    }


    // Round a number to a specific number of decimal places.
    // Unlike nf(), the result will still be a Number, not a String.
    // via https://www.jacklmoore.com/notes/rounding-in-javascript/
    function round(value, decimals) {
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }


    this.requestForecast = function() {
      let args = Array.from(arguments);  // otherwise pop() will not work
      if (args.length > 0) {
        if (typeof args[args.length-1] === 'function') {
          // at least one callback, are there two?
          if (args.length > 1 && typeof args[args.length-2] === 'function') {
            // contains both load and error callbacks
            userErrorCallback = args.pop();
          }
          userLoadCallback = args.pop();
        }
      }
      if (args.length === 1) {
        if (args[0] != 'gps') {
          loadJSON(args[0], loadCallback, errorCallback);
        } else {
          if (navigator.geolocation) {
            print('Getting GPS location...');
            navigator.geolocation.getCurrentPosition(function(position) {
              // Four decimal places should be enough for weather forecast location
              // https://www.forensicdjs.com/blog/gps-coordinates-many-decimal-places-need/
              let lat = round(position.coords.latitude, 4);
              let lon = round(position.coords.longitude, 4);
              self.requestForecast(lat, lon);
            },
            function (error) {
              switch (error.code) {
                case error.TIMEOUT: errorCallback('Position timeout'); break;
                case error.POSITION_UNAVAILABLE: errorCallback('Position unavailable'); break;
                case error.PERMISSION_DENIED: errorCallback('Location permission denied'); break;
                default: errorCallback('Unknown location error'); break;
              }
            });
          } else {
            errorCallback('This browser does not support navigator.geolocation');
          }
        }
      } else if (args.length === 2) {
        let lat = args[0];
        let lon = args[1];
        // By default, we route requests to a server that caches requests when
        // talking to the Dark Sky API. This prevents everyone from needing to
        // sign up for an API key (which, as of 2021 is no longer possible anyway),
        // and it also helps insulate folks from errors. For instance, if you
        // accidentally put requestWeather() in draw(), you'll use up your 1,000
        // API calls per day very quickly. (Because draw() runs at 60 times a second,
        // you'll get to 1,000 in less than 17 seconds.)
        let url = "https://weathergirls.fathom.info/course/" + lat + "," + lon;
        console.log('Loading weather from ' + url);
        loadJSON(url, loadCallback);

      } else {
        console.log(arguments);
        console.log('Use requestWeather(filename) or requestWeather(lat, lon)');
      }
    };
  }

  let w = new Weather();
  // Use apply() to pass arguments directly to another function
  w.requestForecast.apply(null, arguments);
  return w;
}
