const crypto = require("crypto");

function createAccessToken() {
  const secret = process.env.PATREON_CLIENT_SECRET;
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;

  const payload = JSON.stringify({
    access: true,
    expiresAt
  });

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const token = Buffer.from(
    JSON.stringify({
      payload,
      signature
    })
  ).toString("base64");

  return token;
}

exports.handler = async function (event) {
  const code = event.queryStringParameters.code;

  if (!code) {
    return {
      statusCode: 400,
      body: "Missing Patreon authorization code."
    };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const redirectUri = process.env.PATREON_REDIRECT_URI;
  const allowedTierId = process.env.PATREON_ALLOWED_TIER_ID;
  const siteUrl =
    process.env.SITE_URL ||
    "https://silvermoontalesbookboyfriends.netlify.app";

  try {
    const tokenResponse = await fetch(
      "https://www.patreon.com/api/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          code,
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri
        })
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token error:", tokenData);
      return {
        statusCode: 401,
        body: "Could not authenticate with Patreon."
      };
    }

    const accessToken = tokenData.access_token;

    const identityUrl =
      "https://www.patreon.com/api/oauth2/v2/identity" +
      "?include=memberships,memberships.currently_entitled_tiers" +
      "&fields%5Bmember%5D=patron_status" +
      "&fields%5Btier%5D=title,amount_cents";

    const identityResponse = await fetch(identityUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const identityData = await identityResponse.json();

    console.log("PATREON IDENTITY DATA:", JSON.stringify(identityData, null, 2));

    if (!identityResponse.ok) {
      console.error("Identity error:", identityData);
      return {
        statusCode: 401,
        body: "Could not verify Patreon membership."
      };
    }

    const included = identityData.included || [];

    const activeMembership = included.find(
      (item) =>
        item.type === "member" &&
        item.attributes &&
        item.attributes.patron_status === "active_patron"
    );

    const entitledTier = included.find(
      (item) =>
        item.type === "tier" &&
        item.id === allowedTierId
    );

    if (!activeMembership || !entitledTier) {
      return {
        statusCode: 302,
        headers: {
          Location: `${siteUrl}/locked`
        }
      };
    }

    const accessCookie = createAccessToken();

    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": `smt_patreon_access=${accessCookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
        Location: `${siteUrl}/`
      }
    };
  } catch (error) {
    console.error("Patreon callback error:", error);

    return {
      statusCode: 500,
      body: "Something went wrong while checking Patreon access."
    };
  }
};