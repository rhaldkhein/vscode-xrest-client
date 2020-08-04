
/**
 * This request should have `Authorization: Bearer XXX`
 * if `get-bearer.req.js` was executed first. 
 * Otherwise, empty.
 * 
 * The injection of authorization is handled in `_auth.rc.js`
 */

exports.get = {
  url: '/todos/1'
}
