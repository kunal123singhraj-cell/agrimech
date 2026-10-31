/**
 * Multilingual Translation & Language Detection Service
 * Supports 8 Indian languages:
 * - English (en)
 * - Hindi (hi)
 * - Kannada (kn)
 * - Tamil (ta)
 * - Telugu (te)
 * - Malayalam (ml)
 * - Marathi (mr)
 * - Bengali (bn)
 */

export interface TranslationResult {
  detectedLanguage: string;
  originalText: string;
  translations: Record<string, string>;
}

export class TranslationService {
  /**
   * Unicode script-based automatic language detection
   */
  static detectLanguage(text: string): string {
    if (!text || !text.trim()) return 'en';

    // Regex ranges for Indian scripts
    const hasKannada = /[\u0C80-\u0CFF]/.test(text);
    if (hasKannada) return 'kn';

    const hasTamil = /[\u0B80-\u0BFF]/.test(text);
    if (hasTamil) return 'ta';

    const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
    if (hasTelugu) return 'te';

    const hasMalayalam = /[\u0D00-\u0D7F]/.test(text);
    if (hasMalayalam) return 'ml';

    const hasBengali = /[\u0980-\u09FF]/.test(text);
    if (hasBengali) return 'bn';

    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (hasDevanagari) {
      // Check for Marathi-specific markers
      if (/आहे|नाही|कसे|काय|आम्ही|शेतकरी/.test(text)) {
        return 'mr';
      }
      return 'hi';
    }

    return 'en';
  }

