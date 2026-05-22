exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = "https://silvermoontalesbookboyfriends.netlify.app";
  const redirectUri = siteUrl + "/.netlify/functions/patreon-callback";

  if (!code) {
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;

  // All three tier IDs — Silvermoon, Starfall, Bonded
  const TIER_MAP = {
    "26633221": "silvermoon",
    "28589346": "starfall",
    "28589553": "bonded"
  };

  // Creator account — always gets Bonded access
  const CREATOR_ID = "182538518";

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

    const identityUrl = "https://www.patreon.com/api/oauth2/v2/identity"
      + "?include=memberships,memberships.currently_entitled_tiers"
      + "&fields%5Buser%5D=full_name,email"
      + "&fields%5Bmember%5D=patron_status"
      + "&fields%5Btier%5D=title,amount_cents";

    const identityResponse = await fetch(identityUrl, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    const identityData = await identityResponse.json();
    console.log("PATREON IDENTITY:", JSON.stringify(identityData, null, 2));

    if (!identityResponse.ok) {
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
    }

    const userId = identityData.data && identityData.data.id;
    const userName = identityData.data &&
      identityData.data.attributes &&
      identityData.data.attributes.full_name
        ? identityData.data.attributes.full_name
        : "Member";

    // ── CREATOR BYPASS ──────────────────────────────────────
    if (userId === CREATOR_ID) {
      console.log("Creator account detected — granting Bonded access");
      return {
        statusCode: 302,
        headers: {
          Location: siteUrl
            + "/?patreon=success"
            + "&name=" + encodeURIComponent(userName)
            + "&tier=bonded"
            + "&token=" + encodeURIComponent(accessToken)
        }
      };
    }

    // ── MEMBER CHECK ────────────────────────────────────────
    const included = identityData.included || [];

    // Check for active patron status
    const isActiveMember = included.some(function (item) {
      return item.type === "member" &&
        item.attributes &&
        item.attributes.patron_status === "active_patron";
    });

    // Find which tier they are on
    let userTier = null;
    included.forEach(function (item) {
      if (item.type === "tier" && TIER_MAP[item.id]) {
        userTier = TIER_MAP[item.id];
      }
    });

    // Also check memberships for tier via relationships
    if (!userTier) {
      const members = included.filter(function (item) { return item.type === "member"; });
      members.forEach(function (member) {
        const tiers = member.relationships &&
          member.relationships.currently_entitled_tiers &&
          member.relationships.currently_entitled_tiers.data || [];
        tiers.forEach(function (t) {
          if (TIER_MAP[t.id]) userTier = TIER_MAP[t.id];
        });
      });
    }

    console.log("isActiveMember:", isActiveMember, "userTier:", userTier);

    if (!isActiveMember || !userTier) {
      console.log("Access denied — not an active patron with a valid tier");
      return {
        statusCode: 302,
        headers: { Location: siteUrl + "/?patreon=notmember" }
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: siteUrl
          + "/?patreon=success"
          + "&name=" + encodeURIComponent(userName)
          + "&tier=" + userTier
          + "&token=" + encodeURIComponent(accessToken)
      }
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};
