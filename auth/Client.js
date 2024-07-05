const uuid = require("uuid");
const utils = require("./utils");
function loader(moduleOptions) {
  /**
   * Attempts to authenticate a user.
   * @param  {Object}   options Config object
   * @param  {Function} cb      Callback
   */
  async function auth(options) {
    if (options.token === null) delete options.token;
    else options.token = options.token ?? uuid.v4();

    options.agent = options.agent ?? "Minecraft";

    if (options.provider === "easymc") {
      return await utils.call(moduleOptions?.host, "redeem", {
        token: options.alt,
        client: "mod-1.18",
      });
    } else if (options.provider === "thealtening") {
      return await utils.call(moduleOptions?.host, "authenticate", {
        username: options.alt,
        password: options.password,
      });
    }
  }
  /**
   * Refreshes a accessToken.
   * @param  {String}   accessToken Old Access Token
   * @param  {String}   clientToken Client Token
   * @param  {String=false}   requestUser Whether to request the user object
   * @param  {Function} cb     (err, new token, full response body)
   */

  async function refresh(accessToken, clientToken, requestUser) {
    const data = await utils.call(
      moduleOptions?.host ?? defaultHost,
      "refresh",
      { accessToken, clientToken, requestUser: requestUser ?? false },
      moduleOptions?.agent
    );
    if (data.clientToken !== clientToken)
      throw new Error("clientToken assertion failed");
    return [data.accessToken, data];
  }
  /**
   * Validates an access token
   * @param  {String}   accessToken Token to validate
   * @param  {Function} cb    (error)
   */
  async function validate(accessToken) {
    return await utils.call(
      moduleOptions?.host,
      "validate",
      { accessToken },
      moduleOptions?.agent
    );
  }

  /**
   * Invalidates all access tokens.
   * @param  {String}   username User's user
   * @param  {String}   password User's pass
   * @param  {Function} cb   (error)
   */
  async function signout(username, password) {
    return await utils.call(
      moduleOptions?.host ?? defaultHost,
      "signout",
      { username, password },
      moduleOptions?.agent
    );
  }

  async function invalidate(accessToken, clientToken) {
    return await utils.call(
      moduleOptions?.host ?? defaultHost,
      "invalidate",
      { accessToken, clientToken },
      moduleOptions?.agent
    );
  }

  return {
    auth: utils.callbackify(auth, 1),
    refresh: utils.callbackify(refresh, 3),
    signout: utils.callbackify(signout, 1),
    validate: utils.callbackify(validate, 2),
    invalidate: utils.callbackify(invalidate, 2),
  };
}

module.exports = loader;
