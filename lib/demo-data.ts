import type { ContentLanguage, Lesson, MindMapNode, TutorMessage } from "@/lib/types";

export const supportOptions = [
  "Dyslexia-friendly reading",
  "Focus support",
  "Simplified explanations",
  "Audio learning",
  "Larger text",
  "High contrast",
  "Translation support",
  "Step-by-step learning",
  "Visual concept maps"
] as const;

export const featuredLesson: Lesson = {
  id: "dna-replication",
  title: "DNA Replication",
  course: "Biology - Cell & Molecular Systems",
  readingTime: "12 min",
  original:
    "DNA replication is a semi-conservative biological process in which the double-stranded DNA molecule unwinds and each original strand serves as a template for the synthesis of a complementary strand. Enzymes such as helicase, primase, DNA polymerase, and ligase coordinate the copying process so genetic information can be transmitted accurately before cell division.",
  simplified:
    "DNA replication is how a cell copies its DNA before it divides. The DNA opens like a zipper. Each side becomes a guide for building a matching new side. At the end, the cell has two DNA molecules with the same instructions.",
  verySimple:
    "A cell needs a copy of its instruction book before it splits. DNA replication makes that copy. One old side and one new side join together to make each DNA molecule.",
  stepByStep: [
    "The DNA double helix opens so the two strands separate.",
    "Each separated strand acts like a template, or guide.",
    "DNA polymerase adds matching bases to each template strand.",
    "Ligase seals small gaps so the new strands become complete.",
    "Two DNA molecules are formed, each with one original strand and one new strand."
  ],
  keyConcepts: [
    "Semi-conservative copying",
    "Base pairing",
    "DNA polymerase",
    "Helicase",
    "Accurate genetic instructions"
  ],
  quiz: [
    {
      question: "Why is DNA replication called semi-conservative?",
      answer: "Each new DNA molecule keeps one original strand and adds one new strand."
    },
    {
      question: "Which enzyme opens the DNA double helix?",
      answer: "Helicase separates the two strands."
    },
    {
      question: "What does DNA polymerase do?",
      answer: "It adds matching bases to build the new DNA strand."
    }
  ],
  mindMap: {
    id: "dna",
    label: "DNA Replication",
    children: [
      {
        id: "open",
        label: "DNA opens",
        children: [
          { id: "helicase", label: "Helicase" },
          { id: "strands", label: "Two template strands" }
        ]
      },
      {
        id: "copy",
        label: "New bases added",
        children: [
          { id: "polymerase", label: "DNA polymerase" },
          { id: "pairing", label: "A-T and C-G pairing" }
        ]
      },
      {
        id: "finish",
        label: "Two copies form",
        children: [
          { id: "ligase", label: "Ligase seals gaps" },
          { id: "accurate", label: "Genetic instructions preserved" }
        ]
      }
    ]
  },
  transcript: [
    {
      time: "00:00",
      text: "Today we are going to discuss how cells copy DNA before division."
    },
    {
      time: "00:26",
      text: "DNA replication is called semi-conservative because each new molecule keeps one old strand."
    },
    {
      time: "01:04",
      text: "Helicase opens the double helix, and DNA polymerase adds matching bases."
    },
    {
      time: "01:48",
      text: "The result is two DNA molecules that carry the same genetic information."
    }
  ]
};

function mapLabels(node: MindMapNode, labels: Record<string, string>): MindMapNode {
  return {
    ...node,
    label: labels[node.id] ?? node.label,
    children: node.children?.map((child) => mapLabels(child, labels))
  };
}

