import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey'
};

const contentGuardrails = `\n\n---\nCONTENT GUARDRAILS:\n- NEVER use religious exclamations or phrases such as "Jesus," "Jesus Christ," "Christ," "God," "Oh my God," "Oh God," "God damn," "swear to God," or any similar religious expressions.\n- Use secular alternatives instead.\n- This rule applies at all times.\n---\n`;

const CRISIS_KEYWORDS = [
  'kill myself','want to die','end my life','end it all','suicide','suicidal',
  "don't want to live",'dont want to live','no reason to live','better off dead',
  'wish i was dead','wish i were dead','take my own life','not worth living',
  "can't go on",'cant go on','rather be dead','planning to end',
  'self-harm','self harm','cut myself','cutting myself','hurt myself',
  'hurting myself','harm myself','harming myself',
  'kill someone','kill him','kill her','kill them','hurt someone',
  'want to hurt','going to hurt',
  'being abused','he hits me','she hits me','domestic violence',
  'sexual abuse','sexually abused',
  'in crisis','emergency','overdose','overdosing',
  'have a gun','have a knife','have pills'
];

function detectCrisisKeywords(message: string): { detected: boolean; triggers: string[] } {
  const lower = message.toLowerCase();
  const triggers = CRISIS_KEYWORDS.filter(kw => lower.includes(kw));
  return { detected: triggers.length > 0, triggers };
}

function classifySeverityFromKeywords(triggers: string[]): string {
  const critical = ['kill myself','suicide','suicidal','take my own life','planning to end','overdose','overdosing','have a gun','have a knife','have pills'];
  const high = ['want to die','end my life','end it all',"don't want to live",'dont want to live','better off dead','wish i was dead','wish i were dead','not worth living','kill someone','kill him','kill her','kill them','being abused','domestic violence','sexual abuse','sexually abused'];
  const medium = ['self-harm','self harm','cut myself','cutting myself','hurt myself','hurting myself','harm myself','harming myself','in crisis','emergency',"can't go on",'cant go on','rather be dead','no reason to live'];
  for (const t of triggers) { if (critical.includes(t)) return 'critical'; }
  for (const t of triggers) { if (high.includes(t)) return 'high'; }
  for (const t of triggers) { if (medium.includes(t)) return 'medium'; }
  return 'low';
}

const crisisClassificationInstruction = `\n\n---\nCRISIS DETECTION (INTERNAL — NEVER show this to the user):\nAfter composing your coaching response, evaluate whether the user's most recent message contains signs of crisis, danger, or self-harm risk. If it does, append the following hidden tag at the VERY END of your response, after your visible coaching text and after any RUBRIC tag:\n<!--CRISIS:{"detected":true,"severity":"critical|high|medium|low","trigger_category":"suicidal_ideation|self_harm|violence_toward_others|abuse_disclosure|crisis_state|substance_emergency","brief_reason":"one sentence"}-->\nIf NO crisis is detected, do NOT append anything — just respond normally.\nSeverity guide: critical = imminent danger; high = active ideation or abuse disclosure; medium = passive ideation or self-harm; low = concerning but not immediate.\nThis is for backend safety monitoring only. Your visible response should follow normal safety filters.\n---\n`;

function parseAiCrisisTag(assistantMessage: string): { cleanMessage: string; aiClassification: any | null } {
  const regex = /<!--CRISIS:(\{.*?\})-->/s;
  const match = assistantMessage.match(regex);
  if (match) {
    try {
      const classification = JSON.parse(match[1]);
      const cleanMessage = assistantMessage.replace(regex, '').trim();
      return { cleanMessage, aiClassification: classification };
    } catch {
      return { cleanMessage: assistantMessage, aiClassification: null };
    }
  }
  return { cleanMessage: assistantMessage, aiClassification: null };
}

async function logCrisisEvent(params: {
  sessionId: string | null; userId: string | null; trialToken: string | null;
  userEmail: string | null; userName: string | null; userMessage: string;
  assistantMessage: string; detectionMethod: 'keyword' | 'ai_classified' | 'both';
  keywordTriggers: string[]; aiClassification: any | null; severity: string;
  product: string;
}) {
  const { error } = await supabase.from('crisis_events').insert({
    session_id: params.sessionId, user_id: params.userId, trial_token: params.trialToken,
    user_email: params.userEmail, user_name: params.userName, user_message: params.userMessage,
    assistant_message: params.assistantMessage, detection_method: params.detectionMethod,
    keyword_triggers: params.keywordTriggers, ai_classification: params.aiClassification,
    severity: params.severity, product: params.product
  });
  if (error) console.error('Failed to log crisis event:', JSON.stringify(error));
  else console.warn(`CRISIS EVENT LOGGED: severity=${params.severity}, method=${params.detectionMethod}, email=${params.userEmail}, product=${params.product}`);
}

