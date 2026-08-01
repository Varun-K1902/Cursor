import { SolutionNav } from "@/components/workspace/SolutionNav";

export default function SolutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="solution-shell">
      <SolutionNav />
      {children}
    </div>
  );
}
