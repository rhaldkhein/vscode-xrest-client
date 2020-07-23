(function ($) {

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

})($);