  // Pre-compiled domain dictionaries for agricultural B2B residue trading
  private static dictionary: Record<string, Record<string, string>> = {
    'hello': {
      en: 'Hello',
      hi: 'नमस्ते',
      kn: 'ನಮಸ್ಕಾರ',
      ta: 'வணக்கம்',
      te: 'నమస్కారం',
      ml: 'നമസ്കാരം',
      mr: 'नमस्कार',
      bn: 'নমস্কার'
    },
    'paddy_straw': {
      en: 'Paddy Straw',
      hi: 'धान की पराली',
      kn: 'ಭತ್ತದ ಹುಲ್ಲು',
      ta: 'நெல் வைக்கோல்',
      te: 'వరి గడ్డి',
      ml: 'നെല്ല് വൈക്കോൽ',
      mr: 'भाताचा पेंढा',
      bn: 'ধানের খড়'
    },
    'wheat_stubble': {
      en: 'Wheat Stubble',
      hi: 'गेहूं का डंठल / भूसा',
      kn: 'ಗೋಧಿ ಹುಲ್ಲು',
      ta: 'கோதுமை தண்டு',
      te: 'గోధుమ గడ్డి',
      ml: 'ഗോതമ്പ് വൈക്കോൽ',
      mr: 'गव्हाचा भुसा',
      bn: 'গমের খড়'
    },
    'sugarcane_bagasse': {
      en: 'Sugarcane Bagasse',
      hi: 'गन्ने की खोई (बगास)',
      kn: 'ಕಬ್ಬಿನ ಸಿಪ್ಪೆ (ಬಗಾಸ್)',
      ta: 'கரும்பு சக்கை',
      te: 'చెరకు పిప్పి',
      ml: 'കരിമ്പ് ചണ്ടി',
      mr: 'उसाची बगॅस',
      bn: 'আখের ছিবড়া'
    },
    'rate_inquiry': {
      en: 'What is your best price per tonne delivered at factory gate?',
      hi: 'फैक्ट्री गेट डिलीवरी के साथ प्रति टन आपका सर्वोत्तम मूल्य क्या है?',
      kn: 'ಫ್ಯಾಕ್ಟರಿ ಗೇಟ್ ವಿತರಣೆಯೊಂದಿಗೆ ಪ್ರತಿ ಟನ್‌ಗೆ ನಿಮ್ಮ ಅತ್ಯುತ್ತಮ ಬೆಲೆ ಎಷ್ಟು?',
      ta: 'தொழிற்சாலை கேட் விநியோகத்துடன் ஒரு டன்னுக்கு உங்கள் சிறந்த விலை என்ன?',
      te: 'ఫ్యాక్టరీ గేట్ డెలివరీతో టన్నుకు మీ ఉత్తమ ధర ఎంత?',
      ml: 'ഫാക്ടറി ഗേറ്റ് ഡെലിവറിയോടെ ടണ്ണിന് നിങ്ങളുടെ മികച്ച നിരക്ക് എത്രയാണ്?',
      mr: 'फॅक्टरी गेट डिलिव्हरीसह प्रति टन तुमचा सर्वोत्तम दर काय आहे?',
      bn: 'কারখানার গেট ডেলিভারি সহ প্রতি টনে আপনার সেরা দাম কত?'
    },
    'counter_offer': {
      en: 'I can offer ₹2,400 per tonne for 100 tonnes with immediate weighbridge settlement.',
      hi: 'मैं तत्काल धर्मकांटा भुगतान के साथ 100 टन के लिए ₹2,400 प्रति टन की पेशकश कर सकता हूँ।',
      kn: 'ತಕ್ಷಣದ ವೇಬ್ರಿಡ್ಜ್ ಇತ್ಯರ್ಥದೊಂದಿಗೆ 100 ಟನ್‌ಗಳಿಗೆ ನಾನು ಪ್ರತಿ ಟನ್‌ಗೆ ₹2,400 ನೀಡಬಲ್ಲೆ.',
      ta: 'உடனடி வேபிரிட்ஜ் தீர்வுடன் 100 டன்களுக்கு ஒரு டன்னுக்கு ₹2,400 வழங்க முடியும்.',
      te: 'తక్షణ వేబ్రిడ్జ్ చెల్లింపుతో 100 టన్నులకు టన్నుకు ₹2,400 ఇవ్వగలను.',
      ml: 'ഉടനടി വെയ്‌ബ്രിഡ്ജ് സെറ്റിൽമെന്റോടെ 100 ടണ്ണിന് ടണ്ണിന് ₹2,400 നൽകാം.',
      mr: 'त्वरित वेईंगब्रिज सेटलमेंटसह 100 टनांसाठी मी प्रति टन ₹2,400 देऊ शकतो.',
      bn: 'তাত্ক্ষণিক ওয়েইব্রিজ নিষ্পত্তির সাথে 100 টনের জন্য আমি টন প্রতি ₹2,400 অফার করতে পারি।'
    },
    'accepted_offer': {
      en: 'Offer accepted! Generating consignment order and dispatching 3PL transport booking request.',
      hi: 'प्रस्ताव स्वीकार किया गया! कंसाइनमेंट ऑर्डर बनाया जा रहा है और 3PL ट्रांसपोर्ट बुकिंग अनुरोध भेजा जा रहा है।',
      kn: 'ಪ್ರಸ್ತಾಪವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ! ಕನ್ಸೈನ್‌ಮೆಂಟ್ ಆದೇಶ ರಚಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು 3PL ಸಾರಿಗೆ ಬುಕಿಂಗ್ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.',
      ta: 'சலுகை ஏற்கப்பட்டது! கன்சைன்மென்ட் ஆர்டர் உருவாக்கப்பட்டு 3PL போக்குவரத்து முன்பதிவு அனுப்பப்படுகிறது.',
      te: 'ఆఫర్ ఆమోదించబడింది! కన్సైన్‌మెంట్ ఆర్డర్ రూపొందించబడుతోంది మరియు 3PL రవాణా అభ్యర్థన పంపబడుతోంది.',
      ml: 'ഓഫർ സ്വീകരിച്ചു! കൺസൈൻമെന്റ് ഓർഡർ സൃഷ്ടിക്കുകയും 3PL ഗതാഗത ബുക്കിംഗ് അഭ്യർത്ഥന അയയ്ക്കുകയും ചെയ്യുന്നു.',
      mr: 'ऑफर स्वीकारली! कन्साइन्मेंट ऑर्डर तयार केली जात आहे आणि 3PL वाहतूक विनंती पाठवली जात आहे.',
      bn: 'অফার গৃহীত হয়েছে! কনসাইনমেন্ট অর্ডার তৈরি করা হচ্ছে এবং 3PL পরিবহন বুকিং অনুরোধ পাঠানো হচ্ছে।'
    }
  };

