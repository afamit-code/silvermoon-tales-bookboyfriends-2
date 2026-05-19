exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = "https://silvermoontalesbookboyfriends.netlify.app";
  const redirectUri = siteUrl + "/.netlify/functions/patreon-callback";

  if (!code) {
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const allowedTierId = process.env.PATREON_ALLOWED_TIER_ID;

  try {
    const tokenResponse = await fetch("https://www.patreon.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", JSON.stringify(tokenData));
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
    }

    const accessToken = tokenData.access_token;

    const identityUrl =
      "https://www.patreon.com/api/oauth2/v2/identity" +
      "?include=memberships,memberships.currently_entitled_tiers" +
      "&fields%5Buser%5D=full_name,email" +
      "&fields%5Bmember%5D=patron_status" +
      "&fields%5Btier%5D=title,amount_cents";

    const identityResponse = await fetch(identityUrl, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    const identityData = await identityResponse.json();
    console.log("PATREON IDENTITY:", JSON.stringify(identityData, null, 2));

    if (!identityResponse.ok) {
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
    }

    const userName =
      identityData.data &&
      identityData.data.attributes &&
      identityData.data.attributes.full_name
        ? identityData.data.attributes.full_name
        : "Member";

    const included = identityData.included || [];

    // Active patrons only — no former members
    const isActiveMember = included.some(function(item) {
      return item.type === "member" &&
        item.attributes &&
        item.attributes.patron_status === "active_patron";
    });

    // Check tier if PATREON_ALLOWED_TIER_ID is set
    const hasTier = allowedTierId
      ? included.some(function(item) { return item.type === "tier" && item.id === allowedTierId; })
      : true;

    console.log("isActiveMember:", isActiveMember, "hasTier:", hasTier, "allowedTierId:", allowedTierId);

    if (!isActiveMember || !hasTier) {
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
    }

    return {
      statusCode: 302,
      headers: {
        Location: siteUrl + "/?patreon=success&name=" + encodeURIComponent(userName)
      }
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};
