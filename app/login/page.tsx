import type { Metadata } from "next";
import AuthPanel from "./auth-panel";

export const metadata: Metadata = {
  title: "Account | MockTest",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";
  const message = typeof params.message === "string" ? params.message : "";
  const next = typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard";
  return <main className="page-shell narrow-shell"><AuthPanel next={next} error={error} message={message} /></main>;
}
