export interface MultiTradeStage {
  id: string;
  parentProjectId: string;
  stageSequence: number;
  trade: string;
  proName?: string;
  curingHours: number;
  status: "WAITING_PREV_STAGE" | "READY_FOR_DISPATCH" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: string;
  readyAt?: string;
}

export const BATHROOM_CREW_SEQUENCE = [
  { sequence: 1, trade: "Plumbing", curingHours: 0, title: "Wall Grooving & Pipe Replacement" },
  { sequence: 2, trade: "Masonry & Waterproofing", curingHours: 24, title: "Brick Seal & Polymer Membrane Curing" },
  { sequence: 3, trade: "Tiling & Grouting", curingHours: 0, title: "Tile Alignment & Epoxy Joint Fill" },
];

/**
 * Feature 13 Core: Assemble a multi-trade sequenced crew for complex repairs
 */
export function initializeMultiTradeCrewCore(parentProjectId: string): MultiTradeStage[] {
  return BATHROOM_CREW_SEQUENCE.map((s) => ({
    id: `stage-${parentProjectId}-${s.sequence}`,
    parentProjectId,
    stageSequence: s.sequence,
    trade: s.trade,
    curingHours: s.curingHours,
    status: s.sequence === 1 ? "READY_FOR_DISPATCH" : "WAITING_PREV_STAGE",
    readyAt: s.sequence === 1 ? new Date().toISOString() : undefined,
  }));
}

/**
 * Feature 13: Complete Stage N and automatically unlock Stage N+1 with curing window
 */
export function completeStageAndAdvanceCrewCore(
  currentStage: MultiTradeStage,
  allStages: MultiTradeStage[]
): {
  updatedCurrent: MultiTradeStage;
  updatedNextStage?: MultiTradeStage;
  curingNotice?: string;
} {
  const updatedCurrent: MultiTradeStage = {
    ...currentStage,
    status: "COMPLETED",
    completedAt: new Date().toISOString(),
  };

  const nextIndex = allStages.findIndex(
    (s) => s.stageSequence === currentStage.stageSequence + 1
  );

  if (nextIndex === -1) {
    return { updatedCurrent };
  }

  const nextStage = allStages[nextIndex];
  const curingNotice =
    currentStage.curingHours > 0
      ? `Mandatory ${currentStage.curingHours}-hour drying/curing window scheduled before ${nextStage.trade} begins.`
      : undefined;

  const readyTime = new Date(
    Date.now() + currentStage.curingHours * 3600000
  ).toISOString();

  const updatedNextStage: MultiTradeStage = {
    ...nextStage,
    status: "READY_FOR_DISPATCH",
    readyAt: readyTime,
  };

  return {
    updatedCurrent,
    updatedNextStage,
    curingNotice,
  };
}
