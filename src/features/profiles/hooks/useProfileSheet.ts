import { useQuery } from "@tanstack/react-query";
import { getProfileSheet, listFieldDefs } from "../services/profileService";

/** Carga la ficha de una persona + las definiciones de campos custom activas.
 *  El RPC ya filtra qué campos ve el caller según su rol/relación. */
export function useProfileSheet(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["profile-sheet", id],
    queryFn: async () => {
      const [sheet, defs] = await Promise.all([getProfileSheet(id!), listFieldDefs()]);
      return { defs, sheet };
    },
  });
}
