const crypto = require("crypto");

function createAccessToken(secret) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = JSON.stringify({ access: true, expiresAt });
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = "https://silvermoontalesbookboyfriends.netlify.app";
  const redirectUri = siteUrl + "/.netlify/functions/patreon-callback";

  if (!code) {
    return {
      statusCode: 302,
      headers: { Location: siteUrl + "/?patreon=error" }
    };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const allowedTierId = process.env.PATREON_ALLOWED_TIER_ID;

  try {
    // Step 1: Exchange code for access token
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
      return {
        statusCode: 302,
        headers: { Location: siteUrl + "/?patreon=error" }
      };
    }

    const accessToken = tokenData.access_token;

    // Step 2: Get identity and memberships
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
      console.error("Identity fetch failed:", JSON.stringify(identityData));
      return {
        statusCode: 302,
        headers: { Location: siteUrl + "/?patreon=error" }
      };
    }

    // Get user name
    const userName =
      identityData.data &&
      identityData.data.attributes &&
      identityData.data.attributes.full_name
        ? identityData.data.attributes.full_name
        : "Member";

    const included = identityData.included || [];

    // Check patron status — allow active and former_patron
    // (creators show as former_patron on their own page)
    const isActiveMember = included.some(
      (item) =>
        item.type === "member" &&
        item.attributes &&
        (item.attributes.patron_status === "active_patron" ||
         item.attributes.patron_status === "former_patron")
    );

    // Check tier — if PATREON_ALLOWED_TIER_ID is set, verify they have it
    const hasTier = allowedTierId
      ? included.some(
          (item) => item.type === "tier" && item.id === allowedTierId
        )
      : true;

    if (!isActiveMember || !hasTier) {
      console.log("Access denied — isActiveMember:", isActiveMember, "hasTier:", hasTier);
      return {
        statusCode: 302,
        headers: { Location: siteUrl + "/?patreon=error" }
      };
    }

    // Step 3: Grant access
    const accessCookie = createAccessToken(clientSecret);

    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": `smt_patreon_access=${accessCookie}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
        Location: siteUrl + "/?patreon=success&name=" + encodeURIComponent(userName)
      }
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return {
      statusCode: 302,
      headers: { Location: siteUrl + "/?patreon=error" }
    };
  }
};