export const mindMapsByLanguage: Record<ContentLanguage, MindMapNode> = {
  English: featuredLesson.mindMap,
  Kannada: mapLabels(featuredLesson.mindMap, {
    dna: "ಡಿಎನ್‌ಎ ಪ್ರತಿಕೃತಿ",
    open: "ಡಿಎನ್‌ಎ ತೆರೆಯುತ್ತದೆ",
    helicase: "ಹೆಲಿಕೇಸ್",
    strands: "ಎರಡು ಟೆಂಪ್ಲೇಟ್ ಸರಪಳಿಗಳು",
    copy: "ಹೊಸ ಬೇಸ್‌ಗಳು ಸೇರುತ್ತವೆ",
    polymerase: "ಡಿಎನ್‌ಎ ಪಾಲಿಮರೇಸ್",
    pairing: "A-T ಮತ್ತು C-G ಜೋಡಿ",
    finish: "ಎರಡು ಪ್ರತಿಗಳು ರೂಪುಗೊಳ್ಳುತ್ತವೆ",
    ligase: "ಲೈಗೇಸ್ ಅಂತರ ಮುಚ್ಚುತ್ತದೆ",
    accurate: "ಆನುವಂಶಿಕ ಸೂಚನೆಗಳು ಉಳಿಯುತ್ತವೆ"
  }),
  Hindi: mapLabels(featuredLesson.mindMap, {
    dna: "डीएनए प्रतिकृति",
    open: "डीएनए खुलता है",
    helicase: "हेलिकेस",
    strands: "दो टेम्पलेट श्रृंखलाएँ",
    copy: "नए बेस जुड़ते हैं",
    polymerase: "डीएनए पॉलीमरेज़",
    pairing: "A-T और C-G जोड़ी",
    finish: "दो प्रतियाँ बनती हैं",
    ligase: "लाइगेस अंतर बंद करता है",
    accurate: "आनुवंशिक निर्देश सुरक्षित रहते हैं"
  }),
  Urdu: mapLabels(featuredLesson.mindMap, {
    dna: "ڈی این اے نقل",
    open: "ڈی این اے کھلتا ہے",
    helicase: "ہیلیکیز",
    strands: "دو سانچہ زنجیریں",
    copy: "نئے بیس جڑتے ہیں",
    polymerase: "ڈی این اے پولیمریز",
    pairing: "A-T اور C-G جوڑی",
    finish: "دو نقول بنتی ہیں",
    ligase: "لائیگیز خلا بند کرتا ہے",
    accurate: "جینیاتی ہدایات محفوظ رہتی ہیں"
  }),
  Tamil: mapLabels(featuredLesson.mindMap, {
    dna: "DNA நகலெடுப்பு",
    open: "DNA திறக்கிறது",
    helicase: "ஹெலிகேஸ்",
    strands: "இரண்டு வார்ப்புரு இழைகள்",
    copy: "புதிய அடிப்பகுதிகள் சேர்கின்றன",
    polymerase: "DNA பாலிமரேஸ்",
    pairing: "A-T மற்றும் C-G ஜோடி",
    finish: "இரண்டு பிரதிகள் உருவாகின்றன",
    ligase: "லைகேஸ் இடைவெளிகளை மூடுகிறது",
    accurate: "மரபணு வழிமுறைகள் காக்கப்படுகின்றன"
  })
};

export const keyConceptsByLanguage: Record<ContentLanguage, string[]> = {
  English: featuredLesson.keyConcepts,
  Kannada: [
    "ಅರ್ಧ-ಸಂರಕ್ಷಿತ ನಕಲು",
    "ಬೇಸ್ ಜೋಡಿ",
    "ಡಿಎನ್‌ಎ ಪಾಲಿಮರೇಸ್",
    "ಹೆಲಿಕೇಸ್",
    "ನಿಖರ ಆನುವಂಶಿಕ ಸೂಚನೆಗಳು"
  ],
  Hindi: [
    "अर्ध-संरक्षी नकल",
    "बेस युग्मन",
    "डीएनए पॉलीमरेज़",
    "हेलिकेस",
    "सटीक आनुवंशिक निर्देश"
  ],
  Urdu: [
    "نیم محفوظ نقل",
    "بیس جوڑ بنانا",
    "ڈی این اے پولیمریز",
    "ہیلیکیز",
    "درست جینیاتی ہدایات"
  ],
  Tamil: [
    "அரை-பாதுகாப்பான நகலெடுப்பு",
    "அடிப்பகுதி இணைப்பு",
    "DNA பாலிமரேஸ்",
    "ஹெலிகேஸ்",
    "துல்லியமான மரபணு வழிமுறைகள்"
  ]
};

export const sampleLessons = [
  featuredLesson,
  {
    ...featuredLesson,
    id: "dna-structure",
    title: "DNA Structure",
    readingTime: "9 min",
    simplified:
      "DNA is shaped like a twisted ladder. The sides are made from sugar and phosphate, and the steps are pairs of bases that hold instructions."
  },
  {
    ...featuredLesson,
    id: "photosynthesis",
    title: "Photosynthesis",
    readingTime: "10 min",
    original:
      "Photosynthesis is a photochemical process in which green plants synthesize organic compounds from carbon dioxide and water using light energy captured by chlorophyll.",
    simplified:
      "Photosynthesis is how plants make food using sunlight. Plants take in water and carbon dioxide, use light, and create glucose for energy."
  },
  {
    ...featuredLesson,
    id: "cellular-respiration",
    title: "Cellular Respiration",
    readingTime: "11 min",
    simplified:
      "Cellular respiration is how cells release usable energy from food. It happens in steps and gives cells the energy they need to work."
  }
];
export const tutorConversation: TutorMessage[] = [
  {
    role: "user",
    content: "Explain DNA replication like I am new to the topic."
  },
  {
    role: "assistant",
    content:
      "Think of DNA as a recipe book. Before a cell divides, it needs a second copy of the recipe book. The DNA opens, each half guides a new matching half, and the cell ends with two complete copies."
  },
  {
    role: "user",
    content: "Why does the old strand matter?"
  },
  {
    role: "assistant",
    content:
      "The old strand acts like a trusted guide. Because bases pair in predictable ways, the cell can use the old strand to build the correct new strand."
  }
];

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const today = new Date();

