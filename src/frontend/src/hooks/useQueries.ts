import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Analysis, AnalysisInput, Preferences } from "../backend";
import { useActor } from "./useActor";

export function useGetPreferences() {
  const { actor, isFetching } = useActor();
  return useQuery<Preferences>({
    queryKey: ["preferences"],
    queryFn: async () => {
      if (!actor)
        return {
          vix: 22.4,
          expiryDates: ["27 Mar 2026", "30 Mar 2026"],
          strike: 0,
          premium: 185,
          resistanceLevel: 23500,
          spotPrice: 23114.5,
          supportLevel: 23000,
          optionType: "call",
        };
      return actor.getPreferences();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAnalysisHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Analysis[]>({
    queryKey: ["analysisHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAnalysisHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStorePreferences() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prefs: Preferences) => {
      if (!actor) return;
      return actor.storePreferences(prefs);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["preferences"] }),
  });
}

export function useAddAnalysis() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnalysisInput) => {
      if (!actor) return;
      return actor.addAnalysis(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analysisHistory"] }),
  });
}

export function useClearHistory() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      return actor.clearHistory();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["analysisHistory"] }),
  });
}