async function processCrisisDetection(
  userMessage: string, assistantMessage: string, sessionId: string | null,
  userId: string | null, trialToken: string | null, userEmail: string | null, userName: string | null,
  product: string = 'john'
): Promise<string> {
  const keywordResult = detectCrisisKeywords(userMessage);
  const { cleanMessage, aiClassification } = parseAiCrisisTag(assistantMessage);
  const keywordDetected = keywordResult.detected;
  const aiDetected = aiClassification?.detected === true;
  if (keywordDetected || aiDetected) {
    let method: 'keyword' | 'ai_classified' | 'both' = 'keyword';
    if (keywordDetected && aiDetected) method = 'both';
    else if (aiDetected) method = 'ai_classified';
    const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    const kwSeverity = keywordDetected ? classifySeverityFromKeywords(keywordResult.triggers) : 'low';
    const aiSeverity = aiClassification?.severity || 'low';
    const finalSeverity = (severityRank[aiSeverity] || 0) >= (severityRank[kwSeverity] || 0) ? aiSeverity : kwSeverity;
    logCrisisEvent({ sessionId, userId, trialToken, userEmail, userName, userMessage, assistantMessage: cleanMessage, detectionMethod: method, keywordTriggers: keywordResult.triggers, aiClassification, severity: finalSeverity, product }).catch(err => console.error('Crisis log error:', err));
  }
  return cleanMessage;
}

// ============================================================
// PHASE 1: RESPONSE QUALITY RUBRIC (v18 — unchanged in v19)
// ============================================================

function getRubricInstruction(coach: string | null): string {
  if (coach === 'joree') {
    return `\n\n---
RESPONSE QUALITY SELF-CHECK — PROXI SHE (INTERNAL — NEVER show this to the user):
After composing your coaching response, score it against the rubric below and append the hidden JSON tag BEFORE any CRISIS tag. Be honest — this is for quality improvement, not for the user to see.

Rubric fields:
- mirrored_first: Did you reflect her emotional experience BEFORE giving advice or a question? (true/false)
- gave_language: Did you name an emotion or feeling she may not have words for? (true/false)
- asked_one_question: Did the response contain exactly ONE question? (true/false)
- offered_reframe_or_tool: Did you offer a practical reframe, tool, or meaning question? (true/false)
- avoided_deficit_language: Did you avoid "broken," "fix," "repair," or deficit framing? (true/false)
- used_coaching_not_therapy: Did you stay in coaching territory (present-focused, action-oriented) rather than clinical territory? (true/false)
- tone: One of: "warm_compassionate" | "appropriate" | "too_clinical" | "preachy" | "vague"
- flag: null, or a brief note if something feels off about this response

Append at end of response (before CRISIS tag if present):
<!--RUBRIC:{"coach":"she","mirrored_first":true,"gave_language":true,"asked_one_question":true,"offered_reframe_or_tool":true,"avoided_deficit_language":true,"used_coaching_not_therapy":true,"tone":"warm_compassionate","flag":null}-->

Fill in actual true/false/string values — do not copy the example verbatim.
This tag is stripped before the user sees the message. It is for quality monitoring only.
---\n`;
  }

  if (coach === 'couples') {
    return `\n\n---
RESPONSE QUALITY SELF-CHECK — PROXI WE (INTERNAL — NEVER show this to the user):
After composing your coaching response, score it against the rubric below and append the hidden JSON tag BEFORE any CRISIS tag. Be honest — this is for quality improvement, not for the user to see.

Rubric fields:
- acknowledged_what_is_here: Did you acknowledge what the user brought before naming patterns or giving advice? (true/false)
- named_cycle_not_person: Did you name the relational cycle or pattern rather than attributing fault to a person? (true/false)
- asked_one_question: Did the response contain exactly ONE question? (true/false)
- offered_reframe_or_tool: Did you offer a practical reframe, EFT-style tool, or exercise? (true/false)
- gave_next_step: Did you suggest one concrete next step? (true/false)
- honored_both_realities: Did the response hold space for both partners' perspectives, or did it implicitly favor one? (true/false — true = both honored)
- no_sides_taken: Did you avoid taking a side or validating one partner against the other? (true/false)
- no_partner_labeling: Did you avoid labeling an absent/mentioned partner as toxic, narcissistic, abusive, or similar? (true/false)
- safety_signals_detected: Did the user's message contain signals of fear of partner, intimidation, coercive control, or physical threat? (true/false)
- safety_signal_type: null, or one of: "coercive_control" | "dv_risk" | "power_imbalance" | "fear_of_partner"
- tone: One of: "warm_balanced" | "appropriate" | "one_sided" | "blaming" | "too_clinical"
- flag: null, or a brief note if something feels off about this response

Append at end of response (before CRISIS tag if present):
<!--RUBRIC:{"coach":"we","acknowledged_what_is_here":true,"named_cycle_not_person":true,"asked_one_question":true,"offered_reframe_or_tool":true,"gave_next_step":true,"honored_both_realities":true,"no_sides_taken":true,"no_partner_labeling":true,"safety_signals_detected":false,"safety_signal_type":null,"tone":"warm_balanced","flag":null}-->

Fill in actual true/false/string values — do not copy the example verbatim.
This tag is stripped before the user sees the message. It is for quality monitoring only.
---\n`;
  }

  // Default: Proxi He (coach === 'john' or null)
  return `\n\n---
RESPONSE QUALITY SELF-CHECK — PROXI HE (INTERNAL — NEVER show this to the user):
After composing your coaching response, score it against the rubric below and append the hidden JSON tag BEFORE any CRISIS tag. Be honest — this is for quality improvement, not for the user to see.

Rubric fields:
- named_pattern: Did you name the underlying pattern or tension the user is in? (true/false)
- asked_one_question: Did the response contain exactly ONE question? (true/false)
- offered_reframe: Did you offer a clear reframe of the situation? (true/false)
- gave_next_step: Did you suggest one concrete next step? (true/false)
- used_coaching_not_therapy: Did you stay in coaching territory (present-focused, action-oriented, leadership framing) rather than clinical territory? (true/false)
- tone: One of: "warm_direct" | "appropriate" | "too_soft" | "too_harsh" | "lecture" | "shame"
- flag: null, or a brief note if something feels off about this response

Append at end of response (before CRISIS tag if present):
<!--RUBRIC:{"coach":"he","named_pattern":true,"asked_one_question":true,"offered_reframe":true,"gave_next_step":true,"used_coaching_not_therapy":true,"tone":"warm_direct","flag":null}-->

Fill in actual true/false/string values — do not copy the example verbatim.
This tag is stripped before the user sees the message. It is for quality monitoring only.
---\n`;
}

