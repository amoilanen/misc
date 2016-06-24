/*
 * Running the script:
 *   node_modules/casperjs/bin/casperjs --web-security=no fetch.price.js JavaScript
 */

module.exports = {
  'Page title is correct': function (test) {
    test
      .open('http://google.com')
      .assert.title().is('Google', 'It has title')
      .done();
  }
};