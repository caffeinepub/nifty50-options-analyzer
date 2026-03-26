import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface AnalysisInput {
    vix: number;
    volatilePercentage: number;
    downsidePercentage: number;
    weeklyStopLoss: number;
    monthlyStopLoss: number;
    spot: number;
    upsidePercentage: number;
    monthlyTarget: number;
    weeklyTarget: number;
}
export interface Analysis {
    vix: number;
    volatilePercentage: number;
    downsidePercentage: number;
    weeklyStopLoss: number;
    monthlyStopLoss: number;
    spot: number;
    timestamp: Time;
    upsidePercentage: number;
    monthlyTarget: number;
    weeklyTarget: number;
}
export interface Preferences {
    vix: number;
    expiryDates: Array<string>;
    strike: number;
    premium: number;
    resistanceLevel: number;
    spotPrice: number;
    supportLevel: number;
    optionType: string;
}
export interface backendInterface {
    addAnalysis(analysis: AnalysisInput): Promise<void>;
    clearHistory(): Promise<void>;
    getAnalysisHistory(): Promise<Array<Analysis>>;
    getPreferences(): Promise<Preferences>;
    storePreferences(prefs: Preferences): Promise<void>;
}
