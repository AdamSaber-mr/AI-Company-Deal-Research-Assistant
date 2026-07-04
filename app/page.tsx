import { Suspense } from "react";
import { ChatWelcome } from "@/components/chat/ChatWelcome";

export default function Home() {
  return (
    <Suspense>
      <ChatWelcome />
    </Suspense>
  );
}
