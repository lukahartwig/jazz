import { LocalNode } from "cojson";
import { Breadcrumbs } from "jazz-inspector";
import { PageStack } from "jazz-inspector";
import type { PageInfo } from "jazz-inspector";
import { usePagePath } from "jazz-inspector";

export default function CoJsonViewer({
  defaultPath,
  node,
}: {
  defaultPath?: PageInfo[];
  node: LocalNode;
}) {
  const { path, addPages, goToIndex, goBack } = usePagePath(defaultPath);

  return (
    <div className="w-full h-screen bg-gray-100 p-4 overflow-hidden">
      <Breadcrumbs path={path} onBreadcrumbClick={goToIndex} />
      <PageStack path={path} node={node} goBack={goBack} addPages={addPages} />
    </div>
  );
}
