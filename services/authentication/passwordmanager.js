/**
 * Created by pratiksanglikar on 13/04/16.
 */
var Crypto = require('crypto');

/**
 * encrypts the password using the salt.
 * @param password
 * @returns {String}
 */
exports.encryptPassword = function (password) {
	var salt = "Bl@ckS@1t";
	var encryptedPassword = Crypto.createHash('sha1').update(password + salt).digest('hex');
	return encryptedPassword;
}