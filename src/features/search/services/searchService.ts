import type { LeaveRequest, Profile, UserRole } from "../../../lib/database.types";
import { getSupabaseClient } from "../../../lib/supabase";

export type SearchRequest = LeaveRequest & { employee?: Pick<Profile, "full_name" | "job_title"> | null };
export type SearchResults = { people: Profile[]; requests: SearchRequest[] };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function globalSearch(term: string, role: UserRole, currentUserId: string): Promise<SearchResults> {
  const supabase = getSupabaseClient();
  const q = term.trim();
  if (q.length < 2) return { people: [], requests: [] };

  let peopleQuery = supabase.from("profiles").select("*").ilike("full_name", `%${q.replace(/[%_]/g, "")}%`).limit(20);
  if (role === "employee") peopleQuery = peopleQuery.eq("id", currentUserId);
  if (role === "manager") peopleQuery = peopleQuery.or(`id.eq.${currentUserId},manager_id.eq.${currentUserId}`);
  const { data: people, error: peopleError } = await peopleQuery;
  if (peopleError) throw peopleError;

  let requestsQuery = supabase.from("leave_requests").select("*, employee:profiles!leave_requests_employee_id_fkey(full_name, job_title)").order("created_at", { ascending: false }).limit(20);
  const matchingIds = (people ?? []).map((person) => person.id);
  if (UUID.test(q)) requestsQuery = requestsQuery.eq("id", q);
  else if (ISO_DATE.test(q)) requestsQuery = requestsQuery.or(`start_date.eq.${q},end_date.eq.${q}`);
  else if (matchingIds.length > 0) requestsQuery = requestsQuery.in("employee_id", matchingIds);
  else return { people: (people ?? []) as Profile[], requests: [] };
  if (role === "employee") requestsQuery = requestsQuery.eq("employee_id", currentUserId);
  const { data: requests, error: requestsError } = await requestsQuery;
  if (requestsError) throw requestsError;
  return { people: (people ?? []) as Profile[], requests: (requests ?? []) as unknown as SearchRequest[] };
}
