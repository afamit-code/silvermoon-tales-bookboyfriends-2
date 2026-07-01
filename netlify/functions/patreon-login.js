exports.handler = async function () {
  const clientId = process.env.PATREON_CLIENT_ID;

  // Read from env var — must match whatever patreon-callback.js uses too.
  // Update PATREON_REDIRECT_URI in Netlify (not this file) if the domain ever changes again.
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  const scopes = [
    "identity",
    "identity[email]",
    "identity.memberships"
  ].join(" ");
  const authUrl =
    "https://www.patreon.com/oauth2/authorize" +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}`;
  return {
    statusCode: 302,
    headers: {
      Location: authUrl
    }
  };
};
