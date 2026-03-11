<script>
document.addEventListener('DOMContentLoaded', function() {

  // ── Fonts ──────────────────────────────────────────────────────────────────
  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(font);

  // ── CSS ────────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    "#ec-bubble{position:fixed;bottom:24px;right:24px;z-index:99999;font-family:'Manrope',sans-serif;display:flex;flex-direction:column;align-items:center;}",
    "#ec-toggle{width:56px;height:56px;background:#202023;border-radius:50%;border:2px solid #a3d0c9;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;position:relative;}",
    "#ec-toggle:hover{transform:scale(1.08);}",
    "#ec-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;background:#a3d0c9;border-radius:50%;font-size:10px;font-weight:800;color:#202023;display:flex;align-items:center;justify-content:center;}",
    "#ec-label{font-size:9px;font-weight:700;color:#202023;text-align:center;margin-top:5px;line-height:1.3;font-family:'Manrope',sans-serif;max-width:80px;}",
    "#ec-panel{position:fixed;bottom:90px;right:24px;width:380px;height:560px;background:#eeeeee;border:1px solid #c8c8c8;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.2);display:none;flex-direction:column;overflow:hidden;z-index:99999;}",
    "#ec-panel.open{display:flex;}",
    "#ec-gate{padding:28px 24px;display:flex;flex-direction:column;gap:12px;background:#eeeeee;flex:1;justify-content:center;}",
    "#ec-gate .ec-eyebrow{font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#202023;font-weight:700;}",
    "#ec-gate h3{font-size:17px;font-weight:800;color:#202023;letter-spacing:-0.02em;line-height:1.2;font-family:'Manrope',sans-serif;}",
    "#ec-gate p{font-size:12px;color:#6a6a70;line-height:1.6;}",
    "#ec-gate input{padding:10px 12px;border:1px solid #c8c8c8;background:#fff;font-family:'Manrope',sans-serif;font-size:13px;color:#202023;outline:none;width:100%;box-sizing:border-box;}",
    "#ec-gate input:focus{border-color:#a3d0c9;}",
    "#ec-gate-btn{padding:12px;background:#202023;color:#a3d0c9;border:none;font-family:'Manrope',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;width:100%;}",
    "#ec-gate-btn:hover{background:#a3d0c9;color:#202023;}",
    "#ec-gate-err{font-size:11px;color:#c0392b;display:none;}",
    "#ec-gate-link{font-size:11px;color:#6a6a70;text-align:center;}",
    "#ec-gate-link a{color:#a3d0c9;font-weight:600;text-decoration:none;}",
    "#ec-expired{padding:28px 24px;display:none;flex-direction:column;gap:14px;background:#eeeeee;flex:1;justify-content:center;text-align:center;}",
    "#ec-expired .ec-lock{font-size:36px;margin-bottom:4px;}",
    "#ec-expired h3{font-size:16px;font-weight:800;color:#202023;}",
    "#ec-expired p{font-size:12px;color:#6a6a70;line-height:1.65;}",
    "#ec-upgrade-btn{padding:12px;background:#a3d0c9;color:#202023;border:none;font-family:'Manrope',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;width:100%;}",
    "#ec-upgrade-btn:hover{background:#202023;color:#a3d0c9;}",
    "#ec-header{background:#202023;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:2px solid #a3d0c9;flex-shrink:0;}",
    "#ec-header .ec-av{width:30px;height:30px;background:#a3d0c9;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}",
    "#ec-header .ec-title{font-size:12px;font-weight:700;color:#fff;}",
    "#ec-header .ec-sub{font-size:10px;color:#a3d0c9;font-weight:500;}",
    "#ec-close{margin-left:auto;background:none;border:none;color:#6a6a70;font-size:18px;cursor:pointer;padding:0 2px;line-height:1;}",
    "#ec-close:hover{color:#fff;}",
    "#ec-days-left{font-size:9px;color:#a3d0c9;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-left:auto;margin-right:8px;}",
    "#ec-messages{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;}",
    "#ec-messages::-webkit-scrollbar{width:3px;}",
    "#ec-messages::-webkit-scrollbar-thumb{background:#c8c8c8;border-radius:2px;}",
    ".ec-msg{max-width:88%;animation:ecFade 0.2s ease;}",
    "@keyframes ecFade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}",
    ".ec-msg.ai{align-self:flex-start;}",
    ".ec-msg.user{align-self:flex-end;}",
    ".ec-bubble-text{padding:9px 12px;font-size:12px;line-height:1.65;}",
    ".ec-msg.ai .ec-bubble-text{background:#fff;border:1px solid #c8c8c8;border-radius:0 10px 10px 10px;color:#202023;}",
    ".ec-msg.user .ec-bubble-text{background:#202023;color:#fff;border-radius:10px 0 10px 10px;}",
    ".ec-typing{display:flex;gap:4px;padding:10px 12px;background:#fff;border:1px solid #c8c8c8;border-radius:0 10px 10px 10px;width:fit-content;}",
    ".ec-dot{width:6px;height:6px;background:#a3d0c9;border-radius:50%;animation:ecBounce 1.2s infinite;}",
    ".ec-dot:nth-child(2){animation-delay:0.2s;}",
    ".ec-dot:nth-child(3){animation-delay:0.4s;}",
    "@keyframes ecBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}",
    "#ec-crisis{display:none;background:#c0392b;color:#fff;padding:8px 12px;font-size:10px;font-weight:600;line-height:1.5;flex-shrink:0;}",
    "#ec-crisis a{color:#fff;font-weight:800;}",
    "#ec-input-row{padding:10px 12px;background:#d8d8d8;border-top:1px solid #c8c8c8;display:flex;gap:8px;flex-shrink:0;}",
    "#ec-input{flex:1;padding:9px 11px;border:1px solid #c8c8c8;background:#eeeeee;font-family:'Manrope',sans-serif;font-size:12px;color:#202023;outline:none;resize:none;min-height:36px;max-height:80px;line-height:1.5;}",
    "#ec-input:focus{border-color:#a3d0c9;}",
    "#ec-send{padding:9px 14px;background:#202023;color:#a3d0c9;border:none;font-family:'Manrope',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap;}",
    "#ec-send:hover{background:#a3d0c9;color:#202023;}",
    "#ec-send:disabled{opacity:0.4;cursor:not-allowed;}",
    "#ec-footer{text-align:center;font-size:9px;color:#6a6a70;padding:5px 12px 8px;background:#d8d8d8;flex-shrink:0;}"
  ].join('');
  document.head.appendChild(style);

  // ── HTML ───────────────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'ec-root';

  // Bubble
  var bubble = document.createElement('div');
  bubble.id = 'ec-bubble';
  bubble.innerHTML = '<div id="ec-toggle">🧠<div id="ec-badge">AI</div></div><div id="ec-label">The Inner Leadership AI</div>';
  wrap.appendChild(bubble);

  // Panel
  var panel = document.createElement('div');
  panel.id = 'ec-panel';
  panel.innerHTML = [
    '<div id="ec-gate">',
      '<div class="ec-eyebrow">The Evolved Caveman</div>',
      '<h3>Inner Leadership AI Coach</h3>',
      '<p>Enter your email to access your AI coach.</p>',
      '<input type="email" id="ec-email" placeholder="your@email.com" autocomplete="email">',
      '<button id="ec-gate-btn">Access My Coach</button>',
      '<div id="ec-gate-err"></div>',
      '<div class="ec-gate-link">No agreement on file? <a href="https://johnschin.github.io/evolved-caveman-coach/consent_gate.html" target="_blank">Sign it here</a></div>',
    '</div>',
    '<div id="ec-expired">',
      '<div class="ec-lock">🔒</div>',
      '<h3>Your AI Coach Access Has Ended</h3>',
      '<p>Your 2-month access to the Inner Leadership AI Coach has expired. Upgrade to continue.</p>',
      '<button id="ec-upgrade-btn">Unlock Full Access &rarr;</button>',
    '</div>',
    '<div id="ec-chat" style="display:none;flex-direction:column;flex:1;overflow:hidden;">',
      '<div id="ec-header">',
        '<div class="ec-av">🧠</div>',
        '<div><div class="ec-title">Dr. John\'s Inner Leadership AI</div><div class="ec-sub">The Evolved Caveman</div></div>',
        '<div id="ec-days-left"></div>',
        '<button id="ec-close">&#10005;</button>',
      '</div>',
      '<div id="ec-crisis">&#9888; If you\'re in crisis contact <a href="tel:988">988</a> or emergency services immediately.</div>',
      '<div id="ec-messages"></div>',
      '<div id="ec-input-row">',
        '<textarea id="ec-input" placeholder="What\'s on your mind..." rows="1"></textarea>',
        '<button id="ec-send">Send</button>',
      '</div>',
      '<div id="ec-footer">AI coaching companion &middot; Not therapy &middot; Not a crisis service</div>',
    '</div>'
  ].join('');
  wrap.appendChild(panel);
  document.body.appendChild(wrap);

  // ── State ──────────────────────────────────────────────────────────────────
  var EC = {
    surl: 'https://lmlsfzhismkeyivsxmng.supabase.co',
    skey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtbHNmemhpc21rZXlpdnN4bW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDU3NTQsImV4cCI6MjA4ODQ4MTc1NH0.Rq7w173EiYmtRu7urAMbYi9-aE0igHyIbPa4MBRbOgQ',
    proxy: 'https://evolved-caveman-proxy.john-834.workers.dev',
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

  var SYSTEM = "You are an AI coaching companion built on the knowledge, voice, and methodology of Dr. John Schinnerer - a men's inner leadership coach, psychologist, and author. You are not a therapist and do not provide therapy. You are a coaching companion that supports men inside Dr. John's online courses. Your tone is warm but direct, slightly irreverent, intellectually grounded, never preachy. You use dry humor and wit to disarm defensiveness. Key phrases: 'You don't need to be fixed. You need a better relationship with your inner world.' 'Most men weren't taught emotional mastery - only emotional endurance.' 'You can't change what you can't feel.' You work with the Inner Board Meeting framework (CEO, Director of Defense, VP of Emotions), anger as secondary emotion, escalation curve, green/yellow/red system, and emotional vocabulary expansion. Never diagnose or provide medical advice. If someone expresses crisis or suicidal ideation, immediately provide 988 resources and encourage professional help. Keep responses conversational and concise - this is a coaching dialogue not a lecture. Open each new conversation with a warm direct check-in.";

  // ── Functions ──────────────────────────────────────────────────────────────
  function ecToggle() {
    EC.open = !EC.open;
    if (EC.open) {
      panel.classList.add('open');
      if (!EC.email) document.getElementById('ec-email').focus();
    } else {
      panel.classList.remove('open');
    }
  }

  function ecCheckAccess() {
    var email = document.getElementById('ec-email').value.trim();
    var errEl = document.getElementById('ec-gate-err');
    var btn = document.getElementById('ec-gate-btn');
    errEl.style.display = 'none';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
          var daysLeft = EC.accessDays - Math.floor((new Date() - new Date(data[0].timestamp)) / 86400000);
          if (daysLeft <= 0) { ecShowExpired(); }
          else { EC.email = email; ecShowChat(daysLeft); ecInitSession(); }
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
    xhr.onerror = function() { ecRemoveTyping(); document.getElementById('ec-send').disabled = false; ecAddMsg('ai', 'Network error. Please check your connection and try again.'); };
    xhr.send();
  }

  function ecShowChat(daysLeft) {
    document.getElementById('ec-gate').style.display = 'none';
    document.getElementById('ec-expired').style.display = 'none';
    var chat = document.getElementById('ec-chat');
    chat.style.display = 'flex';
    if (daysLeft <= 14) document.getElementById('ec-days-left').textContent = daysLeft + ' days left';
    document.getElementById('ec-input').focus();
  }

  function ecShowExpired() {
    document.getElementById('ec-gate').style.display = 'none';
    document.getElementById('ec-expired').style.display = 'flex';
    document.getElementById('ec-chat').style.display = 'none';
  }

  function ecInitSession() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', EC.surl + '/rest/v1/session_logs', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', EC.skey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
    xhr.setRequestHeader('Prefer', 'return=representation');
    xhr.onload = function() {
      try { var d = JSON.parse(xhr.responseText); if (d && d[0]) EC.sessionId = d[0].id; } catch(e) {}
    };
    xhr.send(JSON.stringify({ user_id: EC.email, session_start: new Date().toISOString(), message_count: 0, crisis_flag_triggered: false, crisis_response_shown: false }));
    ecAddMsg("ai", "Hey!  Really nice to have you here! I’m Dr. John’s Evolved Caveman AI Coach. Think of this as executive coaching for your inner world: sharper self-awareness, better emotional control, stronger relationships, and less unconscious nonsense running your life behind the scenes. Is there something you’d like to discuss? It might be romantic relationship issues, work issues, parenting issues, or perhaps it’s an emotional challenge, a social dilemma or something else. Where would you like to go?");
  }

  function ecDetectCrisis(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < CRISIS_WORDS.length; i++) { if (lower.indexOf(CRISIS_WORDS[i]) !== -1) return true; }
    return false;
  }

  function ecAddMsg(role, text) {
    var container = document.getElementById('ec-messages');
    var div = document.createElement('div');
    div.className = 'ec-msg ' + role;
    var bubble = document.createElement('div');
    bubble.className = 'ec-bubble-text';
    bubble.innerHTML = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
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

  function ecRemoveTyping() { var el = document.getElementById('ec-typing'); if (el) el.remove(); }

  function ecSend() {
    var input = document.getElementById('ec-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    document.getElementById('ec-send').disabled = true;
    if (ecDetectCrisis(text)) { EC.crisis = true; document.getElementById('ec-crisis').style.display = 'block'; ecLogCrisis('user-message'); }
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
            if (ecDetectCrisis(aiText)) { EC.crisis = true; document.getElementById('ec-crisis').style.display = 'block'; ecLogCrisis('ai-response'); }
            ecAddMsg('ai', aiText);
            if (!isOpening) { EC.history.push({role:'assistant', content:aiText}); EC.msgCount++; ecUpdateSession(); }
            else { EC.history = [{role:'user', content:'Begin the coaching session with your opening check-in. Keep it under 3 sentences.'},{role:'assistant', content:aiText}]; }
          } else if (data.error) { ecAddMsg('ai', 'Error from AI: ' + data.error.message); }
        } catch(e) { ecAddMsg("ai", "Hey!  Really nice to have you here! I’m Dr. John’s Evolved Caveman AI Coach. Think of this as executive coaching for your inner world: sharper self-awareness, better emotional control, stronger relationships, and less unconscious nonsense running your life behind the scenes. Is there something you’d like to discuss? It might be romantic relationship issues, work issues, parenting issues, or perhaps it’s an emotional challenge, a social dilemma or something else. Where would you like to go?"); }
      } else { ecAddMsg('ai', 'Connection error (' + xhr.status + '). Please try again.'); }
    };
    xhr.onerror = function() { ecRemoveTyping(); document.getElementById('ec-send').disabled = false; ecAddMsg('ai', 'Network error. Please check your connection and try again.'); };
    xhr.send(JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 512, system: SYSTEM, messages: messages }));
  }

  function ecLogCrisis(category) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', EC.surl + '/rest/v1/crisis_events', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', EC.skey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
    xhr.setRequestHeader('Prefer', 'return=minimal');
    xhr.send(JSON.stringify({ user_id: EC.email, session_id: EC.sessionId, triggered_at: new Date().toISOString(), trigger_phrase_category: category, resources_displayed: '988 Suicide & Crisis Lifeline', user_acknowledged: false }));
  }

  function ecUpdateSession() {
    if (!EC.sessionId) return;
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', EC.surl + '/rest/v1/session_logs?id=eq.' + EC.sessionId, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', EC.skey);
    xhr.setRequestHeader('Authorization', 'Bearer ' + EC.skey);
    xhr.setRequestHeader('Prefer', 'return=minimal');
    xhr.send(JSON.stringify({ message_count: EC.msgCount, session_end: new Date().toISOString(), crisis_flag_triggered: EC.crisis, crisis_response_shown: EC.crisis }));
  }

  // ── Event bindings ─────────────────────────────────────────────────────────
  document.getElementById('ec-toggle').addEventListener('click', ecToggle);
  document.getElementById('ec-close').addEventListener('click', ecToggle);
  document.getElementById('ec-gate-btn').addEventListener('click', ecCheckAccess);
  document.getElementById('ec-upgrade-btn').addEventListener('click', function() { window.location.href = EC.upgradeUrl; });
  document.getElementById('ec-send').addEventListener('click', ecSend);
  document.getElementById('ec-input').addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ecSend(); } });
  document.getElementById('ec-input').addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 80) + 'px'; });

  var savedEmail = sessionStorage.getItem('ec_email');
  if (savedEmail) document.getElementById('ec-email').value = savedEmail;
  document.getElementById('ec-email').addEventListener('input', function() { sessionStorage.setItem('ec_email', this.value); });

  window.addEventListener('beforeunload', function() { ecUpdateSession(); });

});
</script>
