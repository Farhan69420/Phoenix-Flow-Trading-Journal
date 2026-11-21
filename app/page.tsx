import { getUserId } from "@/lib/auth";
import LandingPage from "./components/LandingPage";

export default async function Home() {
  const uid = await getUserId();
  return <LandingPage signedIn={Boolean(uid)} />;
}
