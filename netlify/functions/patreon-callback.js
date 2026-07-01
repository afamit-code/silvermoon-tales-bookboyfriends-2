exports.handler = async function (event) {
  const code = event.queryStringParameters && event.queryStringParameters.code;

  // Use the SAME redirect_uri that patreon-login.js sent to Patreon.
  // These must match exactly or the token exchange will fail / behave inconsistently.
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  // Relative redirects — always stay on whatever domain actually served this request.
  // No more hardcoded netlify.app URL to fall out of sync.
  const errorRedirect = { statusCode: 302, headers: { Location: "/?patreon=error" } };
  const notMemberRedirect = { statusCode: 302, headers: { Location: "/?patreon=notmember" } };

  if (!code) {
    return errorRedirect;
  }

  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
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
      return errorRedirect;
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
    let bestTier = null;
    let bestRank = 0;

    if (userId === CREATOR_ID) {
      bestTier = "bonded";
      console.log("Creator — Bonded access");
    } else {
      const included = identityData.included || [];
      const isActive = included.some(i =>
        i.type === "member" && i.attributes?.patron_status === "active_patron"
      );
      if (!isActive) {
        return notMemberRedirect;
      }
      included.forEach(item => {
        if (item.type === "tier" && TIER_RANK[item.id] && TIER_RANK[item.id] > bestRank) {
          bestRank = TIER_RANK[item.id];
          bestTier = TIER_NAME[item.id];
        }
      });
      included.filter(i => i.type === "member").forEach(member => {
        (member.relationships?.currently_entitled_tiers?.data || []).forEach(t => {
          if (TIER_RANK[t.id] && TIER_RANK[t.id] > bestRank) {
            bestRank = TIER_RANK[t.id];
            bestTier = TIER_NAME[t.id];
          }
        });
      });
      if (!bestTier) {
        return notMemberRedirect;
      }
    }

    console.log("SUCCESS - userTier:", bestTier, "userName:", userName);

    const session = {
      token: accessToken.substring(0, 30),
      name: userName,
      tier: bestTier,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    const sessionJson = JSON.stringify(session);
    const sessionEncoded = Buffer.from(sessionJson).toString('base64');

    // Set session as a cookie AND return HTML that saves to localStorage
    // Cookie survives any redirect on same domain
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Prevent browsers / preload systems from caching or re-firing this response
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        // Set cookie that the main page can read
        'Set-Cookie': `sm_session_b64=${sessionEncoded}; Path=/; Max-Age=604800; SameSite=Lax`
      },
      body: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Silvermoon Tales</title>
<style>
body{margin:0;background:#060710;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;font-family:Georgia,serif;}
.moon{width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f0f4ff,#8a9dc0);box-shadow:0 0 30px rgba(200,212,232,0.5);}
p{color:#c8d4e8;font-style:italic;font-size:16px;}
</style>
</head>
<body>
<div class="moon"></div>
<p>Welcome, ${userName}...</p>
<script>
// Save session every possible way before redirecting
var session = ${JSON.stringify(session)};
try { localStorage.setItem('sm_session', JSON.stringify(session)); } catch(e) { console.log('ls error', e); }
try { sessionStorage.setItem('sm_session', JSON.stringify(session)); } catch(e) {}
// Redirect to home - session cookie also set server-side as backup
window.location.replace('/');
</script>
</body>
</html>`
    };

  } catch (err) {
    console.error("Callback error:", err);
    return errorRedirect;
  }
};
