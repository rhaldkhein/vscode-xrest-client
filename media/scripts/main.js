/* eslint-disable curly */
(function ($) {

  const debug = true;
  const reqFormatter = $('.req-formatter').val();
  const resFormatter = $('.res-formatter').val();
  const jsonDepth = 2;
  const jsonOptions = {
    animateOpen: false,
    animateClose: false
  };

  let $log;
  let raw = false;

  /**
   * Functions
   */

  function log(str) {
    if (!debug) return;
    if (!$log) $log = $('.logger > div');
    $log.append(`<div>${str}</div>`);
  }

  function writeRaw(data) {
    $('.tab-body > div').text(data);
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

  function writeImage(data) {
    // #TODO to implement
    $('.tab-body > div').text('Display of image is not supported yet.');
  }

  function writeXml(data) {
    // #TODO to implement
    // $('.tab-body > div').text('Display of XML is not supported yet.');
    $('.tab-body > div').text(data);
  }

  function writeHtml(data) {
    // #TODO to implement
    // $('.tab-body > div').text('Display of HTML is not supported yet.');
    $('.tab-body > div').text(data);
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

        if (raw) {
          $('.tab-raw-' + tabName).addClass('db');
          break;
        }

        const data = $('.tab-raw-' + tabName).text();

        if (tabName === 'res-body') {

          if (resFormatter === 'json') {
            writeJson(data);
          } else if (resFormatter === 'image') {
            writeImage(data);
          } else if (resFormatter === 'xml') {
            writeXml(data);
          } else if (resFormatter === 'html') {
            writeHtml(data);
          } else {
            writeRaw(data);
          }

        } else {

          if (reqFormatter === 'json') {
            writeJson(data);
          } else {
            writeRaw(data);
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
  const $tabButtons = $('.tab-button');
  $tabButtons.on('click', tabButtonClickHandler);
  $tabButtons.eq(3).trigger('click');

  const $rawButton = $('.toggle-raw');
  $rawButton.on('click', rawButtonClickHandler);

})($);
