import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import StrategiesVault from "./StrategiesVault";

export default async function Page() {
  if (!(await getUserId())) redirect("/login");
  return <StrategiesVault />;
}