export const progressData = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(today);
  date.setDate(today.getDate() - (6 - index));
  const isToday = index === 6;
  return {
    name: isToday ? "Today" : weekday.format(date),
    focus: isToday ? 43 : 0,
    concepts: isToday ? 3 : 0
  };
});

export const modeUsageData = [
  { name: "Reading Mode (OpenDyslexic)", value: 1 },
  { name: "Audio", value: 1 },
  { name: "Step-by-step", value: 1 }
];

export const teacherInsightData = [
  { concept: "DNA Polymerase", requests: 42 },
  { concept: "Semi-conservative", requests: 37 },
  { concept: "Base Pairing", requests: 29 },
  { concept: "Ligase", requests: 18 }
];

export const architectureNodes = [
  {
    id: "input",
    title: "Input Layer",
    detail: "Accepts PDF, pasted text, image scans, microphone speech, and recorded video."
  },
  {
    id: "processing",
    title: "Processing Layer",
    detail: "Runs OCR, speech recognition, document parsing, and video audio extraction."
  },
  {
    id: "ai",
    title: "AI Orchestration",
    detail: "Understands concepts, summarizes, simplifies, answers questions, and translates."
  },
  {
    id: "accessibility",
    title: "Accessibility Engine",
    detail: "Transforms the same content according to the learner's accessibility profile."
  },
  {
    id: "ttf",
    title: "Text-to-Figure Module",
    detail:
      "Converts educational text into contextually coherent visual representations. Extracts concepts, detects relationships, selects the appropriate figure type, and renders a deterministic accessible diagram alongside a full text explanation."
  },
  {
    id: "personalization",
    title: "Personalization Engine",
    detail:
      "Stores non-sensitive preferences such as reading style, audio speed, language, and learning format."
  },
  {
    id: "experience",
    title: "User Experience",
    detail: "Delivers text, audio, visual notes, concept maps, quizzes, figures, and adaptive study flows."
  }
];

// ─── Text-to-Figure demo figures ────────────────────────────────────────────

import type { FigureSpec } from "@/lib/types";

