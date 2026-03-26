export interface ProbabilityResult {
  upside: number;
  downside: number;
  volatile: number;
}

export interface AnalysisResult {
  probs: ProbabilityResult;
  atmStrike: number;
  analysisStrike: number;
  expectedMove: number;
  delta: number;
  target: number;
  stopLoss: number;
  pop: number;
  breakeven: number;
  riskReward: string;
  recommendation: string;
  expectedOptionMove: number;
}

export function computeProbabilities(
  spot: number,
  vix: number,
  supportLevel: number,
  resistanceLevel: number,
): ProbabilityResult {
  let up = 30;
  let down = 40;
  let vol = 30;

  if (vix > 28) {
    up = 10;
    down = 20;
    vol = 70;
  } else if (vix > 22) {
    up = 10;
    down = 30;
    vol = 60;
  } else if (vix < 15) {
    up = 60;
    down = 35;
    vol = 5;
  } else if (vix < 18) {
    up = 50;
    down = 40;
    vol = 10;
  }

  if (spot > resistanceLevel) {
    down += 10;
    up -= 5;
    vol -= 5;
  } else if (spot < supportLevel) {
    up += 10;
    down -= 5;
    vol -= 5;
  }

  const total = up + down + vol;
  return {
    upside: Math.round((up / total) * 100),
    downside: Math.round((down / total) * 100),
    volatile: Math.round((vol / total) * 100),
  };
}

export function computeExpectedMove(spot: number, vix: number): number {
  const raw = ((spot * (vix / 100)) / Math.sqrt(252)) * 1.2;
  return Math.max(40, Math.min(300, Math.round(raw)));
}

export function computeDelta(
  spot: number,
  strike: number,
  optionType: string,
): number {
  const moneyness = (strike - spot) / spot;
  if (optionType === "call") {
    return Math.min(0.85, Math.max(0.15, 0.5 - moneyness * 5));
  }
  return Math.min(-0.15, Math.max(-0.85, -0.5 - moneyness * 5));
}

export function runFullAnalysis(
  spot: number,
  vix: number,
  premium: number,
  optionType: string,
  supportLevel: number,
  resistanceLevel: number,
  strikeInput: number | null,
): AnalysisResult {
  const probs = computeProbabilities(spot, vix, supportLevel, resistanceLevel);
  const atmStrike = Math.round(spot / 50) * 50;
  const analysisStrike =
    strikeInput && !Number.isNaN(strikeInput) ? strikeInput : atmStrike;
  const expectedMove = computeExpectedMove(spot, vix);
  const delta = computeDelta(spot, analysisStrike, optionType);
  const deltaAbs = Math.abs(delta);
  const expectedOptionMove = expectedMove * deltaAbs;
  const target = Math.max(
    premium + 5,
    Math.round(premium + expectedOptionMove * 1.2),
  );
  const stopLoss = Math.max(
    0,
    Math.round(premium - Math.max(expectedOptionMove * 0.6, premium * 0.2)),
  );
  const breakeven =
    optionType === "call" ? analysisStrike + premium : analysisStrike - premium;

  const favorable =
    optionType === "call"
      ? probs.upside + probs.volatile * 0.5
      : probs.downside + probs.volatile * 0.5;
  const pop = Math.min(
    85,
    Math.max(15, Math.round(favorable * (0.6 + deltaAbs * 0.4))),
  );

  const risk = premium - stopLoss;
  const reward = target - premium;
  const riskReward = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : "1:∞";

  let recommendation = "AVOID / WAIT (Low Conviction)";
  if (probs.upside > probs.downside && optionType === "call") {
    recommendation = "BUY CALL (Bullish Bias)";
  } else if (probs.downside > probs.upside && optionType === "put") {
    recommendation = "BUY PUT (Bearish Bias)";
  } else if (probs.volatile > 50) {
    recommendation = "CONSIDER STRADDLE (High Volatility)";
  }

  return {
    probs,
    atmStrike,
    analysisStrike,
    expectedMove,
    delta,
    target,
    stopLoss,
    pop,
    breakeven,
    riskReward,
    recommendation,
    expectedOptionMove: Math.round(expectedOptionMove),
  };
}
