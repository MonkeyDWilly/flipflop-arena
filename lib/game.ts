export type FlipFlopType = "D (Data)" | "T (Toggle)" | "SR (Set-Reset)" | "JK";

export type Scenario = {
  type: FlipFlopType;
  state: 0 | 1;
  inputsText: string;
  answer: 0 | 1;
};

const TYPES: FlipFlopType[] = [
  "D (Data)",
  "T (Toggle)",
  "SR (Set-Reset)",
  "JK",
];

export function generateScenario(): Scenario {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const currentState = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;

  let inputsText = "";
  let correctAnswer: 0 | 1 = 0;

  if (type === "D (Data)") {
    const d = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    inputsText = `D = ${d}`;
    correctAnswer = d;
  } else if (type === "T (Toggle)") {
    const t = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    inputsText = `T = ${t}`;
    correctAnswer =
      t === 1 ? ((currentState === 1 ? 0 : 1) as 0 | 1) : currentState;
  } else if (type === "SR (Set-Reset)") {
    const rand = Math.random();
    if (rand < 0.33) {
      inputsText = "S = 0, R = 0";
      correctAnswer = currentState;
    } else if (rand < 0.66) {
      inputsText = "S = 1, R = 0";
      correctAnswer = 1;
    } else {
      inputsText = "S = 0, R = 1";
      correctAnswer = 0;
    }
  } else {
    const j = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    const k = (Math.random() < 0.5 ? 0 : 1) as 0 | 1;
    inputsText = `J = ${j}, K = ${k}`;

    if (j === 0 && k === 0) correctAnswer = currentState;
    else if (j === 1 && k === 0) correctAnswer = 1;
    else if (j === 0 && k === 1) correctAnswer = 0;
    else correctAnswer = (currentState === 1 ? 0 : 1) as 0 | 1;
  }

  return {
    type,
    state: currentState,
    inputsText,
    answer: correctAnswer,
  };
}

export function typeBadgeClasses(type: FlipFlopType): string {
  const base =
    "text-3xl md:text-4xl font-black px-6 py-2 rounded-lg border shadow-inner";
  if (type.includes("D"))
    return `${base} bg-cyan-900 border-cyan-700 text-cyan-100`;
  if (type.includes("T"))
    return `${base} bg-green-900 border-green-700 text-green-100`;
  if (type.includes("SR"))
    return `${base} bg-yellow-900 border-yellow-700 text-yellow-100`;
  return `${base} bg-purple-900 border-purple-700 text-purple-100`;
}