export const demoFigures: FigureSpec[] = [
  {
    id: "demo-dna-replication",
    title: "DNA Replication",
    type: "process",
    topic: "Biology",
    complexity: "simple",
    nodes: [
      { id: "n1", label: "DNA double helix", detail: "The starting genetic material" },
      { id: "n2", label: "Strands separate", detail: "Helicase unwinds the helix" },
      { id: "n3", label: "Complementary bases attach", detail: "DNA polymerase adds matching bases" },
      { id: "n4", label: "Gaps are sealed", detail: "Ligase joins the fragments" },
      { id: "n5", label: "Two DNA molecules", detail: "Each with one original and one new strand" }
    ],
    relationships: [
      { from: "n1", to: "n2", label: "Helicase opens" },
      { from: "n2", to: "n3", label: "Polymerase reads" },
      { from: "n3", to: "n4", label: "Fragments joined" },
      { from: "n4", to: "n5", label: "Replication complete" }
    ],
    explanation: [
      "Figure: DNA Replication.",
      "First, the DNA double helix is the starting material inside the cell.",
      "Next, helicase unwinds and separates the two strands of the helix.",
      "Then, DNA polymerase reads each strand and adds complementary matching bases.",
      "After that, ligase seals any remaining gaps in the new strands.",
      "Finally, two complete DNA molecules are formed — each containing one original strand and one newly synthesised strand."
    ],
    sourceConcepts: ["DNA double helix", "Helicase", "DNA polymerase", "Ligase", "Semi-conservative replication"],
    sourceText: "DNA replication is a semi-conservative biological process in which the double-stranded DNA molecule unwinds and each original strand serves as a template for the synthesis of a complementary strand.",
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-water-cycle",
    title: "The Water Cycle",
    type: "cycle",
    topic: "Earth Science",
    complexity: "simple",
    nodes: [
      { id: "n1", label: "Evaporation", detail: "Sun heats water, turning it to vapour" },
      { id: "n2", label: "Condensation", detail: "Vapour rises and cools into clouds" },
      { id: "n3", label: "Precipitation", detail: "Water falls as rain or snow" },
      { id: "n4", label: "Collection", detail: "Water gathers in oceans, lakes, rivers" }
    ],
    relationships: [
      { from: "n1", to: "n2", label: "Rises and cools" },
      { from: "n2", to: "n3", label: "Droplets form" },
      { from: "n3", to: "n4", label: "Runs off or soaks" },
      { from: "n4", to: "n1", label: "Sun heats again" }
    ],
    explanation: [
      "Figure: The Water Cycle.",
      "First, the sun heats surface water causing evaporation — water turns to vapour and rises.",
      "Next, the vapour rises into the atmosphere where it cools and condenses, forming clouds.",
      "Then, the droplets in clouds grow heavy and fall as precipitation — rain, snow, or hail.",
      "Finally, water collects in oceans, lakes, and rivers, and the cycle begins again."
    ],
    sourceConcepts: ["Evaporation", "Condensation", "Precipitation", "Collection", "Water vapour"],
    sourceText: "The water cycle describes how water evaporates from surfaces, rises into the atmosphere, condenses into clouds, and falls back as precipitation.",
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-photosynthesis",
    title: "Photosynthesis",
    type: "process",
    topic: "Biology",
    complexity: "simple",
    nodes: [
      { id: "n1", label: "Sunlight", detail: "Energy source from the sun" },
      { id: "n2", label: "Leaf absorbs light", detail: "Chlorophyll captures sunlight" },
      { id: "n3", label: "Water + CO₂ taken in", detail: "From roots and air stomata" },
      { id: "n4", label: "Glucose produced", detail: "Food for the plant" },
      { id: "n5", label: "Oxygen released", detail: "Released into the air" }
    ],
    relationships: [
      { from: "n1", to: "n2", label: "Absorbed by chlorophyll" },
      { from: "n3", to: "n2", label: "Combined in leaf" },
      { from: "n2", to: "n4", label: "Chemical reaction" },
      { from: "n2", to: "n5", label: "By-product" }
    ],
    explanation: [
      "Figure: Photosynthesis.",
      "First, sunlight provides the energy needed for the process.",
      "The leaf absorbs this light energy using chlorophyll.",
      "At the same time, the plant takes in water through its roots and carbon dioxide from the air.",
      "These ingredients combine in a chemical reaction inside the leaf.",
      "The reaction produces glucose, which the plant uses for energy and growth.",
      "Oxygen is released as a by-product into the surrounding air."
    ],
    sourceConcepts: ["Sunlight", "Chlorophyll", "Water", "Carbon dioxide", "Glucose", "Oxygen"],
    sourceText: "Photosynthesis is the process by which plants use sunlight, water and carbon dioxide to produce glucose and oxygen.",
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-mitosis-meiosis",
    title: "Mitosis vs Meiosis",
    type: "comparison",
    topic: "Cell Biology",
    complexity: "simple",
    leftLabel: "Mitosis",
    rightLabel: "Meiosis",
    nodes: [
      { id: "l1", label: "1 division", side: "left" },
      { id: "l2", label: "2 daughter cells", side: "left" },
      { id: "l3", label: "Genetically identical", side: "left" },
      { id: "l4", label: "46 chromosomes each", side: "left" },
      { id: "l5", label: "Growth & repair", side: "left" },
      { id: "r1", label: "2 divisions", side: "right" },
      { id: "r2", label: "4 daughter cells", side: "right" },
      { id: "r3", label: "Genetically unique", side: "right" },
      { id: "r4", label: "23 chromosomes each", side: "right" },
      { id: "r5", label: "Sexual reproduction", side: "right" }
    ],
    relationships: [],
    explanation: [
      "Figure: Mitosis versus Meiosis.",
      "Mitosis involves one division; meiosis involves two divisions.",
      "Mitosis produces two daughter cells; meiosis produces four.",
      "Mitosis produces genetically identical cells; meiosis produces genetically unique cells.",
      "Mitosis preserves 46 chromosomes per cell; meiosis halves this to 23.",
      "Mitosis is used for growth and tissue repair; meiosis is used for sexual reproduction."
    ],
    sourceConcepts: ["Mitosis", "Meiosis", "Cell division", "Chromosomes", "Genetic variation"],
    sourceText: "Mitosis produces two genetically identical daughter cells for growth and repair. Meiosis produces four genetically unique cells used in sexual reproduction.",
    createdAt: new Date().toISOString()
  }
];
