// Content pools for the recommendation-state module (js/recommendation.js).
// Pure data only: no randomness or weather logic lives here.

export const CATEGORIES = ["scorching", "warm", "mild", "cold", "freezing"];

// ---- Clothing layers --------------------------------------------------
// Each layer lists the categories it is allowed to appear in. The
// recommendation module filters a pool down to the layers valid for the
// day's category, then picks one at random (seeded).

export const TOPS = [
  { id: "tshirt", label: "a t-shirt", categories: ["scorching"] },
  { id: "polo", label: "a polo shirt", categories: ["scorching", "warm"] },
  { id: "long-sleeve", label: "a long-sleeve shirt", categories: ["warm", "mild"] },
  { id: "sweater", label: "a sweater", categories: ["mild", "cold", "freezing"] },
  { id: "turtleneck", label: "a turtleneck", categories: ["cold", "freezing"] },
];

export const BOTTOMS = [
  { id: "shorts", label: "shorts", categories: ["scorching", "warm"] },
  { id: "athletic-shorts", label: "athletic shorts", categories: ["scorching", "warm"] },
  { id: "pants", label: "pants", categories: ["warm", "mild"] },
  { id: "jeans", label: "jeans", categories: ["mild", "cold"] },
  { id: "insulated-pants", label: "insulated pants", categories: ["cold", "freezing"] },
  { id: "snow-pants", label: "snow pants", categories: ["freezing"] },
];

// One jacket asset per category that uses one; "mild" is the only category
// where wearing it is itself a random choice (none vs. light-jacket).
export const JACKETS = {
  mild: { id: "light-jacket", label: "a light jacket" },
  cold: { id: "medium-jacket", label: "a medium jacket" },
  freezing: { id: "heavy-jacket", label: "a heavy jacket" },
};

export const FOOTWEAR = {
  open: { id: "open-shoes", label: "sandals" },
  closed: { id: "closed-shoes", label: "closed-toe shoes" },
};

export const ACCESSORIES = {
  scarf: { id: "scarf", label: "a scarf" },
  warmHat: { id: "warm-hat", label: "a warm hat" },
  sunHat: { id: "sun-hat", label: "a sun hat" },
  poncho: { id: "poncho", label: "a poncho" },
  umbrella: { id: "umbrella", label: "an umbrella" },
};

// Per-category rules for the accessories that are tied to the outfit
// category itself (not to a reminder trigger): whether a jacket is worn,
// and whether scarf / warm hat are mandatory, optional (randomized), or
// never worn in that category.
export const CATEGORY_RULES = {
  scorching: { jacket: "never", scarf: "never", warmHat: "never" },
  warm: { jacket: "never", scarf: "never", warmHat: "never" },
  mild: { jacket: "optional", scarf: "never", warmHat: "never" },
  cold: { jacket: "always", scarf: "always", warmHat: "optional" },
  freezing: { jacket: "always", scarf: "always", warmHat: "always" },
};

// ---- Written recommendation wording, per outfit category ---------------

export const RECOMMENDATION_WORDING = {
  scorching: [
    "It's scorching out there — dress light and stay cool.",
    "Heat's cranked all the way up today. Wear as little as is sensible.",
    "A scorcher of a day. Light fabrics and shade are your friends.",
  ],
  warm: [
    "A warm, easygoing day — light clothing will do the trick.",
    "Comfortably warm out. Dress for sunshine, not for layers.",
    "Warm skies ahead — keep it breezy and light.",
  ],
  mild: [
    "Mild and pleasant — a light layer should keep you comfortable.",
    "Nothing extreme today. Dress in the middle and you're set.",
    "A balanced, mild day — a sweater or light jacket covers it.",
  ],
  cold: [
    "It's cold out — bundle up before you head out.",
    "Chilly today. Layers and a jacket are a good call.",
    "Cold air moving in — dress warm and keep covered.",
  ],
  freezing: [
    "Freezing conditions today — every layer counts.",
    "Bundle up all the way; it's bitterly cold out there.",
    "Dangerously cold. Bring the heaviest layers you own.",
  ],
};

// ---- Reminder wording, 3+ variations each -------------------------------

export const REMINDER_WORDING = {
  umbrella: [
    "Rain's likely — bring an umbrella.",
    "Good chance of rain today; grab an umbrella on your way out.",
    "Showers expected — an umbrella will save you.",
  ],
  poncho: [
    "Heavy rain and wind expected — a poncho beats an umbrella today.",
    "It'll be wet and gusty; a poncho will hold up better than an umbrella.",
    "Storm conditions likely — skip the umbrella and wear a poncho.",
  ],
  sunscreen: [
    "UV is high — put on sunscreen before you head out.",
    "Strong sun today; don't forget sunscreen.",
    "High UV exposure expected — sunscreen is a must.",
  ],
  hat: [
    "Sun's strong — a hat will help keep you shaded.",
    "Wear a wide-brimmed hat; UV is elevated today.",
    "Shield your face from the sun with a hat today.",
  ],
  hydration: [
    "It's hot enough to dehydrate fast — bring water.",
    "Stay ahead of the heat and carry extra water today.",
    "High feels-like temperature — keep drinking water through the day.",
  ],
};

// ---- Packing checklist item labels --------------------------------------
// Fixed labels (not randomized); shown when the matching reminder/category
// condition applies. Each shares an icon key with its matching reminder.

export const CHECKLIST_LABELS = {
  umbrella: "Umbrella",
  poncho: "Poncho",
  sunscreen: "Sunscreen",
  hat: "Hat",
  hydration: "Water bottle",
  jacket: "Jacket",
  jacketAndScarf: "Jacket and scarf",
};
