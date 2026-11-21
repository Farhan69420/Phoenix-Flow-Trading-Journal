import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import Dashboard from "./Dashboard";
export default async function Page() {
  if (!(await getUserId())) redirect("/login");
  return <Dashboard />;
}