function parseRubricTag(assistantMessage: string): { cleanMessage: string; rubricResult: any | null } {
  const regex = /<!--RUBRIC:(\{.*?\})-->/s;
  const match = assistantMessage.match(regex);
  if (match) {
    try {
      const rubricResult = JSON.parse(match[1]);
      const cleanMessage = assistantMessage.replace(regex, '').trim();
      return { cleanMessage, rubricResult };
    } catch {
      console.warn('RUBRIC: Failed to parse rubric JSON — ignoring tag');
      return { cleanMessage: assistantMessage.replace(/<!--RUBRIC:.*?-->/s, '').trim(), rubricResult: null };
    }
  }
  return { cleanMessage: assistantMessage, rubricResult: null };
}

function logRubricResult(rubric: any, sessionId: string | null, product: string): void {
  if (!rubric) return;

  const coach = rubric.coach || product;
  const flags: string[] = [];

  if (rubric.asked_one_question === false) flags.push('MULTI_QUESTION');
  if (rubric.used_coaching_not_therapy === false) flags.push('THERAPY_DRIFT');
  if (rubric.tone && ['lecture','shame','blaming','one_sided','too_clinical','preachy'].includes(rubric.tone)) flags.push(`TONE:${rubric.tone.toUpperCase()}`);
  if (rubric.flag) flags.push(`NOTE:${rubric.flag}`);

  if (coach === 'he') {
    if (rubric.named_pattern === false) flags.push('NO_PATTERN_NAMED');
    if (rubric.offered_reframe === false) flags.push('NO_REFRAME');
    if (rubric.gave_next_step === false) flags.push('NO_NEXT_STEP');
  }

  if (coach === 'she') {
    if (rubric.mirrored_first === false) flags.push('NO_MIRROR');
    if (rubric.gave_language === false) flags.push('NO_LANGUAGE_GIVEN');
    if (rubric.offered_reframe_or_tool === false) flags.push('NO_REFRAME_OR_TOOL');
    if (rubric.avoided_deficit_language === false) flags.push('DEFICIT_LANGUAGE');
  }

  if (coach === 'we') {
    if (rubric.safety_signals_detected === true) {
      console.warn(`RUBRIC SAFETY ALERT [${coach.toUpperCase()}] session=${sessionId}: safety_signal_type=${rubric.safety_signal_type || 'unknown'} — review this conversation`);
    }
    if (rubric.named_cycle_not_person === false) flags.push('PERSON_BLAMED_NOT_CYCLE');
    if (rubric.honored_both_realities === false) flags.push('ONE_SIDED');
    if (rubric.no_sides_taken === false) flags.push('SIDES_TAKEN');
    if (rubric.no_partner_labeling === false) flags.push('PARTNER_LABELED');
    if (rubric.gave_next_step === false) flags.push('NO_NEXT_STEP');
    if (rubric.acknowledged_what_is_here === false) flags.push('NO_ACKNOWLEDGEMENT');
  }

  const status = flags.length === 0 ? 'PASS' : 'REVIEW';
  const flagStr = flags.length > 0 ? ` | flags: ${flags.join(', ')}` : '';
  console.log(`RUBRIC [${coach.toUpperCase()}] ${status} session=${sessionId}${flagStr}`);

  // Phase 4: Add DB logging here
  // await supabase.from('rubric_logs').insert({ session_id: sessionId, product, coach, rubric, flags, status, created_at: new Date().toISOString() });
}

// ============================================================
// END RUBRIC SECTION
// ============================================================

// ============================================================
// v19 NEW: LONGITUDINAL COACHING PROFILE (Dream injection)
// ============================================================

/**
 * Reads the user's longitudinal coaching profile from user_memory_profiles.
 * Returns null if not found or on error (graceful degradation).
 */
async function getCoachingNotes(userId: string, product: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_memory_profiles')
    .select('coaching_notes, dream_run_at')
    .eq('user_id', userId)
    .eq('product', product)
    .single();

  if (error || !data?.coaching_notes) {
    // PGRST116 = "no rows found" — normal for new users
    if (error && error.code !== 'PGRST116') {
      console.warn('getCoachingNotes: unexpected error:', error.message);
    } else {
      console.log(`getCoachingNotes: no profile yet for user/${product}`);
    }
    return null;
  }

  console.log(`getCoachingNotes: injecting profile for user/${product} (last dream: ${data.dream_run_at})`);
  return data.coaching_notes;
}

/**
 * Builds the system prompt block for the longitudinal coaching profile.
 * This is injected at the start of the first message of each session.
 */
