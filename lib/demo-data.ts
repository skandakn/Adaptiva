import type { Lesson, TutorMessage } from "@/lib/types";

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

export const progressData = [
  { name: "Mon", focus: 24, concepts: 4 },
  { name: "Tue", focus: 32, concepts: 5 },
  { name: "Wed", focus: 18, concepts: 3 },
  { name: "Thu", focus: 42, concepts: 7 },
  { name: "Fri", focus: 35, concepts: 6 },
  { name: "Sat", focus: 28, concepts: 5 },
  { name: "Sun", focus: 38, concepts: 6 }
];

export const modeUsageData = [
  { name: "Simplify", value: 34 },
  { name: "Audio", value: 22 },
  { name: "Focus", value: 18 },
  { name: "Visual", value: 16 },
  { name: "Translate", value: 10 }
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
    id: "personalization",
    title: "Personalization Engine",
    detail:
      "Stores non-sensitive preferences such as reading style, audio speed, language, and learning format."
  },
  {
    id: "experience",
    title: "User Experience",
    detail: "Delivers text, audio, visual notes, concept maps, quizzes, and adaptive study flows."
  }
];
