import type { Metadata } from "next";
import ArchiveRiver from "@/components/ArchiveRiver";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "归档" };

export default function ArchivePage() {
  return <ArchiveRiver />;
}
