(function() {
  // Inject Google Font
  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(font);

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = "\n#ec-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;font-family:'Manrope',sans-serif;}\n#ec-toggle{width:56px;height:56px;background:#202023;border-radius:50%;border:2px solid #a3d0c9;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;}\n#ec-toggle:hover{transform:scale(1.08);}\n#ec-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#a3d0c9;border-radius:50%;font-size:10px;font-weight:800;color:#202023;display:flex;align-items:center;justify-content:center;}\n#ec-panel{position:fixed;bottom:90px;right:24px;width:380px;height:560px;background:#eeeeee;border:1px solid #c8c8c8;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.2);display:none;flex-direction:column;overflow:hidden;z-index:99999;}\n#ec-panel.open{display:flex;}\n\n/* Email gate inside panel */\n#ec-gate{padding:28px 24px;display:flex;flex-direction:column;gap:12px;background:#eeeeee;flex:1;justify-content:center;}\n#ec-gate .ec-eyebrow{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#a3d0c9;font-weight:700;}\n#ec-gate h3{font-size:17px;font-weight:800;color:#202023;letter-spacing:-0.02em;line-height:1.2;}\n#ec-gate p{font-size:12px;color:#6a6a70;line-height:1.6;}\n#ec-gate input{padding:10px 12px;border:1px solid #c8c8c8;background:#fff;font-family:'Manrope',sans-serif;font-size:13px;color:#202023;outline:none;width:100%;}\n#ec-gate input:focus{border-color:#a3d0c9;}\n#ec-gate-btn{padding:12px;background:#202023;color:#a3d0c9;border:none;font-family:'Manrope',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;width:100%;}\n#ec-gate-btn:hover{background:#a3d0c9;color:#202023;}\n#ec-gate-err{font-size:11px;color:#c0392b;display:none;}\n#ec-gate-link{font-size:11px;color:#6a6a70;text-align:center;}\n#ec-gate-link a{color:#a3d0c9;font-weight:600;text-decoration:none;}\n\n/* Expired screen */\n#ec-expired{padding:28px 24px;display:none;flex-direction:column;gap:14px;background:#eeeeee;flex:1;justify-content:center;text-align:center;}\n#ec-expired .ec-lock{font-size:36px;margin-bottom:4px;}\n#ec-expired h3{font-size:16px;font-weight:800;color:#202023;}\n#ec-expired p{font-size:12px;color:#6a6a70;line-height:1.65;}\n#ec-upgrade-btn{padding:12px;background:#a3d0c9;color:#202023;border:none;font-family:'Manrope',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;width:100%;}\n#ec-upgrade-btn:hover{background:#202023;color:#a3d0c9;}\n\n/* Chat header */\n#ec-header{background:#202023;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #a3d0c9;flex-shrink:0;}\n#ec-header .ec-av{width:30px;height:30px;background:#a3d0c9;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}\n#ec-header .ec-title{font-size:12px;font-weight:700;color:#fff;}\n#ec-header .ec-sub{font-size:10px;color:#a3d0c9;font-weight:500;}\n#ec-close{margin-left:auto;background:none;border:none;color:#6a6a70;font-size:18px;cursor:pointer;padding:0 2px;line-height:1;}\n#ec-close:hover{color:#fff;}\n#ec-days-left{font-size:9px;color:#a3d0c9;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-left:auto;margin-right:8px;}\n\n/* Chat messages */\n#ec-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}\n#ec-messages::-webkit-scrollbar{width:3px;}\n#ec-messages::-webkit-scrollbar-thumb{background:#c8c8c8;border-radius:2px;}\n.ec-msg{max-width:88%;animation:ecFade 0.2s ease;}\n@keyframes ecFade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}\n.ec-msg.ai{align-self:flex-start;}\n.ec-msg.user{align-self:flex-end;}\n.ec-bubble-text{padding:9px 12px;font-size:12px;line-height:1.65;}\n.ec-msg.ai .ec-bubble-text{background:#fff;border:1px solid #c8c8c8;border-radius:0 10px 10px 10px;color:#202023;}\n.ec-msg.user .ec-bubble-text{background:#202023;color:#fff;border-radius:10px 0 10px 10px;}\n.ec-typing{display:flex;gap:4px;padding:10px 12px;background:#fff;border:1px solid #c8c8c8;border-radius:0 10px 10px 10px;width:fit-content;}\n.ec-dot{width:6px;height:6px;background:#a3d0c9;border-radius:50%;animation:ecBounce 1.2s infinite;}\n.ec-dot:nth-child(2){animation-delay:0.2s;}\n.ec-dot:nth-child(3){animation-delay:0.4s;}\n@keyframes ecBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}\n\n/* Crisis bar */\n#ec-crisis{display:none;background:#c0392b;color:#fff;padding:8px 12px;font-size:10px;font-weight:600;line-height:1.5;flex-shrink:0;}\n#ec-crisis a{color:#fff;font-weight:800;}\n\n/* Input */\n#ec-input-row{padding:10px 12px;background:#d8d8d8;border-top:1px solid #c8c8c8;display:flex;gap:8px;flex-shrink:0;}\n#ec-input{flex:1;padding:9px 11px;border:1px solid #c8c8c8;background:#eeeeee;font-family:'Manrope',sans-serif;font-size:12px;color:#202023;outline:none;resize:none;min-height:36px;max-height:80px;line-height:1.5;}\n#ec-input:focus{border-color:#a3d0c9;}\n#ec-send{padding:9px 14px;background:#202023;color:#a3d0c9;border:none;font-family:'Manrope',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap;}\n#ec-send:hover{background:#a3d0c9;color:#202023;}\n#ec-send:disabled{opacity:0.4;cursor:not-allowed;}\n#ec-footer{text-align:center;font-size:9px;color:#6a6a70;padding:5px 12px 8px;background:#d8d8d8;flex-shrink:0;}\n";
  document.head.appendChild(style);

  // Inject HTML
  var div = document.createElement('div');
  div.innerHTML = '<!-- Bubble toggle -->\n<div id="ec-bubble">\n  <div id="ec-toggle" onclick="ecToggle()">🧠<div id="ec-badge">AI</div></div>\n</div>\n\n<!-- Panel -->\n<div id="ec-panel">\n\n  <!-- Email gate -->\n  <div id="ec-gate">\n    <div class="ec-eyebrow">The Evolved Caveman</div>\n    <h3>Inner Leadership AI Coach</h3>\n    <p>Enter your email to access your AI coach.</p>\n    <input type="email" id="ec-email" placeholder="your@email.com" autocomplete="email">\n    <button id="ec-gate-btn" onclick="ecCheckAccess()">Access My Coach</button>\n    <div id="ec-gate-err"></div>\n    <div class="ec-gate-link">No agreement on file? <a href="https://johnschin.github.io/evolved-caveman-coach/consent_gate.html" target="_blank">Sign it here</a></div>\n  </div>\n\n  <!-- Expired screen -->\n  <div id="ec-expired">\n    <div class="ec-lock">🔒</div>\n    <h3>Your AI Coach Access Has Ended</h3>\n    <p>Your 2-month access to the Inner Leadership AI Coach has expired. Upgrade to continue working with Dr. John\'s AI coach.</p>\n    <button id="ec-upgrade-btn" onclick="ecUpgrade()">Unlock Full Access &rarr;</button>\n  </div>\n\n  <!-- Chat UI (hidden until verified) -->\n  <div id="ec-chat" style="display:none;flex-direction:column;flex:1;overflow:hidden;">\n    <div id="ec-header">\n      <div class="ec-av">🧠</div>\n      <div>\n        <div class="ec-title">Dr. John\'s Inner Leadership AI</div>\n        <div class="ec-sub">The Evolved Caveman</div>\n      </div>\n      <div id="ec-days-left"></div>\n      <button id="ec-close" onclick="ecToggle()">&#10005;</button>\n    </div>\n    <div id="ec-crisis">&#9888; If you\'re in crisis contact <a href="tel:988">988</a> or emergency services immediately.</div>\n    <div id="ec-messages"></div>\n    <div id="ec-input-row">\n      <textarea id="ec-input" placeholder="What\'s on your mind..." rows="1" onkeydown="ecHandleKey(event)" oninput="ecResize(this)"></textarea>\n      <button id="ec-send" onclick="ecSend()">Send</button>\n    </div>\n    <div id="ec-footer">AI coaching companion &middot; Not therapy &middot; Not a crisis service</div>\n  </div>\n\n</div>';
  document.body.appendChild(div);

  // Run widget logic
  var EC = {
  surl: 'https://lmlsfzhismkeyivsxmng.supabase.co',
  skey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbHNmemhpc21rZXlpdnN4bW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDU3NTQsImV4cCI6MjA4ODQ4MTc1NH0.Rq7w173EiYmtRu7urAMbYi9-aE0igHyIbPa4MBRbOgQ',
  proxy: 'https://evolved-caveman-proxy.john-834.workers.dev',
  consentUrl: 'https://johnschin.github.io/evolved-caveman-coach/consent_gate.html',
  upgradeUrl: 'YOUR_UPGRADE_PAGE_URL',
  accessDays: 60,
  email: null,
  sessionId: null,
  history: [],
  msgCount: 0,
  crisis: false,
  open: false
};

var CRISIS_WORDS = ['suicide','suicidal','kill myself','end my life','want to die','self-harm','self harm','hurt myself','cutting myself','no reason to live','better off dead'];

var SYSTEM = 'You are an AI coaching companion built on the knowledge, voice, and methodology of Dr. John Schinnerer - a men\'s inner leadership coach, psychologist, and author. You are not a therapist and do not provide therapy. You are a coaching companion that supports men inside Dr. John\'s online courses. Your tone is warm but direct, slightly irreverent, intellectually grounded, never preachy. You use dry humor and wit to disarm defensiveness. Key phrases: \"You don\'t need to be fixed. You need a better relationship with your inner world.\" \"Most men weren\'t taught emotional mastery - only emotional endurance.\" \"You can\'t change what you can\'t feel.\" You work with the Inner Board Meeting framework (CEO, Director of Defense, VP of Emotions), anger as secondary emotion, escalation curve, green/yellow/red system, and emotional vocabulary expansion. Never diagnose or provide medical advice. If someone expresses crisis or suicidal ideation, immediately provide 988 resources and encourage professional help. Keep responses conversational and concise - this is a coaching dialogue not a lecture. Open each new conversation with a warm direct check-in.';

function ecToggle() {
  EC.open = !EC.open;
  var panel = document.getElementById('ec-panel');
  if (EC.open) {
    panel.classList.add('open');
    if (!EC.email) {
      document.getElementById('ec-email').focus();
    }
  } else {
    panel.classList.remove('open');
  }
}

function ecCheckAccess() {
  var email = document.getElementById('ec-email').value.trim();
  var errEl = document.getElementById('ec-gate-err');
  var btn = document.getElementById('ec-gate-btn');
  errEl.style.display = 'none';

  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    errEl.textContent = 'Please enter a valid email.';
    errEl.style.display = 'block';
    return;
  }

  btn.textContent = 'Checking...';
  btn.disabled = true;

  var xhr = new XMLHttpRequest();
  xhr.open('GET', EC.surl + '/rest/v1/consent_events?user_id=eq.' + encodeURIComponent(email) + '&acknowledged=eq.true&limit=1', true);
  xhr.setRequestHeader('apikey', EC.skey);
  xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);

  xhr.onload = function() {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      if (data && data.length > 0) {
        // Check enrollment date for expiry
        var consentDate = new Date(data[0].timestamp);
        var now = new Date();
        var diffDays = Math.floor((now - consentDate) / (1000 * 60 * 60 * 24));
        var daysLeft = EC.accessDays - diffDays;

        if (daysLeft <= 0) {
          // Expired
          ecShowExpired();
        } else {
          // Access granted
          EC.email = email;
          ecShowChat(daysLeft);
          ecInitSession();
        }
      } else {
        errEl.textContent = 'No signed agreement found. Please complete the User Agreement first.';
        errEl.style.display = 'block';
        btn.textContent = 'Access My Coach';
        btn.disabled = false;
      }
    } else {
      errEl.textContent = 'Connection error. Please try again.';
      errEl.style.display = 'block';
      btn.textContent = 'Access My Coach';
      btn.disabled = false;
    }
  };

  xhr.onerror = function() {
    errEl.textContent = 'Connection error. Please try again.';
    errEl.style.display = 'block';
    btn.textContent = 'Access My Coach';
    btn.disabled = false;
  };

  xhr.send();
}

