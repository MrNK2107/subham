import { canonicalFunction, functionDefaults } from "./presets";
import type { Blueprint, Brief, EventType, IdeaDraft } from "./types";

/** Budget lines that belong to the whole event rather than one function. */
const GENERAL: Record<EventType, [string, number][]> = {
  wedding: [
    ["Attire & jewellery", 14],
    ["Invitations", 3],
    ["Return gifts", 4],
    ["Travel & stay for guests", 5],
    ["Contingency", 7],
  ],
  birthday: [
    ["Return gifts", 8],
    ["Invitations", 2],
    ["Contingency", 8],
  ],
  community: [
    ["Permissions & security", 6],
    ["Printing & publicity", 4],
    ["Contingency", 8],
  ],
  festival: [
    ["Pooja samagri", 6],
    ["Gifts & sweets boxes", 10],
    ["Contingency", 8],
  ],
};

/** How each function's share splits across categories. */
const PER_FUNCTION: Record<EventType, [string, number][]> = {
  wedding: [
    ["Venue", 30],
    ["Catering", 42],
    ["Decor & flowers", 16],
    ["Photo & video", 12],
  ],
  birthday: [
    ["Venue", 25],
    ["Food & cake", 40],
    ["Decor & balloons", 15],
    ["Entertainment", 12],
    ["Photography", 8],
  ],
  community: [
    ["Venue & shamiana", 30],
    ["Food", 40],
    ["Sound & lights", 18],
    ["Decor", 12],
  ],
  festival: [
    ["Venue", 20],
    ["Food & sweets", 45],
    ["Decor & lighting", 25],
    ["Music", 10],
  ],
};

const GENERAL_SHARE: Record<EventType, number> = {
  wedding: 33,
  birthday: 18,
  community: 18,
  festival: 24,
};

const TASKS: Record<EventType, [string, number][]> = {
  wedding: [
    ["Fix the budget and guest count with both families", 180],
    ["Book the wedding venue / mandapam", 150],
    ["Book the caterer and schedule a tasting", 120],
    ["Book photographer and videographer", 120],
    ["Finalise the priest / officiant and muhurat", 100],
    ["Shop for wedding attire and jewellery", 90],
    ["Send save-the-dates on WhatsApp", 75],
    ["Book decorator and approve the stage design", 60],
    ["Print and distribute invitations", 45],
    ["Book mehendi artist and makeup artist", 45],
    ["Arrange guest stay and local transport", 30],
    ["Confirm RSVPs and final headcount with caterer", 10],
    ["Prepare return gifts and thamboolam bags", 7],
    ["Pay advances, keep receipts, share the day's run sheet", 2],
  ],
  birthday: [
    ["Decide the theme and guest list", 30],
    ["Book the venue or plan the home setup", 25],
    ["Order the cake (check eggless if needed)", 14],
    ["Send invitations on WhatsApp", 14],
    ["Book entertainer / games host", 12],
    ["Buy decorations and return gifts", 7],
    ["Confirm headcount with the caterer", 3],
    ["Charge camera and set up a photo corner", 1],
  ],
  community: [
    ["Form the organising committee and assign roles", 60],
    ["Get police / municipal permissions", 45],
    ["Book the ground or hall and shamiana", 40],
    ["Collect contributions and open a shared account", 40],
    ["Book sound, lights and generator backup", 30],
    ["Confirm cooks and ration for the community meal", 21],
    ["Print banners and share the poster on WhatsApp groups", 14],
    ["Line up volunteers for food, parking and cleanup", 10],
    ["Arrange first aid, drinking water and dustbins", 5],
  ],
  festival: [
    ["Plan the guest list and menu", 21],
    ["Book the priest for the puja", 14],
    ["Order sweets and snacks", 10],
    ["Buy decorations, diyas and flowers", 7],
    ["Send invitations", 7],
    ["Deep-clean and set up the puja space", 2],
  ],
};

