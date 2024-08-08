import { Database } from "@/lib/database.types";
import { IBusinessContact } from "@/types/businessContact";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useCallback } from "react";

export default function useMockFunctions() {

  const getKYCPermissioned = useCallback(
    async (walletAddress: string, testMode: boolean) => true,
    []
  );

  const getKYBPermissioned = useCallback(
    async (walletAddress: string, testMode: boolean) =>
      true,
    []
  );

  const getPools = useCallback(
    async () => [
      { from_token: "tokenA" },
      { from_token: "tokenB" }
    ],
    []
  );

  const getTokens = useCallback(
    async () => [
      { id: "tokenA" },
      { id: "tokenB" }
    ],
    []
  );

  const getLeaderboard = useCallback(
    async () =>
      true,
    []
  );

  const getRisk = useCallback(
    async (address: string) =>
      true,
    []
  );

  const saveRisk = useCallback(
    async (address: string, score: string, info: string) =>
      true,
    []
  );

  const submitBusinessForm = useCallback(
    async (walletAddress: string, formData: IBusinessContact, mode: boolean) =>
      true,
    []
  );

  return {
    getKYCPermissioned,
    getKYBPermissioned,
    getPools,
    getTokens,
    getLeaderboard,
    getRisk,
    saveRisk,
    submitBusinessForm,
  };
}
