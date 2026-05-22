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

    const userId = identityData.data && identityData.data.id;
    const userName = identityData.data &&
      identityData.data.attributes &&
      identityData.data.attributes.full_name
        ? identityData.data.attributes.full_name
        : "Member";

    let userTier = null;

    // Creator bypass
    if (userId === CREATOR_ID) {
      console.log("Creator account — granting Bonded access");
      userTier = "bonded";
    } else {
      const included = identityData.included || [];
      const isActiveMember = included.some(function (item) {
        return item.type === "member" &&
          item.attributes &&
          item.attributes.patron_status === "active_patron";
      });

      if (!isActiveMember) {
        console.log("Not an active patron");
        return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
      }

      // Find tier from included tiers
      included.forEach(function (item) {
        if (item.type === "tier" && TIER_MAP[item.id]) {
          userTier = TIER_MAP[item.id];
        }
      });

      // Also check via member relationships
      if (!userTier) {
        included.filter(i => i.type === "member").forEach(function (member) {
          const tiers = member.relationships &&
            member.relationships.currently_entitled_tiers &&
            member.relationships.currently_entitled_tiers.data || [];
          tiers.forEach(function (t) {
            if (TIER_MAP[t.id]) userTier = TIER_MAP[t.id];
          });
        });
      }

      if (!userTier) {
        console.log("No matching tier found");
        return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
      }
    }

    console.log("isActiveMember: true userTier:", userTier);

    // Build session data
    const sessionData = {
      token: accessToken,
      name: userName,
      tier: userTier,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const sessionJson = encodeURIComponent(JSON.stringify(sessionData));

    // Return an HTML page that saves to localStorage and redirects
    // This is more reliable than URL params which can get lost
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Logging in...</title></head>
<body>
<script>
try {
  var session = ${JSON.stringify(sessionData)};
  localStorage.setItem('sm_session', JSON.stringify(session));
  console.log('Session saved:', session.name, session.tier);
} catch(e) {
  console.error('Could not save session', e);
}
window.location.href = '/';
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;color:#888">Logging you in...</p>
</body>
</html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};
