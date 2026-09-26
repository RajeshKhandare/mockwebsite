import type { Metadata } from "next";
import TestSession from "./session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Test | MockTest",
  robots: { index: false, follow: false },
};

export default async function TestSessionPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <TestSession attemptId={attemptId} />;
}
