(function ($) {

  /**
   * Tabs
   */

  $tabButtons = $('.tab-button');
  $tabButtons.on('click', (e) => {
    const $target = $(e.target);
    const tabName = $target.data('tab');

    // Update class to tab buttons
    $('.tab-button').removeClass('selected');
    $target.addClass('selected');

    // Show current tab
    $('.tab').removeClass('db');
    $('.tab-' + tabName).addClass('db');
  });
  $tabButtons.eq(3).trigger('click');

  /**
   * JSON Formatting
   */

  const depth = 2;
  const opt = {
    animateOpen: false,
    animateClose: false
  };

  try {
    $params = $('.tab-req-params-json > div');
    const fmtr = new JSONFormatter(JSON.parse($params.text()), depth, opt);
    $params.replaceWith(fmtr.render());
  } catch (error) {
    // Not parsable
  }

  try {
    $reqBody = $('.tab-req-body-json > div');
    const fmtr = new JSONFormatter(JSON.parse($reqBody.text()), depth, opt);
    $reqBody.replaceWith(fmtr.render());
  } catch (error) {
    // Not parsable
  }

  try {
    const dataResBody = $('.data-res-body').text();
    const fmtr = new JSONFormatter(JSON.parse(dataResBody), depth, opt);
    $('.tab-res-body > div').replaceWith(fmtr.render());
  } catch (error) {
    // Not parsable
  }

})($);