const VENDORS: Record<EventType, [string, string[]][]> = {
  wedding: [
    [
      "Venue / mandapam",
      [
        "Is the hall available for all function days?",
        "What does the rent include: generator, AC, dining hall, rooms?",
        "What is the cancellation and refund policy?",
      ],
    ],
    [
      "Caterer",
      [
        "What is the per-plate price for veg and non-veg?",
        "Is GST included in the quote?",
        "Can we do a tasting before booking?",
      ],
    ],
    [
      "Photographer & videographer",
      [
        "How many people will cover each function?",
        "When will we get edited photos and the film?",
        "Are drone shots and albums included?",
      ],
    ],
    [
      "Decorator",
      [
        "Can we see photos of stages you set up at this venue?",
        "Are fresh flowers used, and which ones are in season?",
        "Who handles teardown and when?",
      ],
    ],
    [
      "Priest / officiant",
      [
        "Which rituals will be performed and how long do they take?",
        "Will you bring the pooja items or should we?",
      ],
    ],
    [
      "Makeup & mehendi artist",
      ["Is a trial included?", "How many people can you cover in a day?"],
    ],
    [
      "Music: nadaswaram / DJ / band",
      ["What is the sound limit at the venue?", "How long is each set?"],
    ],
  ],
  birthday: [
    ["Venue / party hall", ["Is there a kids' play area?", "Can we bring outside food or cake?"]],
    ["Cake shop", ["Can you make it eggless?", "When will it be delivered?"]],
    ["Caterer", ["Is there a kids' menu?", "What is the minimum order?"]],
    ["Decorator", ["Can you do this theme?", "How long is setup?"]],
    ["Entertainer / magician", ["How long is the show?", "Which age group is it for?"]],
  ],
  community: [
    [
      "Shamiana & tent house",
      ["How many people does the tent cover?", "Is setup and removal included?"],
    ],
    ["Sound & lights", ["Is a generator included?", "Who stays on site to operate it?"]],
    ["Cooks / caterer", ["How many people per batch?", "Do you bring vessels and gas?"]],
    ["Printing", ["When can banners be ready?", "Do you deliver?"]],
    ["Priest", ["Which puja will you perform and for how long?"]],
  ],
  festival: [
    ["Priest", ["What time is the muhurat?", "Which items should we arrange?"]],
    [
      "Sweet shop",
      ["Can you pack gift boxes?", "When is the last order date before the festival?"],
    ],
    [
      "Decorator / florist",
      ["Which flowers are available that week?", "Can you do a rangoli too?"],
    ],
    ["Caterer", ["Do you offer a festival thali?", "Is home delivery included?"]],
  ],
};

const IDEAS: Record<EventType, IdeaDraft[]> = {
  wedding: [
    {
      kind: "theme",
      title: "Temple-town elegance",
      description:
        "Brass urulis, banana-leaf runners and marigold strings for a rooted, timeless look.",
    },
    {
      kind: "decor",
      title: "Jasmine and rose canopy",
      description:
        "A floral ceiling over the mandap using local jasmine; it smells as good as it looks.",
    },
    {
      kind: "food",
      title: "Live regional counters",
      description:
        "A dosa counter, chaat station and a filter-coffee cart so every generation finds a favourite.",
    },
    {
      kind: "activity",
      title: "Family quiz at the sangeet",
      description:
        "Questions about the couple, with teams from each side. Breaks the ice between families.",
    },
    {
      kind: "gift",
      title: "Plantable return gifts",
      description: "Seed-paper thank-you cards or tulsi saplings in terracotta pots.",
    },
    {
      kind: "activity",
      title: "WhatsApp photo wall",
      description:
        "A shared album QR code at the entrance; guests' photos appear on a screen at the reception.",
    },
  ],
  birthday: [
    {
      kind: "theme",
      title: "Make it their world",
      description: "Build the party around what the birthday person loves most right now.",
    },
    {
      kind: "decor",
      title: "DIY photo corner",
      description:
        "A backdrop with balloons, a name banner and props for every guest to take home a photo.",
    },
    {
      kind: "food",
      title: "Build-your-own counter",
      description: "Pav bhaji, mini dosas or a sundae bar keep kids and adults happy.",
    },
    {
      kind: "activity",
      title: "Treasure hunt",
      description: "Clues hidden around the venue, ending at the cake.",
    },
    {
      kind: "gift",
      title: "Useful return gifts",
      description: "Storybooks, colouring kits or steel bottles instead of plastic toys.",
    },
  ],
  community: [
    {
      kind: "theme",
      title: "Everyone's festival",
      description:
        "Invite each family to bring one dish or one performance; ownership brings people in.",
    },
    {
      kind: "decor",
      title: "Zero-waste decor",
      description: "Cloth banners, earthen lamps and leaf plates that can be reused or composted.",
    },
    {
      kind: "food",
      title: "Bhandara with token system",
      description: "Colour tokens per batch keep the queue moving and the food warm.",
    },
    {
      kind: "activity",
      title: "Talent hour for kids",
      description:
        "Ten-minute slots for children's dance, songs and recitations before the main programme.",
    },
    {
      kind: "gift",
      title: "Volunteer thank-you badges",
      description:
        "Printed badges and a public thank-you at the end make volunteers return next year.",
    },
  ],
  festival: [
    {
      kind: "theme",
      title: "Heritage evening",
      description: "Traditional outfits encouraged; a small prize for the best dressed family.",
    },
    {
      kind: "decor",
      title: "Diyas and rangoli",
      description: "A rangoli contest at the entrance and diyas along the walkway.",
    },
    {
      kind: "food",
      title: "Homemade sweets exchange",
      description: "Each family brings one sweet; everyone takes home a mixed box.",
    },
    {
      kind: "activity",
      title: "Story time",
      description: "Elders share the story behind the festival with the children.",
    },
    {
      kind: "gift",
      title: "Eco-friendly gift hampers",
      description: "Dry fruits in cloth pouches with a handwritten note.",
    },
  ],
};