function buildCoachingNotesContext(notes: string): string {
  return `\n\n---\nLONGITUDINAL COACHING PROFILE (INTERNAL — use as background context, never recite directly):\nThis profile was built by consolidating all previous sessions with this user. Use it to coach them with continuity and personalization. Do not reference the profile explicitly unless it naturally fits the conversation.\n\n${notes}\n---\n`;
}

// ============================================================
// END v19 ADDITIONS
// ============================================================

async function verifyUser(req: Request, body?: any): Promise<{ id: string; email: string } | null> {
  let token = '';
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) token = authHeader.replace('Bearer ', '');
  if (!token && body?.access_token) token = body.access_token;
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) { console.warn('Auth verification failed:', error?.message); return null; }
  return { id: user.id, email: user.email || '' };
}

async function verifyTrialToken(trialToken: string): Promise<{ valid: boolean; status: 'active' | 'session_complete' | 'trial_expired' | 'invalid'; trial?: any; messages_remaining?: number; session_messages_remaining?: number; sessions_remaining?: number; }> {
  if (!trialToken) return { valid: false, status: 'invalid' };
  const { data: trial, error } = await supabase.from('trial_tokens').select('*').eq('token', trialToken).single();
  if (error || !trial) { console.warn('Trial token lookup failed:', error?.message); return { valid: false, status: 'invalid' }; }
  if (!trial.is_active) return { valid: false, status: 'trial_expired', trial };
  const maxTotal = trial.max_sessions * trial.messages_per_session;
  if (trial.messages_used >= maxTotal) {
    await supabase.from('trial_tokens').update({ is_active: false }).eq('token', trialToken);
    return { valid: false, status: 'trial_expired', trial, messages_remaining: 0, sessions_remaining: 0 };
  }
  if (trial.current_session_messages >= trial.messages_per_session) {
    const sessionsLeft = trial.max_sessions - trial.sessions_used;
    if (sessionsLeft <= 0) {
      await supabase.from('trial_tokens').update({ is_active: false }).eq('token', trialToken);
      return { valid: false, status: 'trial_expired', trial, messages_remaining: 0, sessions_remaining: 0 };
    }
    return { valid: false, status: 'session_complete', trial, messages_remaining: maxTotal - trial.messages_used, session_messages_remaining: 0, sessions_remaining: sessionsLeft };
  }
  return { valid: true, status: 'active', trial, messages_remaining: maxTotal - trial.messages_used, session_messages_remaining: trial.messages_per_session - trial.current_session_messages, sessions_remaining: trial.max_sessions - trial.sessions_used };
}

