/* eslint-disable curly */
(function ($) {

  const isImage = /image\/.+/i;
  const isJson = /.+\/json.*/i;
  const isXml = /.+\/xml.*/i;
  const isHtml = /.+\/html.*/i;

  const $body = $('.tab-body > div');
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
    $body.text(data);
  }

  function writeJson(data) {
    // Display formatted JSON
    try {
      const jsonFormatter = new JSONFormatter(
        JSON.parse(data),
        jsonDepth,
        jsonOptions
      );
      $body.replaceWith(jsonFormatter.render());
    } catch (error) {
      // Fallback to raw text display
      $body.text(data);
    }
  }

  function writeImage(data) {
    // #TODO to implement
    $body.text('Display of image is not supported yet.');
  }

  function writeXml(data) {
    // #TODO to implement
    // $body.text('Display of XML is not supported yet.');
    $body.text(data);
  }

  function writeHtml(data) {
    // #TODO to implement
    // $body.text('Display of HTML is not supported yet.');
    $body.text(data);
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

        if (!raw) {
          // User want to display formatted data

          if (tabName === 'res-body') {

            if (isJson.test(contentType)) {
              writeJson(data);
            } else if (isImage.test(contentType)) {
              writeImage(data);
            } else if (isXml.test(contentType)) {
              writeXml(data);
            } else if (isHtml.test(contentType)) {
              writeHtml(data);
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

        } else {
          // Display raw data
          writeRaw(data);
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
