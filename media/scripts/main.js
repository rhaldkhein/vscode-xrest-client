/* eslint-disable curly */
(function ($) {

  const reImage = /image\/.+/i;
  const reJson = /.+\/json.+/i;

  const headers = JSON.parse($('.data-res-headers').text());
  const jsonDepth = 2;
  const jsonOptions = {
    animateOpen: false,
    animateClose: false
  };

  let raw = false;


  /**
   * Functions
   */

  function displayRaw(data) {
    $('.tab-body > div').text(data);
  }

  function displayJson(data) {
    // Display formatted JSON
    try {
      const jsonFormatter = new JSONFormatter(
        JSON.parse(data),
        jsonDepth,
        jsonOptions
      );
      $('.tab-body > div').replaceWith(jsonFormatter.render());
      return true;
    } catch (error) {
      return false;
    }
  }

  function displayXml(data) {
    return false;
  }

  function displayImage(data) {
    $('.tab-body > div').text('Display of image is not supported yet.');
    return true;
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
      default:
        const data = $('.data-' + tabName).text();
        if (!raw) {

          if (tabName === 'res-body' && reImage.test(headers['content-type'])) {
            displayImage(data);
            $('.tab-body').addClass('db');
            break;
          }

          // if (data.startsWith('<')) {
          //   // Try to display XML/HTML
          //   if (displayXml(data)) break;
          // } else {
          //   // Try to display formatted JSON
          //   if (displayJson(data)) break;
          // }

        }
        displayRaw(data);
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
