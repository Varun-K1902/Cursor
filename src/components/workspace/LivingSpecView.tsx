"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { useAtlasStore } from "@/lib/store";
import { buildLivingSpec, livingSpecToMarkdown } from "@/lib/living-spec";

export function LivingSpecView() {
  const params = useParams<{ id: string }>();
  const solution = useAtlasStore((s) =>
    s.solutions.find((x) => x.id === params.id),
  );
  const hydrated = useAtlasStore((s) => s.hydrated);

  const doc = useMemo(
    () => (solution ? buildLivingSpec(solution) : null),
    [solution],
  );

  if (!hydrated) {
    return <div className="workspace-loading"><p>Loading…</p></div>;
  }
  if (!solution || !doc) {
    return <div className="workspace-loading"><p>Solution not found.</p></div>;
  }

  const download = () => {
    const md = livingSpecToMarkdown(doc);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${solution.name.replace(/\s+/g, "-").toLowerCase()}-living-spec.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="living-spec">
      <div className="living-spec-toolbar">
        <div>
          <p className="eyebrow">Authoritative artefact</p>
          <h2>Living specification</h2>
          <p>
            Generated from your visual workflows — use this in place of a static
            BRD/SRS for reviews and sign-off.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={download}>
          <Download size={16} />
          Export markdown
        </button>
      </div>

      <article className="spec-document">
        <header>
          <h1>{doc.title}</h1>
          <p>{doc.subtitle}</p>
          <time dateTime={doc.generatedAt}>
            Generated {new Date(doc.generatedAt).toLocaleString()}
          </time>
        </header>

        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((line, i) =>
              line === "" ? <br key={i} /> : <p key={i}>{line}</p>,
            )}
          </section>
        ))}

        <section>
          <h2>9. Requirements catalogue</h2>
          <div className="req-catalogue">
            {doc.requirements.map((req) => (
              <div key={`${req.workflow}-${req.id}`} className="req-block">
                <div className="req-block-head">
                  <h3>{req.label}</h3>
                  <span>
                    {req.kind} · {req.priority} · {req.status}
                  </span>
                </div>
                <p className="req-workflow">{req.workflow}</p>
                <p>{req.summary}</p>
                {req.actors.length > 0 && (
                  <p>
                    <strong>Actors:</strong> {req.actors.join(", ")}
                  </p>
                )}
                {req.systems.length > 0 && (
                  <p>
                    <strong>Systems:</strong> {req.systems.join(", ")}
                  </p>
                )}
                {req.rules.length > 0 && (
                  <ul>
                    {req.rules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                {req.criteria.length > 0 && (
                  <>
                    <p>
                      <strong>Acceptance</strong>
                    </p>
                    <ul>
                      {req.criteria.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
                {req.compliance.length > 0 && (
                  <p className="req-compliance">
                    {req.compliance.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