async function incrementTrialMessage(trialToken: string, trial: any) {
  const newMessagesUsed = (trial.messages_used || 0) + 1;
  const newSessionMessages = (trial.current_session_messages || 0) + 1;
  let newSessionsUsed = trial.sessions_used || 0;
  if (trial.current_session_messages === 0) newSessionsUsed += 1;
  await supabase.from('trial_tokens').update({ messages_used: newMessagesUsed, current_session_messages: newSessionMessages, sessions_used: newSessionsUsed, last_message_at: new Date().toISOString() }).eq('token', trialToken);
  console.log(`Trial ${trialToken}: msg ${newMessagesUsed}/${trial.max_sessions * trial.messages_per_session}, session msg ${newSessionMessages}/${trial.messages_per_session}, session ${newSessionsUsed}/${trial.max_sessions}`);
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}` }, body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 }) });
  if (!res.ok) { const err = await res.text(); console.error('OpenAI embedding error:', err); throw new Error('OpenAI embedding failed'); }
  const data = await res.json();
  return data.data[0].embedding as number[];
}

function getCoachFilter(coach: string | null): string[] | null {
  const coachFilterMap: Record<string, string[]> = {
    john: ['john', 'shared'],
    joree: ['joree', 'shared'],
    couples: ['john', 'joree', 'couples', 'shared'],
  };
  if (!coach) return ['john', 'shared'];
  const filter = coachFilterMap[coach];
  if (!filter || filter.length === 0) return null;
  return filter;
}

function getProductFromCoach(coach: string | null): string {
  if (coach === 'couples') return 'couples';
  if (coach === 'joree') return 'joree';
  return 'john';
}

async function retrieveContext(userMessage: string, filterMetadata: object | null = null, coachFilter: string[] | null = null) {
  let embedding: number[];
  try { embedding = await embedText(userMessage); console.log('Embedding generated, length:', embedding.length); } catch (e) { console.error('Embedding failed:', e); return []; }
  const vectorString = JSON.stringify(embedding);
  const rpcParams: any = { query_embedding: vectorString, match_threshold: 0.20, match_count: 5, filter_metadata: filterMetadata };
  if (coachFilter !== null) {
    rpcParams.coach_filter = coachFilter;
  }
  const { data: chunks, error } = await supabase.rpc('match_chunks', rpcParams);
  if (error) { console.error('RAG retrieval error:', JSON.stringify(error)); return []; }
  console.log(`RAG retrieved ${chunks?.length ?? 0} chunks (coach_filter: ${coachFilter ? JSON.stringify(coachFilter) : 'none/all'})`);
  return chunks ?? [];
}

function getCoachDescription(coach: string | null): string {
  const descriptions: Record<string, string> = {
    john: "Dr. John's book, courses, podcasts, and knowledge base",
    joree: "Joree Rose's courses, podcasts, coaching frameworks, and knowledge base",
    couples: "Dr. John and Joree Rose's combined relationship coaching content, including attachment theory, communication frameworks, and couples coaching knowledge base",
  };
  return descriptions[coach || 'john'] || descriptions['john'];
}

function buildContextBlock(chunks: any[], coach: string | null = null): string {
  if (!chunks.length) return '';
  const contextItems = chunks.map((c: any, i: number) => `[${i + 1}] ${c.content}`).join('\n\n');
  const desc = getCoachDescription(coach);
  return `\n\n---\nRELEVANT KNOWLEDGE BASE CONTEXT:\nUse the following excerpts from ${desc} to inform your response. Only use what is relevant.\n\n${contextItems}\n---\n`;
}

async function getLastSessionSummary(userId: string, product: string = 'john'): Promise<{ summary: string; pillar: string; topics: string[]; created_at: string } | null> {
  const { data, error } = await supabase.from('session_summaries').select('summary, pillar, topics, created_at').eq('user_id', userId).eq('product', product).order('created_at', { ascending: false }).limit(1).single();
  if (error || !data) { console.log('No previous session summary found for user (product: ' + product + ')'); return null; }
  console.log(`Found previous session summary from ${data.created_at}, pillar: ${data.pillar}, product: ${product}`);
  return data;
}

function buildReturningUserContext(summary: { summary: string; pillar: string; topics: string[]; created_at: string }): string {
  const date = new Date(summary.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const topicsStr = Array.isArray(summary.topics) && summary.topics.length > 0
    ? summary.topics.join(', ')
    : 'not recorded';
  return `\n\n---\nRETURNING USER — PREVIOUS SESSION CONTEXT (${date}):\nThis user has been here before. Here is a summary of their last session. Use this to provide continuity.\n\n${summary.summary}\n\nPrimary pillar last time: ${summary.pillar}\nTopics discussed: ${topicsStr}\n---\n`;
}

function getSummaryPrompt(coach: string | null): string {
  const titleInstruction = `Also generate a SHORT title (max 60 characters) for this session — like a chapter heading. Examples: "Approach Anxiety & Social Confidence", "Divorce Timeline & Moving Forward", "Toxic Mentor & Workplace Stress". The title should capture the core topic in a way that helps the user find this session later.\n\n`;

  if (coach === 'couples') {
    return `You are summarizing a coaching session for the Love Isn't Enough Relationship Coach (created by Dr. John Schinnerer and Joree Rose). Generate a concise summary (3-5 sentences) in second person that captures: 1. The main relationship topic 2. Key insights or reframes from both John and Joree's perspectives 3. Any commitments or next steps 4. The emotional arc and relational dynamic explored\n\n${titleInstruction}Also classify the PRIMARY coaching pillar: "communication" "intimacy" "attachment" "conflict" "identity" "mixed" "unknown"\n\nAlso list 3-5 key topic tags.\n\nRespond ONLY with valid JSON:\n{"title": "...", "summary": "...", "pillar": "...", "topics": ["..."]}`;
  }
  if (coach === 'joree') {
    return `You are summarizing a coaching session for the Journey Forward AI Coaching Companion (created by Joree Rose, LMFT). Generate a concise summary (3-5 sentences) in second person that captures: 1. The main topic 2. Key insights or reframes 3. Any commitments or next steps 4. The emotional arc\n\n${titleInstruction}Also classify the PRIMARY coaching pillar: "awareness" "permission" "relationships" "identity" "self_trust" "mindfulness" "mixed" "unknown"\n\nAlso list 3-5 key topic tags.\n\nRespond ONLY with valid JSON:\n{"title": "...", "summary": "...", "pillar": "...", "topics": ["..."]}`;
  }
  return `You are summarizing a coaching session for the Inner Leadership AI Coach (created by Dr. John Schinnerer). Generate a concise summary (3-5 sentences) in second person that captures: 1. The main topic 2. Key insights or reframes 3. Any commitments or next steps 4. The emotional arc\n\n${titleInstruction}Also classify the PRIMARY coaching pillar: "stress" "anger" "relationships" "identity" "mixed" "unknown"\n\nAlso list 3-5 key topic tags.\n\nRespond ONLY with valid JSON:\n{"title": "...", "summary": "...", "pillar": "...", "topics": ["..."]}`;
}

function getValidPillars(coach: string | null): string[] {
  if (coach === 'couples') {
    return ['communication', 'intimacy', 'attachment', 'conflict', 'identity', 'mixed', 'unknown'];
  }
  if (coach === 'joree') {
    return ['awareness', 'permission', 'relationships', 'identity', 'self_trust', 'mindfulness', 'mixed', 'unknown'];
  }
  return ['stress', 'anger', 'relationships', 'identity', 'mixed', 'unknown'];
}

async function upsertSessionSummary(sessionId: string, userId: string, openingVariation: string | null, coach: string | null = null): Promise<{ title: string | null; summary: string; pillar: string; topics: string[] } | null> {
  const { data: conversations, error } = await supabase.from('conversations').select('user_message, assistant_message, created_at').eq('session_id', sessionId).order('created_at', { ascending: true });
  if (error || !conversations || conversations.length < 2) { console.log(`Not enough messages to summarize (${conversations?.length ?? 0})`); return null; }
  const transcript = conversations.map(c => `User: ${c.user_message}\nCoach: ${c.assistant_message}`).join('\n\n');
  const summarySystemPrompt = getSummaryPrompt(coach);
  const validPillars = getValidPillars(coach);
  const product = getProductFromCoach(coach);
  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, system: summarySystemPrompt, messages: [{ role: 'user', content: `Here is the full coaching session transcript:\n\n${transcript}` }] }) });
    const data = await claudeRes.json();
    const responseText = data.content?.[0]?.text;
    if (!responseText) { console.error('No response text from Claude for summary'); return null; }
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const pillar = validPillars.includes(parsed.pillar) ? parsed.pillar : 'unknown';
    const title = typeof parsed.title === 'string' && parsed.title.trim().length > 0 ? parsed.title.slice(0, 80) : null;
    if (!title) console.warn('Title missing or empty from Claude summary response — will use fallback');
    const validVariations = ['A','B','C'];
    const variation = openingVariation && validVariations.includes(openingVariation) ? openingVariation : null;

    const { data: existing, error: lookupError } = await supabase.from('session_summaries').select('id').eq('session_id', sessionId).limit(1).single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Summary lookup failed (not a "not found" error):', JSON.stringify(lookupError));
      return null;
    }

    if (existing) {
      const updatePayload: any = {
        summary: parsed.summary,
        pillar: pillar,
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        message_count: conversations.length,
        product: product
      };
      if (title) updatePayload.title = title;
      const { error: updateError } = await supabase.from('session_summaries').update(updatePayload).eq('session_id', sessionId);
      if (updateError) { console.error('Failed to update session summary:', JSON.stringify(updateError)); return null; }
      console.log(`Session summary UPDATED: title="${title}", pillar=${pillar}, msgs=${conversations.length}, product=${product}`);
    } else {
      const { error: insertError } = await supabase.from('session_summaries').insert({
        user_id: userId, session_id: sessionId, title: title || 'Coaching Session',
        summary: parsed.summary, pillar: pillar,
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        message_count: conversations.length, opening_variation: variation, product: product
      });
      if (insertError) { console.error('Failed to insert session summary:', JSON.stringify(insertError)); return null; }
      console.log(`Session summary CREATED: title="${title}", pillar=${pillar}, msgs=${conversations.length}, product=${product}`);
    }

    return { title, summary: parsed.summary, pillar, topics: parsed.topics || [] };
  } catch (err) { console.error('Session summary generation error:', err); return null; }
}

async function generateAndSaveSessionSummary(sessionId: string, userId: string, openingVariation: string | null, coach: string | null = null) {
  return upsertSessionSummary(sessionId, userId, openingVariation, coach);
}

async function logConversation(sessionId: string, userMessage: string, assistantMessage: string, chunkIds: string[], userId: string | null, product: string = 'john') {
  await supabase.from('conversations').insert({ session_id: sessionId, user_message: userMessage, assistant_message: assistantMessage, retrieved_chunk_ids: chunkIds, user_id: userId, product: product });
}

async function getUserProfile(userId: string): Promise<{ email: string; name: string } | null> {
  const { data, error } = await supabase.from('profiles').select('email, display_name').eq('id', userId).single();
  if (error || !data) return null;
  return { email: data.email || '', name: data.display_name || '' };
}

function getTrialExpiredMessage(coach: string | null): string {
  if (coach === 'couples') return 'Your free trial has ended. Ready to keep building your relationship? Visit loveisntenough.net to learn about full access to the Relationship Coach.';
  if (coach === 'joree') return 'Your free trial has ended. Ready to keep going? Visit joreerose.com to learn about full access.';
  return 'Your free trial has ended. Ready to keep going? Visit guidetoself.com to learn about full access.';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const trialToken = body.trial_token || null;
    const coach = body.coach || null;
    const coachFilter = getCoachFilter(coach);
    const product = getProductFromCoach(coach);
    if (coach) console.log(`Coach: ${coach}, filter: ${JSON.stringify(coachFilter)}, product: ${product}`);

    const rubricInstruction = getRubricInstruction(coach);

    // ── start_email_trial ─────────────────────────────────────────────────────
    // Called by landing pages (he-landing, she-landing, we-landing, index).
    // No auth required. Creates or resumes a trial token for email + coach.
    // Returns { token } on success or { status: "trial_expired" } if used up.
    // ──────────────────────────────────────────────────────────────────────────
    if (body.action === 'start_email_trial') {
      const rawEmail = body.email || '';
      const VALID_PRODUCTS = ['john', 'joree', 'couples'];
      const trialProduct = VALID_PRODUCTS.includes(coach) ? coach : 'john';
      const MAX_SESSIONS = 3;
      const MESSAGES_PER_SESSION = 20;

      if (!rawEmail || !/\S+@\S+\.\S+/.test(rawEmail)) {
        return new Response(JSON.stringify({ error: 'Valid email is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const cleanEmail = rawEmail.toLowerCase().trim();

      // Look up any existing trial for this email + product
      const { data: existing } = await supabase
        .from('trial_tokens')
        .select('*')
        .eq('email', cleanEmail)
        .eq('product', trialProduct)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        const totalAllowed = (existing.max_sessions ?? MAX_SESSIONS) * (existing.messages_per_session ?? MESSAGES_PER_SESSION);
        const isExpired = !existing.is_active || (existing.messages_used ?? 0) >= totalAllowed;
        console.log(`start_email_trial: existing token for ${cleanEmail}/${trialProduct} — ${isExpired ? 'EXPIRED' : 'active'}`);
        if (isExpired) {
          return new Response(JSON.stringify({ status: 'trial_expired' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        }
        return new Response(JSON.stringify({ token: existing.token, status: 'active' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // Create a fresh trial token
      const token = crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
      const { data: newToken, error: insertError } = await supabase
        .from('trial_tokens')
        .insert({
          token,
          email: cleanEmail,
          product: trialProduct,
          source: 'landing_page',
          max_sessions: MAX_SESSIONS,
          messages_per_session: MESSAGES_PER_SESSION,
          sessions_used: 0,
          messages_used: 0,
          current_session_messages: 0,
          is_active: true,
        })
        .select()
        .single();

      if (insertError || !newToken) {
        console.error('start_email_trial: insert error:', JSON.stringify(insertError));
        return new Response(JSON.stringify({ error: 'Failed to create trial. Please try again.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      console.log(`start_email_trial: new token created for ${cleanEmail}/${trialProduct}`);
      return new Response(JSON.stringify({ token: newToken.token, status: 'active' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }
    // ── end start_email_trial ─────────────────────────────────────────────────

    if (trialToken) {
      console.log(`Trial token request: ${trialToken}`);
      if (body.action === 'check_trial') {
        const trialStatus = await verifyTrialToken(trialToken);
        return new Response(JSON.stringify({ status: trialStatus.status, messages_remaining: trialStatus.messages_remaining ?? 0, session_messages_remaining: trialStatus.session_messages_remaining ?? 0, sessions_remaining: trialStatus.sessions_remaining ?? 0, first_name: trialStatus.trial?.first_name || '', sessions_used: trialStatus.trial?.sessions_used || 0, messages_used: trialStatus.trial?.messages_used || 0, max_sessions: trialStatus.trial?.max_sessions || 3, messages_per_session: trialStatus.trial?.messages_per_session || 20 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      if (body.action === 'start_new_session') {
        const trialStatus = await verifyTrialToken(trialToken);
        if (!trialStatus.trial) return new Response(JSON.stringify({ error: 'Invalid trial token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        if (trialStatus.trial.sessions_used >= trialStatus.trial.max_sessions) return new Response(JSON.stringify({ status: 'trial_expired', message: 'All trial sessions have been used.' }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
        await supabase.from('trial_tokens').update({ current_session_messages: 0 }).eq('token', trialToken);
        console.log(`Trial ${trialToken}: new session started`);
        return new Response(JSON.stringify({ status: 'active', message: 'New session started.', sessions_remaining: trialStatus.trial.max_sessions - trialStatus.trial.sessions_used, messages_per_session: trialStatus.trial.messages_per_session }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const trialStatus = await verifyTrialToken(trialToken);
      if (trialStatus.status === 'trial_expired') return new Response(JSON.stringify({ trial_status: 'trial_expired', message: getTrialExpiredMessage(coach), messages_remaining: 0, sessions_remaining: 0 }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      if (trialStatus.status === 'session_complete') return new Response(JSON.stringify({ trial_status: 'session_complete', message: `This session is complete. You have ${trialStatus.sessions_remaining} session${trialStatus.sessions_remaining === 1 ? '' : 's'} remaining. Come back anytime.`, messages_remaining: trialStatus.messages_remaining, sessions_remaining: trialStatus.sessions_remaining }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      if (trialStatus.status === 'invalid') return new Response(JSON.stringify({ error: 'Invalid trial token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      const { system, messages, session_id, filter_metadata } = body;
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
      const userText = lastUserMessage?.content || '';
      console.log('Trial user message:', userText.slice(0, 100));

      let contextBlock = '';
      let retrievedChunkIds: string[] = [];
      if (userText) { const chunks = await retrieveContext(userText, filter_metadata ?? null, coachFilter); contextBlock = buildContextBlock(chunks, coach); retrievedChunkIds = chunks.map((c: any) => c.id); }

      // Trial users don't get dream injection (no user_id)
      const augmentedSystem = system + contextBlock + contentGuardrails + rubricInstruction + crisisClassificationInstruction;
      console.log('System prompt length:', augmentedSystem.length);

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: augmentedSystem, messages }) });
      const data = await claudeRes.json();
      const rawAssistantText = data.content?.[0]?.text || '';

      const { cleanMessage: afterRubricStrip, rubricResult } = parseRubricTag(rawAssistantText);
      logRubricResult(rubricResult, session_id || null, product);

      const cleanAssistantText = await processCrisisDetection(userText, afterRubricStrip, session_id || null, null, trialToken, trialStatus.trial?.email || null, trialStatus.trial?.first_name ? `${trialStatus.trial.first_name} ${trialStatus.trial.last_name || ''}`.trim() : null, product);
      if (data.content?.[0]?.text) data.content[0].text = cleanAssistantText;

      await incrementTrialMessage(trialToken, trialStatus.trial);
      if (session_id && cleanAssistantText) {
        try {
          await logConversation(session_id, userText, cleanAssistantText, retrievedChunkIds, null, product);
        } catch (err) {
          console.error('Conversation log error:', err);
        }
      }

      const remainingAfter = (trialStatus.messages_remaining ?? 1) - 1;
      const sessionRemainingAfter = (trialStatus.session_messages_remaining ?? 1) - 1;
      return new Response(JSON.stringify({ ...data, trial_status: 'active', messages_remaining: remainingAfter, session_messages_remaining: sessionRemainingAfter, sessions_remaining: trialStatus.sessions_remaining }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const verifiedUser = await verifyUser(req, body);
    if (verifiedUser) console.log(`Authenticated user: ${verifiedUser.email} (${verifiedUser.id})`);
    else console.log('Unauthenticated request');

    const action = body.action || 'chat';

    if (action === 'summarize') {
      if (!verifiedUser) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const { session_id, opening_variation } = body;
      if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const result = await generateAndSaveSessionSummary(session_id, verifiedUser.id, opening_variation || null, coach);
      return new Response(JSON.stringify({ success: !!result, summary: result }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'get_last_summary') {
      if (!verifiedUser) return new Response(JSON.stringify({ summary: null }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const summary = await getLastSessionSummary(verifiedUser.id, product);
      return new Response(JSON.stringify({ summary }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'get_session_history') {
      if (!verifiedUser) return new Response(JSON.stringify({ sessions: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const { data: sessions, error: historyError } = await supabase
        .from('session_summaries')
        .select('session_id, title, pillar, topics, message_count, created_at, product')
        .eq('user_id', verifiedUser.id)
        .gte('message_count', 3)
        .order('created_at', { ascending: false });
      if (historyError) { console.error('Session history error:', JSON.stringify(historyError)); return new Response(JSON.stringify({ sessions: [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
      console.log(`Returned ${sessions?.length ?? 0} sessions for history sidebar`);
      return new Response(JSON.stringify({ sessions: sessions || [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    if (action === 'get_conversation') {
      if (!verifiedUser) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const { session_id } = body;
      if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      const { data: messages, error: convError } = await supabase
        .from('conversations')
        .select('user_message, assistant_message, created_at')
        .eq('session_id', session_id)
        .eq('user_id', verifiedUser.id)
        .order('created_at', { ascending: true });
      if (convError) { console.error('Conversation fetch error:', JSON.stringify(convError)); return new Response(JSON.stringify({ error: 'Failed to fetch conversation' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }); }
      console.log(`Returned ${messages?.length ?? 0} messages for session ${session_id}`);
      return new Response(JSON.stringify({ messages: messages || [] }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const { system, messages, session_id, filter_metadata, is_first_message } = body;
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
    const userText = lastUserMessage?.content || '';
    console.log('User message:', userText.slice(0, 100));

    let contextBlock = '';
    let retrievedChunkIds: string[] = [];
    if (userText) { const chunks = await retrieveContext(userText, filter_metadata ?? null, coachFilter); contextBlock = buildContextBlock(chunks, coach); retrievedChunkIds = chunks.map((c: any) => c.id); }

    // v19: On first message, inject both longitudinal profile AND last session summary.
    // Order: longitudinal profile first (ground truth about the user) → last session (recency) → RAG (topic-specific).
    let coachingNotesBlock = '';
    let returningUserBlock = '';
    if (is_first_message && verifiedUser) {
      // Fetch both in parallel for speed
      const [coachingNotes, lastSummary] = await Promise.all([
        getCoachingNotes(verifiedUser.id, product),
        getLastSessionSummary(verifiedUser.id, product),
      ]);
      if (coachingNotes) {
        coachingNotesBlock = buildCoachingNotesContext(coachingNotes);
        console.log('v19: Injected longitudinal coaching profile');
      }
      if (lastSummary) {
        returningUserBlock = buildReturningUserContext(lastSummary);
        console.log('v19: Injected last session context from', lastSummary.created_at);
      }
    }

    // System prompt assembly order (v19):
    // 1. Coach system prompt (personality, instructions)
    // 2. Longitudinal coaching profile (who this person is — injected on first message)
    // 3. Last session summary (what we talked about last time — injected on first message)
    // 4. RAG context (relevant knowledge for this specific message)
    // 5. Content guardrails
    // 6. Rubric instruction
    // 7. Crisis classification
    const augmentedSystem = system + coachingNotesBlock + returningUserBlock + contextBlock + contentGuardrails + rubricInstruction + crisisClassificationInstruction;
    console.log('System prompt length:', augmentedSystem.length);

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: augmentedSystem, messages }) });
    const data = await claudeRes.json();
    const rawAssistantText = data.content?.[0]?.text || '';

    let userEmail = verifiedUser?.email || null;
    let userName: string | null = null;
    if (verifiedUser) { const profile = await getUserProfile(verifiedUser.id); if (profile) { userEmail = profile.email || userEmail; userName = profile.name; } }

    // v18+: Parse rubric first, then crisis
    const { cleanMessage: afterRubricStrip, rubricResult } = parseRubricTag(rawAssistantText);
    logRubricResult(rubricResult, session_id || null, product);

    const cleanAssistantText = await processCrisisDetection(userText, afterRubricStrip, session_id || null, verifiedUser?.id || null, null, userEmail, userName, product);
    if (data.content?.[0]?.text) data.content[0].text = cleanAssistantText;

    if (session_id && cleanAssistantText) {
      try {
        await logConversation(session_id, userText, cleanAssistantText, retrievedChunkIds, verifiedUser?.id || null, product);
      } catch (err) {
        console.error('Conversation log error:', err);
      }
    }

    if (session_id && verifiedUser) {
      try {
        await upsertSessionSummary(session_id, verifiedUser.id, body.opening_variation || null, coach);
      } catch (err) {
        console.error('Auto session summary error:', err);
      }
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: { message: 'Server error' } }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