/** Run-sheet items for well-known functions; anything else gets a simple three-step flow. */
const RUN: Record<string, [number, string][]> = {
  haldi: [
    [0, "Family gathers, haldi paste ready"],
    [30, "Haldi ceremony"],
    [120, "Lunch"],
  ],
  mehendi: [
    [0, "Mehendi artists start with the bride"],
    [60, "Guests' mehendi and music"],
    [180, "Snacks and chai"],
  ],
  sangeet: [
    [0, "Welcome drinks"],
    [45, "Family performances"],
    [150, "Dinner and open dance floor"],
  ],
  "wedding ceremony": [
    [0, "Groom's arrival and welcome"],
    [60, "Muhurat and main rituals"],
    [150, "Blessings and photos"],
    [180, "Wedding lunch"],
  ],
  reception: [
    [0, "Couple's entry"],
    [30, "Stage greetings and photos"],
    [60, "Dinner opens"],
    [210, "Send-off"],
  ],
  "birthday party": [
    [0, "Guests arrive, welcome games"],
    [60, "Main activity / show"],
    [120, "Cake cutting"],
    [135, "Food and return gifts"],
  ],
};

const at = (start: string, minutes: number) => {
  const [h, m] = start.split(":").map(Number) as [number, number];
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

/**
 * A complete starter plan for when no AI model is available. Written in English; the AI path
 * writes in the person's chosen language.
 */
export function templateBlueprint(brief: Brief): Blueprint {
  const fns = brief.functions.map((name) => ({ name, ...functionDefaults(name) }));
  const weightSum = fns.reduce((acc, f) => acc + f.weight, 0);
  const fnShare = 100 - GENERAL_SHARE[brief.type];

  const budget = [
    ...GENERAL[brief.type].map(([category, percent]) => ({ fn: "General", category, percent })),
    ...fns.flatMap((f) =>
      PER_FUNCTION[brief.type].map(([category, part]) => ({
        fn: f.name,
        category,
        percent: (fnShare * (f.weight / weightSum) * part) / 100,
      })),
    ),
  ];

  const main = fns.find((f) => f.dayOffset === 0) ?? fns[0];
  const runSheet = fns.flatMap((f) => {
    const steps = RUN[(canonicalFunction(f.name) ?? f.name).trim().toLowerCase()] ?? [
      [0, `${f.name} begins`],
      [60, "Main programme"],
      [150, "Food and thanks"],
    ];
    return steps.map(([offset, activity]) => ({ fn: f.name, time: at(f.start, offset), activity }));
  });

  const food =
    brief.food === "mixed" ? "veg and non-veg" : brief.food === "jain" ? "Jain" : "vegetarian";
  const ideas = IDEAS[brief.type].map((idea) =>
    idea.kind === "food" ? { ...idea, description: `${idea.description} Keep it ${food}.` } : idea,
  );

  return {
    functions: fns.map(({ name, dayOffset, start }) => ({ name, dayOffset, start })),
    budget,
    tasks: TASKS[brief.type].map(([title, daysBefore]) => ({ title, daysBefore, fn: main?.name })),
    runSheet,
    vendors: VENDORS[brief.type].map(([category, questions]) => ({ category, questions })),
    ideas,
  };
}
