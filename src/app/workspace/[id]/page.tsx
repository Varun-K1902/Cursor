import { redirect } from "next/navigation";

export default async function SolutionIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/workspace/${id}/map`);
}
