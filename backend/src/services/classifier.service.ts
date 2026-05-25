/**
 * Classifier Service — Dual-layer complaint classification
 *
 * Layer 1: Regex scanner for safety/fraud keywords (instant, no dependencies)
 * Layer 2: BERT sentiment analysis via @xenova/transformers with a local fallback
 *
 * Returns a priority level: HIGH | MEDIUM | LOW
 */

export type ClassificationResult = {
  priority: "HIGH" | "MEDIUM" | "LOW";
  regexFlags: string[];     // matched regex categories
  sentiment: {
    label: string;          // "POSITIVE" | "NEGATIVE" | "NEUTRAL"
    score: number;          // 0-1 confidence
    source: "bert" | "fallback";
  };
};

// ── Layer 1: Regex Patterns (English, Transliterated/Romanized, Devanagari, & Gujarati Scripts) ──

const SAFETY_REGEX =
  /\b(abuse|abused|assault|assaulted|harass|harassment|injur|injured|injury|hurt|threat|threaten|hit|attack|attacked|weapon|bite|biting|bitten|bleed|bleeding|emergency|dangerous|unsafe|poison|accident|hospital|bimari|bemar|bimar|tabiyat|kharab|dard|chot|lohi|khoon|aggressive|gussa|chaku|khanjar)\b|गाली|मार|चोट|खून|दर्द|बीमार|तबीयत|अस्पताल|खतरा|जहर|ગાળ|માર|ઈજા|લોહી|દુખાવો|બીમાર|તબિયત|હોસ્પિટલ|ઝેર|જોખમ/i;

const FRAUD_REGEX =
  /\b(scam|fraud|cheat|cheated|fake|illegal|steal|stole|stolen|rob|robbed|commission|bypass|cash|gpay|paytm|off[- ]?platform|paisa|paise|direct\s+pay|offline|loot|cheating|rishwat|ghoos|chori|luto)\b|घोटाला|धोखा|चोरी|कैश|पैसा|लूट|रिश्वत|કૌભાંડ|છેતરપિંડી|ચોરી|રોકડા|પૈસા|લૂંટ|લાંચ/i;

const CANCEL_REGEX =
  /\b(cancel|reschedule|abort|change\s+time|not\s+free|busy|dont\s+need|skip|postpone|badlo|reschedule|badal|nahi\s+aana|cancel\s+kar|cancel\s+karna|na\s+pad|nakar)\b|रद्द|कैंसिल|बदलो|नहीं|आना|રદ|કેન્સલ|બદલો|નથી/i;

const OVERCHARGE_REGEX =
  /\b(overcharge|overcharged|extra\s+fee|extra\s+charge|charged\s+extra|more\s+money|upfront|double\s+pay|paid\s+already|refund|excessive|additional\s+cost|extra\s+paise|extra\s+paisa|double\s+paisa|jyada\s+peise|vadhare\s+paisa)\b|ज्यादा|पैसे|अतिरिक्त|रिफंड|डबल|વધારાના|પૈસા|વધુ/i;

