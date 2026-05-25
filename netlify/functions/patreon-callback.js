exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const siteUrl = "https://silvermoontalesbookboyfriends.netlify.app";
  const redirectUri = siteUrl + "/.netlify/functions/patreon-callback";

  if (!code) {
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;

  // Tier hierarchy — higher index = higher tier
  const TIER_RANK = { "26633221": 1, "28589346": 2, "28589553": 3 };
  const TIER_NAME = { "26633221": "silvermoon", "28589346": "starfall", "28589553": "bonded" };
  const CREATOR_ID = "182538518";

  try {
    const tokenResponse = await fetch("https://www.patreon.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, grant_type: "authorization_code",
        client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", JSON.stringify(tokenData));
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
    }

    const accessToken = tokenData.access_token;
    const identityResponse = await fetch(
      "https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers&fields%5Buser%5D=full_name,email&fields%5Bmember%5D=patron_status&fields%5Btier%5D=title,amount_cents",
      { headers: { Authorization: "Bearer " + accessToken } }
    );

    const identityData = await identityResponse.json();
    console.log("PATREON IDENTITY:", JSON.stringify(identityData, null, 2));

    const userId = identityData.data?.id;
    const userName = identityData.data?.attributes?.full_name || "Member";

    // Creator bypass
    if (userId === CREATOR_ID) {
      console.log("Creator — Bonded access");
      return buildSuccessResponse(siteUrl, userName, "bonded", accessToken);
    }

    const included = identityData.included || [];

    // Must be active patron
    const isActive = included.some(i =>
      i.type === "member" && i.attributes?.patron_status === "active_patron"
    );
    if (!isActive) {
      console.log("Not an active patron");
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
    }

    // Find HIGHEST tier the user has — important for members with multiple tiers
    let bestTier = null;
    let bestRank = 0;

    // Check all tier objects in included
    included.forEach(item => {
      if (item.type === "tier" && TIER_RANK[item.id]) {
        if (TIER_RANK[item.id] > bestRank) {
          bestRank = TIER_RANK[item.id];
          bestTier = TIER_NAME[item.id];
        }
      }
    });

    // Also check via member relationships (belt and braces)
    included.filter(i => i.type === "member").forEach(member => {
      (member.relationships?.currently_entitled_tiers?.data || []).forEach(t => {
        if (TIER_RANK[t.id] && TIER_RANK[t.id] > bestRank) {
          bestRank = TIER_RANK[t.id];
          bestTier = TIER_NAME[t.id];
        }
      });
    });

    if (!bestTier) {
      console.log("No matching tier found");
      return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=notmember" } };
    }

    console.log("SUCCESS - userTier:", bestTier, "userName:", userName);
    return buildSuccessResponse(siteUrl, userName, bestTier, accessToken);

  } catch (err) {
    console.error("Callback error:", err);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};

function buildSuccessResponse(siteUrl, userName, tier, accessToken) {
  const session = {
    token: accessToken.substring(0, 30),
    name: userName,
    tier: tier,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Silvermoon Tales</title>
<style>body{margin:0;background:#060710;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;font-family:Georgia,serif;}
.moon{width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f0f4ff,#8a9dc0);box-shadow:0 0 30px rgba(200,212,232,0.5);}
p{color:#c8d4e8;font-style:italic;font-size:16px;}</style>
</head><body>
<div class="moon"></div>
<p>Welcome, ${userName}...</p>
<script>
var session = ${JSON.stringify(session)};
try { localStorage.setItem('sm_session', JSON.stringify(session)); } catch(e){}
try { sessionStorage.setItem('sm_session', JSON.stringify(session)); } catch(e){}
window.location.href = '/?patreon=success&name=${encodeURIComponent(userName)}&tier=${tier}&t=${accessToken.substring(0,20)}';
</script>
</body></html>`
  };
}
