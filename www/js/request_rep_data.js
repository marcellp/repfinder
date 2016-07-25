// Initialize reCaptcha widget.
var captchaWidgetID;
var onLoadCaptcha = function() {
  captchaWidgetID = grecaptcha.render('captcha', {
    'sitekey': '6Ld79SUTAAAAALku1DvlluFnyHOZhPJHi6JgV9V4',
    'theme': 'light',
    'callback': 'verifyCallback'
  });
};

$(function() {

  // Show the appropriate details to the user.
  var successHandler = function(data) {
    if (data.status !== 'OK') {
      printError(data.message);
      return 1;
    }

    $('#form').hide();

    $('#name').html(data.details.name);
    $('#photo').attr('src', data.details.photo);

    $('#email-address').html(data.details.email);
    $('#email-address').attr('href', 'mailto:' + data.details.email);

    $('#resume').attr('href', data.details.resume);

    $('#website').attr('href', data.details.website);
    $('#website').html(data.details.website);

    $('#district-data')
        .html(
            data.details.district.county + ', ' +
            data.details.district.district + '. sz. választókerület');

    $('#results').show();
  };

  // Show the error box with a set error message.
  function printError(msg) {
    $('#input-error').html(msg);
    $('#input-error').show(200);
    grecaptcha.reset();
  }

  // Hide all elements that are not necessary.
  $('#input-error').hide();
  $('#results').hide();

  // Check for any client-side errors and send an ajax request to the server.
  $('#fetch-data')
      .click(function(event) {
        var address = $('#address').val();
        var city = $('#city').val();
        var postcode = $('#postcode').val();
        var captchaResponse = grecaptcha.getResponse(captchaWidgetID);

        if (!address || !city || !postcode) {
          printError('Minden mezőt ki kell tölteni.');
          return 1;
        }

        if (!captchaResponse) {
          printError('Nem válaszolt a biztonsági kérdésre.');
          return 1;
        }

        if (postcode < 1000 || postcode > 9999 || !$.isNumeric(postcode)) {
          printError('Az irányítószám nem megfelelő.');
          return 1;
        }

        $.ajax({
          url: '/get-details/',
          type: 'POST',
          data: JSON.stringify({
            'address': address,
            'city': city,
            'postcode': postcode,
            'captcha': captchaResponse
          }),
          contentType: 'application/json',
          dataType: 'json',
          success: successHandler,
          error: function() {
            printError('Hiba történt. Próbálja meg újra néhány perc múlva.');
          }
        });

        $('#input-error').hide(200);
      });

  $('#back-to-input')
      .click(function(event) {
        $('#results').hide();
        $('#form').show();
        grecaptcha.reset();
      });
});