function ecShowChat(daysLeft) {
  document.getElementById('ec-gate').style.display = 'none';
  document.getElementById('ec-expired').style.display = 'none';
  var chat = document.getElementById('ec-chat');
  chat.style.display = 'flex';
  if (daysLeft <= 14) {
    document.getElementById('ec-days-left').textContent = daysLeft + ' days left';
  }
  document.getElementById('ec-input').focus();
}

function ecShowExpired() {
  document.getElementById('ec-gate').style.display = 'none';
  document.getElementById('ec-expired').style.display = 'flex';
  document.getElementById('ec-chat').style.display = 'none';
}

function ecUpgrade() {
  window.location.href = EC.upgradeUrl;
}

function ecInitSession() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', EC.surl + '/rest/v1/session_logs', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('apikey', EC.skey);
  xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
  xhr.setRequestHeader('Prefer', 'return=representation');
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        var d = JSON.parse(xhr.responseText);
        if (d && d[0]) EC.sessionId = d[0].id;
      } catch(e) {}
    }
  };
  xhr.send(JSON.stringify({
    user_id: EC.email,
    session_start: new Date().toISOString(),
    message_count: 0,
    crisis_flag_triggered: false,
    crisis_response_shown: false
  }));
  ecGetAI(null, true);
}

function ecDetectCrisis(text) {
  var lower = text.toLowerCase();
  for (var i = 0; i < CRISIS_WORDS.length; i++) {
    if (lower.indexOf(CRISIS_WORDS[i]) !== -1) return true;
  }
  return false;
}

