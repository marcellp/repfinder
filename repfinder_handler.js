'use strict';

var request = require('request');
var turf = require('turf');
var fs = require('fs');
var path = require('path');
var apiKeys = require('./api-keys');
var parseString = require('xml2js').parseString;

var findRep = function(req, res) {
  // Verify the submitted content.
  if (!req.body.address || !req.body.city || !req.body.postcode) {
    returnError(res, 'Minden mezőt ki kell tölteni.');
    return 1;
  }

  if (req.body.postcode < 1000 || req.body.postcode > 9999 ||
      isNaN(req.body.postcode)) {
    returnError(res, 'Az irányítószám nem megfelelő.');
    return 1;
  }

  // Verify the CAPTCHA.
  request.post(
      {
        url: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: apiKeys.RECAPTCHA_API_KEY,
          response: req.body.captcha
        },
        json: true
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            if (!body.success) {
              returnError(
                  res, 'Nem oldotta meg megfelelően a biztonsági kérdést.');
            } else {
              geocodeAddress(
                  req.body.postcode + ' ' + req.body.city + ', ' +
                      req.body.address,
                  res);
            }
          } catch (err) {
            returnError(
                res,
                'A szerver nem tudta megerősíteni a biztonsági kérdésre adott választ.');
          }
        } else {
          returnError(
              res, 'Hiba történt a biztonsági kérdés ellenőrzése során.');
        }
      });
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
          var addressComponents;

          // Let's go through each address component until we find
          // the country. If the address the user entered is not
          // in Hungary, return an error.
          try {
            addressComponents = geocodeObj.results[0].address_components;
          } catch (err) {
            return returnError(
                res, 'Hiba történt a címadatok vizsgálata közben.');
          }

          for (let comp of addressComponents) {
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
            if (err) {
              return returnError(
                  res, 'Hiba történt képviselőadatok értelmezése közben.');
            }

            // This is an array with all reps in it.
            try {
              var rep_data = result.kepviselok.kepviselo;
              for (var i = 0; i < rep_data.length; i++) {
                // Find the representative corresponding to the county & the
                // area
                // within the county.
                if (rep_data[i].$.vmegye === districtData[0] &&
                    rep_data[i].$.vkorzet === districtData[1]) {
                  getRepData(rep_data[i].$.p_azon, districtData, res);
                  return 1;
                }
              }
            } catch (err) {
              return returnError(
                  res, 'A képviselőadatok jelenleg nem elérhetőek.');
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
            if (err) {
              return returnError(
                  res,
                  'Hiba történt a képviselő adatainak értelmezése közben.');
            }

            var retObject = {};

            try {
              var repData = result.kepviselo;
            } catch (err) {
              return returnError(
                  res, 'A képviselő adatai jelenleg nem elérhetőek.');
            }

            retObject.status = 'OK';
            retObject.details = {
              name: repData.nev[0].replace('\n', ''),
              district: {county: districtData[0], district: districtData[1]},
              photo: repData.fenykep[0].replace('\n', ''),
              email: repData.email[0].replace('\n', ''),
              resume: repData.oneletrajz[0].replace('\n', ''),
              website: repData.honlap[0].replace('\n', '')
            };

            res.json(retObject);
          });
        } else {
          return returnError(
              res, 'Hiba történt a képviselő adatainak lekérése közben.');
        }
      });
}

function returnError(res, msg) {
  res.json({status: 'ERR', message: msg});
}

module.exports = {findRep};