$(function() {
  var successHandler = function() { console.log('A OK'); };

  function printError(msg) {
    $('#input-error').html(msg);
    $('#input-error').show(200);
  }

  $('#input-error').hide();
  $('#fetch-data')
      .click(function(event) {
        var address = $('#address').val();
        var city = $('#city').val();
        var postcode = $('#postcode').val();

        if (!address || !city || !postcode) {
          printError('Minden mezőt ki kell tölteni.');
          return 1;
        }

        if (postcode < 1000 || postcode > 9999 || !$.isNumeric(postcode)) {
          printError('Az irányítószám nem megfelelő.');
          return 1;
        }

        $.ajax({
          url: '/get-details/',
          type: 'POST',
          data: JSON.stringify(
              {'address': address, 'city': city, 'postcode': postcode}),
          contentType: 'application/json',
          dataType: 'json',
          success: successHandler,
          error: function() {
            printError('Hiba történt. Próbálja meg újra néhány perc múlva.');
          }
        });

        $('#input-error').hide(200);
      });
});