function ecAddMsg(role, text) {
  var container = document.getElementById('ec-messages');
  var div = document.createElement('div');
  div.className = 'ec-msg ' + role;
  var bubble = document.createElement('div');
  bubble.className = 'ec-bubble-text';
  bubble.innerHTML = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/
/g,'<br>');
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function ecShowTyping() {
  var container = document.getElementById('ec-messages');
  var div = document.createElement('div');
  div.className = 'ec-msg ai';
  div.id = 'ec-typing';
  div.innerHTML = '<div class="ec-typing"><div class="ec-dot"></div><div class="ec-dot"></div><div class="ec-dot"></div></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function ecRemoveTyping() {
  var el = document.getElementById('ec-typing');
  if (el) el.remove();
}

function ecSend() {
  var input = document.getElementById('ec-input');
  var text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('ec-send').disabled = true;

  if (ecDetectCrisis(text)) {
    EC.crisis = true;
    document.getElementById('ec-crisis').style.display = 'block';
    ecLogCrisis('user-message');
  }

  ecAddMsg('user', text);
  EC.history.push({role:'user', content:text});
  EC.msgCount++;
  ecGetAI(text, false);
}

function ecGetAI(userText, isOpening) {
  ecShowTyping();
  var messages = isOpening ? [{role:'user', content:'Begin the coaching session with your opening check-in. Keep it under 3 sentences.'}] : EC.history;

  var xhr = new XMLHttpRequest();
  xhr.open('POST', EC.proxy, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onload = function() {
    ecRemoveTyping();
    document.getElementById('ec-send').disabled = false;
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.content && data.content[0]) {
          var aiText = data.content[0].text;
          if (ecDetectCrisis(aiText)) {
            EC.crisis = true;
            document.getElementById('ec-crisis').style.display = 'block';
            ecLogCrisis('ai-response');
          }
          ecAddMsg('ai', aiText);
          if (!isOpening) {
            EC.history.push({role:'assistant', content:aiText});
            EC.msgCount++;
            ecUpdateSession();
          } else {
            EC.history = [
              {role:'user', content:'Begin the coaching session with your opening check-in. Keep it under 3 sentences.'},
              {role:'assistant', content:aiText}
            ];
          }
        }
      } catch(e) { ecAddMsg('ai', 'Something went wrong. Please try again.'); }
    } else {
      ecAddMsg('ai', 'Connection error ' + xhr.status + '. Please try again.');
    }
  };

  xhr.onerror = function() {
    ecRemoveTyping();
    document.getElementById('ec-send').disabled = false;
    ecAddMsg('ai', 'Network error. Please check your connection.');
  };

  xhr.send(JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: SYSTEM,
    messages: messages
  }));
}

