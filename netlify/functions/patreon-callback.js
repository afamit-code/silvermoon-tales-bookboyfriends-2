exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = "https://silvermoontalesbookboyfriends.netlify.app";
  const redirectUri = siteUrl + "/.netlify/functions/patreon-callback";

  if (!code) {
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;

  const TIER_MAP = {
    "26633221": "silvermoon",
    "28589346": "starfall",
    "28589553": "bonded"
  };
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

    const userId = identityData.data?.id;
    const userName = identityData.data?.attributes?.full_name || "Member";
    let userTier = null;

    if (userId === CREATOR_ID) {
      console.log("Creator account — granting Bonded access");
      userTier = "bonded";
    } else {
      const included = identityData.included || [];
      const isActiveMember = included.some(i =>
        i.type === "member" && i.attributes?.patron_status === "active_patron"
      );
      if (!isActiveMember) {
        return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
      }
      included.forEach(i => {
        if (i.type === "tier" && TIER_MAP[i.id]) userTier = TIER_MAP[i.id];
      });
      if (!userTier) {
        included.filter(i => i.type === "member").forEach(m => {
          (m.relationships?.currently_entitled_tiers?.data || []).forEach(t => {
            if (TIER_MAP[t.id]) userTier = TIER_MAP[t.id];
          });
        });
      }
      if (!userTier) {
        return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
      }
    }

    console.log("SUCCESS - userTier:", userTier, "userName:", userName);

    // Pass session as URL params — the index.html will read these
    // This is the most reliable method — no localStorage cross-origin issues
    const params = new URLSearchParams({
      patreon: 'success',
      name: userName,
      tier: userTier,
      t: accessToken.substring(0, 20) // partial token as session key
    });

    return {
      statusCode: 302,
      headers: {
        Location: siteUrl + '/?' + params.toString()
      }
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};