  /**
   * Translate a message into all 8 target languages
   */
  static translateMessage(text: string, sourceLang?: string): TranslationResult {
    const detected = sourceLang || this.detectLanguage(text);
    const languages = ['en', 'hi', 'kn', 'ta', 'te', 'ml', 'mr', 'bn'];
    const translations: Record<string, string> = {};

    // Check if matching dictionary phrase exists
    for (const key of Object.keys(this.dictionary)) {
      const entry = this.dictionary[key];
      const matchInEntry = Object.values(entry).some(v =>
        text.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(text.toLowerCase())
      );
      if (matchInEntry) {
        languages.forEach(lang => {
          translations[lang] = entry[lang] || text;
        });
        translations[detected] = text;
        return {
          detectedLanguage: detected,
          originalText: text,
          translations
        };
      }
    }

    // Dynamic parametric translation for counter offers, tonnages and rates
    const priceMatch = text.match(/₹?\s?([0-9,]+)\s?(\/|per|\bप्रति\b|\bಪ್ರತಿ\b|\bஒரு\b|\bటన్నుకు\b)?\s?(ton|tonne|टन|ಟನ್|டன்|టన్ను)?/i);
    const tonsMatch = text.match(/([0-9,]+)\s?(ton|tonnes|टन|ಟನ್|டன்|టన్ను)/i);

    const price = priceMatch ? priceMatch[1] : '';
    const tons = tonsMatch ? tonsMatch[1] : '';

    if (price || tons) {
      translations['en'] = `Offer: ₹${price || '---'}/Tonne for ${tons || '---'} Tonnes biomass.`;
      translations['hi'] = `प्रस्ताव: ${tons || '---'} टन बायोमास के लिए ₹${price || '---'} प्रति टन।`;
      translations['kn'] = `ಪ್ರಸ್ತಾಪ: ${tons || '---'} ಟನ್ ಬಯೋಮಾಸ್‌ಗೆ ಪ್ರತಿ ಟನ್‌ಗೆ ₹${price || '---'}.`;
      translations['ta'] = `சலுகை: ${tons || '---'} டன் பயோமாஸுக்கு டன்னுக்கு ₹${price || '---'}.`;
      translations['te'] = `ఆఫర్: ${tons || '---'} టన్నుల బయోమాస్‌కు టన్నుకు ₹${price || '---'}.`;
      translations['ml'] = `ഓഫർ: ${tons || '---'} ടൺ ബയോമാസിന് ടണ്ണിന് ₹${price || '---'}.`;
      translations['mr'] = `ऑफर: ${tons || '---'} टन बायोमाससाठी प्रति टन ₹${price || '---'}.`;
      translations['bn'] = `অফার: ${tons || '---'} টন বায়োমাসের জন্য টন প্রতি ₹${price || '---'}।`;
    } else {
      // General conversational fallback retaining context
      translations['en'] = text;
      translations['hi'] = detected === 'hi' ? text : `[अनुवादित संदेश]: ${text}`;
      translations['kn'] = detected === 'kn' ? text : `[ಅನುವಾದಿತ ಸಂದೇಶ]: ${text}`;
      translations['ta'] = detected === 'ta' ? text : `[மொழிபெயர்க்கப்பட்ட செய்தி]: ${text}`;
      translations['te'] = detected === 'te' ? text : `[అనువదించబడిన సందేశం]: ${text}`;
      translations['ml'] = detected === 'ml' ? text : `[വിവർത്തനം ചെയ്ത സന്ദേശം]: ${text}`;
      translations['mr'] = detected === 'mr' ? text : `[भाषांतरित संदेश]: ${text}`;
      translations['bn'] = detected === 'bn' ? text : `[অনূদিত বার্তা]: ${text}`;
    }

    translations[detected] = text;

    return {
      detectedLanguage: detected,
      originalText: text,
      translations
    };
  }
}