function ecLogCrisis(category) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', EC.surl + '/rest/v1/crisis_events', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('apikey', EC.skey);
  xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
  xhr.setRequestHeader('Prefer', 'return=minimal');
  xhr.send(JSON.stringify({
    user_id: EC.email,
    session_id: EC.sessionId,
    triggered_at: new Date().toISOString(),
    trigger_phrase_category: category,
    resources_displayed: '988 Suicide & Crisis Lifeline',
    user_acknowledged: false
  }));
}

function ecUpdateSession() {
  if (!EC.sessionId) return;
  var xhr = new XMLHttpRequest();
  xhr.open('PATCH', EC.surl + '/rest/v1/session_logs?id=eq.' + EC.sessionId, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('apikey', EC.skey);
  xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
  xhr.setRequestHeader('Prefer', 'return=minimal');
  xhr.send(JSON.stringify({
    message_count: EC.msgCount,
    session_end: new Date().toISOString(),
    crisis_flag_triggered: EC.crisis,
    crisis_response_shown: EC.crisis
  }));
}

function ecHandleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ecSend(); }
}

function ecResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 80) + 'px';
}

window.addEventListener('beforeunload', function() { ecUpdateSession(); });

// Remember email across lessons using sessionStorage
var savedEmail = sessionStorage.getItem('ec_email');
if (savedEmail) {
  document.getElementById('ec-email').value = savedEmail;
}

document.getElementById('ec-email').addEventListener('input', function() {
  sessionStorage.setItem('ec_email', this.value);
});
})();