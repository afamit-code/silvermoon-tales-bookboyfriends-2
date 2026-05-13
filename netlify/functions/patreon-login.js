exports.handler = async function () {
  const clientId = process.env.PATREON_CLIENT_ID;
  
  // Hardcoded to the correct Netlify callback function
  const redirectUri = 'https://silvermoontalesbookboyfriends.netlify.app/.netlify/functions/patreon-callback';
  
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
