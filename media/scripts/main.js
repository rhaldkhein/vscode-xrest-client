/* eslint-disable curly */
(function ($) {

  const isImage = /image\/.+/i;
  const isJson = /.+\/json.+/i;

  const contentType = $('.res-content-type').val();
  const jsonDepth = 2;
  const jsonOptions = {
    animateOpen: false,
    animateClose: false
  };

  let raw = false;

  /**
   * Functions
   */

  function writeRaw(data) {
    $('.tab-raw > div').text(data);
  }

  function writeJson(data) {
    // Display formatted JSON
    try {
      const jsonFormatter = new JSONFormatter(
        JSON.parse(data),
        jsonDepth,
        jsonOptions
      );
      $('.tab-body > div').replaceWith(jsonFormatter.render());
    } catch (error) {
      // Fallback to raw text display
      $('.tab-body > div').text(data);
    }
  }

  function writeXml(data) {
    // #TODO to implement
    $('.tab-body > div').text('Display of XML/HTML is not supported yet.');
  }

  function writeImage(data) {
    // #TODO to implement
    $('.tab-body > div').text('Display of image is not supported yet.');
  }

  /**
   * Handlers
   */

  function tabButtonClickHandler(e) {

    const $target = $(e.target);
    const tabName = $target.data('tab');

    // Update class to tab buttons
    $('.tab-button').removeClass('selected');
    $target.addClass('selected');

    // Show current tab
    $('.tab').removeClass('db');
    switch (tabName) {
      case 'req-headers':
      case 'res-headers':
        $('.tab-' + tabName).addClass('db');
        break;
      case 'req-params':
      case 'req-body':
      case 'res-body':
      default:
        const data = $('.data-' + tabName).text();

        if (raw) {
          writeRaw(data);
          $('.tab-raw').addClass('db');
          break;
        }

        if (tabName === 'res-body') {

          if (isImage.test(contentType)) {
            writeImage(data);
          } else if (isJson.test(contentType)) {
            writeJson(data);
          } else {
            writeRaw(data);
          }

        } else {

          if (data.startsWith('<')) {
            // Try to display XML/HTML
            writeXml(data);
          } else {
            // Try to display formatted JSON
            writeJson(data);
          }

        }

        $('.tab-body').addClass('db');
    }

  }

  function rawButtonClickHandler(e) {
    if (!raw) {
      $rawButton.addClass('selected');
      raw = true;
    } else {
      $rawButton.removeClass('selected');
      raw = false;
    }
    $('.tab-button.selected').trigger('click');
  }

  /**
   * Tabs
   */
  $tabButtons = $('.tab-button');
  $tabButtons.on('click', tabButtonClickHandler);
  $tabButtons.eq(3).trigger('click');

  $rawButton = $('.toggle-raw');
  $rawButton.on('click', rawButtonClickHandler);

})($);
