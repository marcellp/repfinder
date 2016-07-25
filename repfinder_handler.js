'use strict';

var request = require('request');
var turf = require('turf');
var fs = require('fs');
var path = require('path');
var apiKeys = require('api-keys');
var parseString = require('xml2js').parseString;

var findRep = function(req, res) {
  geocodeAddress(
      req.body.postcode + ' ' + req.body.city + ', ' + req.body.address, res);
};

// Geocodes the address, gets the information necessary for further tasks, and
// calls another function to locate the district corresponding to the address.
function geocodeAddress(addr, res) {
  request.get(
      {
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        qs: {address: addr, key: apiKeys.MAPS_API_KEY},
        json: true
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var geocodeObj = body;
          var country, county;
          var location;

          // Let's go through each address component until we find
          // the country. If the address the user entered is not
          // in Hungary, return an error.
          for (let comp of geocodeObj.results[0].address_components) {
            // 'country' is the name of the country.
            if (comp.types[0] == 'country') {
              country = comp.long_name;
            }

            // 'administrative_area_level_1' is the name of the county the
            // locality belongs to.
            if (comp.types[0] == 'administrative_area_level_1') {
              county = comp.long_name;
            }
          }

          if (country !== 'Hungary') {
            return returnError(res, 'A megadott cím nem Magyarországon van.');
          }

          // Store the coordinates as a turf point.
          location = turf.point([
            geocodeObj.results[0].geometry.location.lng,
            geocodeObj.results[0].geometry.location.lat
          ]);

          // If the person's address is valid, let's find out which district
          // it belongs to.
          findDistrict(location, county, res);

        } else {
          // There has been an error with Google's API. Return a general error
          // message.
          return returnError(res, 'Hiba történt a cím beazonosítása során.');
        }
      });
}

// Finds the voting district given a location (turf point) & the county the
// location belongs to.
function findDistrict(location, county, res) {
  fs.readFile(
      path.join(__dirname, 'districts', county + '.geojson'), 'utf8',
      function(err, data) {
        if (err) {
          return returnError(
              'A terület, amihez ez a település tartozik, nem tartozik megyébe.');
        }

        // 'obj' contains the GeoJSON object.
        var obj = JSON.parse(data);
        var isInside;

        for (var i = 0; i < obj.features.length; i++) {
          var buffered = turf.buffer(obj.features[i], 1, 'kilometers');
          isInside = turf.inside(location, buffered);

          if (isInside) {
            var districtData = obj.features[i].properties.name.split(" - ");
            findRepresentative(districtData, res);
            break;
          }
        }

        if (!isInside) {
          return returnError(
              res, 'A megadott cím nem tartozik egy választókerülthez sem.');
        }
      });
}

// Finds the representative of a voting district.
function findRepresentative(districtData, res) {
  request.get(
      {
        url:
            'http://www.parlament.hu/cgi-bin/web-api/kepviselok.cgi?access_token=' +
            apiKeys.PARLIAMENT_API_KEY
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          // Convert the XML response into JSON.
          parseString(body, function(err, result) {

            // This is an array with all reps in it.
            var rep_data = result.kepviselok.kepviselo;

            for (var i = 0; i < rep_data.length; i++) {
              // Find the representative corresponding to the county & the area
              // within the county.
              if (rep_data[i].$.vmegye === districtData[0] &&
                  rep_data[i].$.vkorzet === districtData[1]) {
                getRepData(rep_data[i].$.p_azon, districtData, res);
                return 1;
              }
            }

            return returnError(
                res, 'A választókerülethez nem tartozik képviselő.');
          });
        } else {
          return returnError(
              res, 'Hiba történt a képviselőadatok lekérése közben.');
        }
      });
}

function getRepData(id, districtData, res) {
  request.get(
      {
        url:
            'http://www.parlament.hu/cgi-bin/web-api/kepviselo.cgi?access_token=' +
            apiKeys.PARLIAMENT_API_KEY + '&p_azon=' + id
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          parseString(body, function(err, result) {
            var ret_object = {};

            ret_object.status = 'OK';
            ret_object.details = {
              name: result.kepviselo.nev[0].replace('\n', ''),
              district: {county: districtData[0], district: districtData[1]},
              photo: result.kepviselo.fenykep[0].replace('\n', ''),
              email: result.kepviselo.email[0].replace('\n', ''),
              resume: result.kepviselo.oneletrajz[0].replace('\n', ''),
              website: result.kepviselo.honlap[0].replace('\n', '')
            };

            res.json(ret_object);
          });
        } else {
          return returnError(res, 'Hiba történt a képviselő adatainak lekérése közben.');
        }
      });
}

function returnError(res, msg) {
  res.json({status: 'ERR', message: msg});
}

module.exports = {findRep};