import { createFileRoute } from "@tanstack/react-router";
import { AshlineGame } from "@/components/game/AshlineGame";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AshlineGame />;
}