const NO_CALL_REGEX =
  /\b(did\s+not\s+call|didnt\s+call|no\s+call|no\s+response|never\s+called|not\s+calling|didn't\s+call|phone\s+nahi|call\s+nahi|switch\s+off|phone\s+off|unavailable|kapai)\b|कॉल|नहीं|फोन|बंद|નો|કોલ|નથી/i;

const NO_ANSWER_REGEX =
  /\b(didn't\s+pick|did\s+not\s+pick|not\s+picking|no\s+reply|unreachable|tried\s+calling|called\s+multiple|user\s+not\s+available|not\s+answering|no\s+answer|phone\s+nahi\s+uthaya|ring|no\s+response|uthaya\s+nahi|pick\s+nahi)\b|उठाया|जवाब|ઉપાડ્યો/i;

const LATE_ARRIVAL_REGEX =
  /\b(late|delay|waiting|delayed|not\s+on\s+time|behind\s+schedule|deri|late\s+aya|time\s+par\s+nahi|modu|vela\s+nahi|dhilu|raah\s+joya)\b|देरी|लेट|समय|इंतजार|મોડું|સમયસર|રાહ/i;

const BEHAVIOR_ISSUE_REGEX =
  /\b(rude|rough|behavior|attitude|screamed|shouted|impolite|misbehave|insult|batameez|chilla|gussa\s+kiya|tameez\s+nahi|badtameez|galat\s+tarika|tochdu|khotu\s+bolya|ladai)\b|तमीज|बदतमीज|चिल्लाया|लड़ाई|गुस्सा|ગેરવર્તણૂક|ચીસો|લડાઈ|ગુસ્સો/i;

const SERVICE_QUALITY_REGEX =
  /\b(bad\s+service|poor\s+quality|dirty|ganda|kharab|incomplete|haircut\s+bad|chot\s+lag\s+gayi|cut|treatment\s+wrong|safai\s+nahi|messy|smelly|injured\s+pet|gandagi|barabar\s+nahi|kharab\s+kaam|nakhun\s+kat\s+diya|kachra|saru\s+nathi|khotu\s+kam)\b|खराब|गंदा|अधूरा|कचरा|गलत|ઇલાજ|ખરાબ|ગંદુ|અધૂરું|કચરો|નુકસાન/i;

const PRESCRIPTION_ISSUE_REGEX =
  /\b(prescription|medicine|doses|drugs|report|medicines|dawa|dawae|medicine\s+list|parcha|likh\s+ke\s+nahi\s+diya|dava\s+lakhi\s+nahi|parchi)\b|दवा|पर्ची|लिखकर|દવા|પ્રિસ્ક્રિપ્શન|લખીને/i;

const APP_BUG_REGEX =
  /\b(app\s+bug|crash|login\s+issue|otp\s+issue|otp\s+didn't\s+come|screen\s+blank|error|hang|frozen|not\s+loading|otp\s+nahi\s+aya|app\s+chal\s+nahi\s+raha|login\s+nahi\s+ho\s+raha|chalu\s+nahi\s+thatu)\b|एप|ओटीपी|चल|એપ|ઓટીપી|ચાલુ/i;

// Partner-specific complaints against customers
const USER_ABSENT_REGEX =
  /\b(user\s+not\s+home|not\s+available|no\s+show|lock|locked|house\s+closed|no\s+response|ghar\s+par\s+nahi|tala|darwaza\s+band|ghar\s+band|not\s+picking|phone\s+nahi\s+uthaya)\b|ताला|ताला|बंद|घर|નથી|તાળું|બંધ/i;

const PET_AGGRESSIVE_REGEX =
  /\b(bit\s+me|biting|bitten|aggressive\s+pet|wild\s+dog|attacked\s+me|unsafe\s+pet|pet\s+attacked|kutte\s+ne\s+kata|kat\s+liya|khoon|lohi|bleed)\b|काटा|हमला|कुत्ता|જંગલી|કુતરો|કરડ્યો|હુમલો/i;

const USER_BEHAVIOR_REGEX =
  /\b(user\s+rude|customer\s+rude|shouted\s+at\s+me|screamed\s+at\s+me|abused\s+me|user\s+abused|misbehaved|customer\s+attitude|tameez\s+nahi|badtameez|gussa\s+kiya|chilla|galat\s+behavior|tochdu)\b|व्यवहार|चिल्लाया|लड़ाई|ગેરવર્તણૂક|ચીસો/i;

const PAYMENT_REFUSAL_REGEX =
  /\b(refused\s+to\s+pay|no\s+payment|declined\s+payment|refused\s+cash|money\s+issue|paisa\s+nahi\s+diya|pay\s+nahi\s+kiya|refuse\s+kiya|nathi\s+aapyu|paisa\s+nathi\s+didha)\b|पैसे|नहीं|दिए|नकार|નથી|આપ્યા/i;

const LOCATION_INCORRECT_REGEX =
  /\b(wrong\s+address|incorrect\s+address|wrong\s+location|invalid\s+location|cannot\s+find|cant\s+locate|mil\s+nahi\s+raha|pata\s+galat|location\s+galat|address\s+khotu|nathi\s+malto)\b|गलत|पता|लोकेशन|રસ્તો|ખોટું|સરનામું/i;

function regexScan(text: string): string[] {
  const flags: string[] = [];
  if (SAFETY_REGEX.test(text)) flags.push("SAFETY");
  if (FRAUD_REGEX.test(text)) flags.push("FRAUD");
  if (CANCEL_REGEX.test(text)) flags.push("CANCEL");
  if (OVERCHARGE_REGEX.test(text)) flags.push("OVERCHARGE");
  if (NO_CALL_REGEX.test(text)) flags.push("NO_CALL");
  if (NO_ANSWER_REGEX.test(text)) flags.push("NO_ANSWER");
  if (LATE_ARRIVAL_REGEX.test(text)) flags.push("LATE_ARRIVAL");
  if (BEHAVIOR_ISSUE_REGEX.test(text)) flags.push("BEHAVIOR_ISSUE");
  if (SERVICE_QUALITY_REGEX.test(text)) flags.push("SERVICE_QUALITY");
  if (PRESCRIPTION_ISSUE_REGEX.test(text)) flags.push("PRESCRIPTION_ISSUE");
  if (APP_BUG_REGEX.test(text)) flags.push("APP_BUG");
  if (USER_ABSENT_REGEX.test(text)) flags.push("USER_ABSENT");
  if (PET_AGGRESSIVE_REGEX.test(text)) flags.push("PET_AGGRESSIVE");
  if (USER_BEHAVIOR_REGEX.test(text)) flags.push("USER_BEHAVIOR");
  if (PAYMENT_REFUSAL_REGEX.test(text)) flags.push("PAYMENT_REFUSAL");
  if (LOCATION_INCORRECT_REGEX.test(text)) flags.push("LOCATION_INCORRECT");
  return flags;
}

// ── Layer 2: BERT Sentiment Analysis ─────────────────────────────────────

// Negative-sentiment words for the fallback scorer
const NEG_WORDS = new Set([
  "bad", "terrible", "awful", "worst", "horrible", "disgusting", "angry",
  "furious", "disappointed", "pathetic", "useless", "rude", "aggressive",
  "negligent", "careless", "rough", "dirty", "late", "never", "poor",
  "unacceptable", "unprofessional", "mean", "scary", "worried", "ruined",
  "damaged", "broken", "lost", "missing", "overcharged", "fraud", "scam",
]);

const POS_WORDS = new Set([
  "good", "great", "excellent", "amazing", "wonderful", "fantastic",
  "friendly", "gentle", "clean", "professional", "punctual", "happy",
  "satisfied", "love", "thank", "thanks", "best", "perfect", "awesome",
]);

function fallbackSentiment(text: string): { label: string; score: number } {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  let negCount = 0;
  let posCount = 0;

  for (const w of words) {
    if (NEG_WORDS.has(w)) negCount++;
    if (POS_WORDS.has(w)) posCount++;
  }

  const total = negCount + posCount || 1;
  const negRatio = negCount / total;

  if (negCount > posCount && negRatio > 0.5) {
    return { label: "NEGATIVE", score: Math.min(0.5 + negRatio * 0.4, 0.95) };
  }
  if (posCount > negCount) {
    return { label: "POSITIVE", score: Math.min(0.5 + (posCount / total) * 0.4, 0.95) };
  }
  return { label: "NEUTRAL", score: 0.5 };
}

// Lazy-loaded BERT pipeline (loads on first call, cached afterwards)
let bertPipeline: any = null;
let bertLoadFailed = false;

async function getBertSentiment(text: string): Promise<{ label: string; score: number } | null> {
  if (bertLoadFailed) return null;

  try {
    if (!bertPipeline) {
      // Dynamic import — @xenova/transformers is optional
      const { pipeline } = await import("@xenova/transformers" as any);
      bertPipeline = await pipeline(
        "sentiment-analysis",
        "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
      );
    }

    const result = await bertPipeline(text, { topk: 1 });
    const top = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0][0] : result[0]) : result;

    return {
      label: top.label === "NEGATIVE" ? "NEGATIVE" : "POSITIVE",
      score: top.score ?? 0.5,
    };
  } catch {
    console.warn("[Classifier] BERT model unavailable, using fallback scorer");
    bertLoadFailed = true;
    return null;
  }
}

// ── Combined Classifier ──────────────────────────────────────────────────

export async function classifyComplaint(text: string): Promise<ClassificationResult> {
  // Layer 1: Regex
  const regexFlags = regexScan(text);

  // If regex matched safety, fraud, or pet aggression keywords, immediately escalate
  if (
    regexFlags.includes("SAFETY") ||
    regexFlags.includes("FRAUD") ||
    regexFlags.includes("PET_AGGRESSIVE")
  ) {
    return {
      priority: "HIGH",
      regexFlags,
      sentiment: { label: "NEGATIVE", score: 1.0, source: "bert" },
    };
  }

  // Layer 2: BERT (or fallback)
  const bertResult = await getBertSentiment(text);
  let sentiment: ClassificationResult["sentiment"];

  if (bertResult) {
    sentiment = { ...bertResult, source: "bert" };
  } else {
    const fb = fallbackSentiment(text);
    sentiment = { ...fb, source: "fallback" };
  }

  // Determine priority from sentiment
  let priority: ClassificationResult["priority"] = "LOW";

  if (sentiment.label === "NEGATIVE" && sentiment.score > 0.85) {
    priority = "HIGH";
  } else if (sentiment.label === "NEGATIVE" && sentiment.score > 0.5) {
    priority = "MEDIUM";
  }

  return { priority, regexFlags, sentiment };
}
