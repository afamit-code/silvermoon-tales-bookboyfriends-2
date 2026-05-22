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

    const sessionData = {
      token: accessToken,
      name: userName,
      tier: userTier,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    // Use a redirect with session data in URL hash (not query params)
    // Hash is never sent to server so it persists through redirects
    const sessionB64 = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Silvermoon Tales — Logging in</title>
<style>body{background:#060710;color:#c8d4e8;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;margin:0;}
.moon{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f0f4ff,#c8d4e8 40%,#8a9dc0);box-shadow:0 0 40px rgba(200,212,232,0.4);}
p{font-style:italic;color:#6a7a94;font-size:16px;}
.err{color:#c47a8a;font-size:13px;}</style>
</head>
<body>
<div class="moon"></div>
<p>Welcome, ${userName}. Entering your world...</p>
<p class="err" id="err"></p>
<script>
(function(){
  var session = ${JSON.stringify(sessionData)};
  var saved = false;
  try {
    localStorage.setItem('sm_session', JSON.stringify(session));
    var test = localStorage.getItem('sm_session');
    if (test) saved = true;
  } catch(e) {
    document.getElementById('err').textContent = 'Storage error: ' + e.message;
  }
  if (saved) {
    setTimeout(function(){ window.location.href = '/'; }, 800);
  } else {
    document.getElementById('err').textContent = 'Could not save session. Please enable cookies/storage and try again.';
  }
})();
</script>
</body>
</html>`
    };

  } catch (error) {
    console.error("Patreon callback error:", error);
    return { statusCode: 302, headers: { Location: siteUrl + "/?patreon=error" } };
  }
};
