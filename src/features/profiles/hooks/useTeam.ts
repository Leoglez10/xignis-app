import { useQuery } from "@tanstack/react-query";
import { listMyTeam } from "../services/profileService";
export function useTeam(userId?: string) { return useQuery({ queryKey: ["team", userId ?? "current"], queryFn: listMyTeam }); }
