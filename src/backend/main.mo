import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";

actor {
  type Preferences = {
    spotPrice : Float;
    vix : Float;
    expiryDates : [Text];
    optionType : Text;
    premium : Float;
    strike : Float;
    supportLevel : Float;
    resistanceLevel : Float;
  };

  type Analysis = {
    timestamp : Time.Time;
    spot : Float;
    vix : Float;
    upsidePercentage : Float;
    downsidePercentage : Float;
    volatilePercentage : Float;
    weeklyTarget : Float;
    weeklyStopLoss : Float;
    monthlyTarget : Float;
    monthlyStopLoss : Float;
  };

  let maxHistoryEntries = 50;

  var userPreferences : ?Preferences = null;
  var analysisHistory = List.empty<Analysis>();

  public type AnalysisInput = {
    spot : Float;
    vix : Float;
    upsidePercentage : Float;
    downsidePercentage : Float;
    volatilePercentage : Float;
    weeklyTarget : Float;
    weeklyStopLoss : Float;
    monthlyTarget : Float;
    monthlyStopLoss : Float;
  };

  public shared ({ caller }) func storePreferences(prefs : Preferences) : async () {
    userPreferences := ?prefs;
  };

  public query ({ caller }) func getPreferences() : async Preferences {
    switch (userPreferences) {
      case (null) { Runtime.trap("No preferences found") };
      case (?prefs) { prefs };
    };
  };

  public shared ({ caller }) func addAnalysis(analysis : AnalysisInput) : async () {
    let newAnalysis = {
      analysis with
      timestamp = Time.now();
    };
    analysisHistory.add(newAnalysis);
    let historySize = analysisHistory.size();
    if (historySize > maxHistoryEntries) {
      let numToRemove = historySize - maxHistoryEntries;
      let updatedHistory = analysisHistory.toArray().sliceToArray(numToRemove, historySize);
      analysisHistory.clear();
      analysisHistory.addAll(updatedHistory.values());
    };
  };

  public query ({ caller }) func getAnalysisHistory() : async [Analysis] {
    analysisHistory.toArray();
  };

  public shared ({ caller }) func clearHistory() : async () {
    analysisHistory.clear();
  };
};
