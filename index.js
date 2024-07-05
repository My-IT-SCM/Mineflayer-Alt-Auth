const authenticator = require("./auth/Client");
const fs = require("fs");
const uuid = require("./auth/uuid");
const path = require("path");

module.exports = function authFlow({
  cache = false,
  cacheFile = path.join(process.cwd(), "./cache.json"),
  provider,
}) {
  return async function (client, options) {
    // If the cache option is enabled, and the cache is available, load the cache.
    if (cache === true && fs.existsSync(cacheFile)) {
      try {
        options.cacheSession = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      } catch (err) {
        fs.writeFileSync(cacheFile, "[]", "utf-8");
        options.cacheSession = [];
      }
    }

    // Assign host and session server based on the provider.
    let host;
    if (provider === "easymc") {
      host = "https://api.easymc.io/v1/token";
      options.sessionServer = "https://sessionserver.easymc.io";
    } else if (provider === "thealtening") {
      host = "http://authserver.thealtening.com";
      options.sessionServer = "http://sessionserver.thealtening.com";
    } else {
      throw new Error(`Provider "${provider}" is not supported.`);
    }

    const authClient = authenticator({ agent: options.agent, host: host });
    options.haveCredentials = !!options.username;

    if (options.haveCredentials) {
      // make a request to get the case-correct username before connecting.
      const cb = function (err, response, skipWrite) {
        if (err) return client.emit("error", err);

        // Determine if the response has a selected profile
        const hasSelectedProfile = !!response?.selectedProfile;

        // Use existing response as session if selectedProfile exists, otherwise create a new session
        const session = hasSelectedProfile
          ? response
          : {
              accessToken: response.session,
              selectedProfile: {
                id: response.uuid.replaceAll("-", ""),
                name: response.mcName,
              },
              availableProfile: [
                {
                  id: response.uuid.replaceAll("-", ""),
                  name: response.mcName,
                },
              ],
            };

        if (cache === true && response && !skipWrite) {
          fs.writeFileSync(
            cacheFile,
            JSON.stringify({ ...session, alt: options.username }, null, 4),
            "utf-8"
          );
        }

        // Set client and options properties
        client.session = session;
        client.username = session.selectedProfile.name;
        options.accessToken = session.accessToken;

        client.emit("session", session);
        options.connect(client);
      };

      if (options.cacheSession) {
        // If session was cached, validate the session
        if (!options.skipValidation) {
          authClient.validate(options.cacheSession.accessToken, function (err) {
            if (!err) cb(null, options.cacheSession);
          });
        } else {
          // trust that the provided session is a working one
          cb(null, options.cacheSession, true);
        }
      } else {
        //If session was not cached, authenticate the user
        authClient.auth(
          {
            alt: options.username,
            auth: options.auth,
            provider,
          },
          cb
        );
      }
    } else {
      // assume the server is in offline mode and just go for it.
      client.username = options.username;
      client.uuid = uuid.nameToMcOfflineUUID(client.username);
      options.auth = "offline";
      options.connect(client);
    }
  };
};
