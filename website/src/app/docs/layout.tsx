import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { Icon } from "@/widgets/Icon";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      // nav={{
      //   ...baseOptions().nav,
      //   title: <Icon variant="docs" />,
      // }}
      // links={[]}
    >
      {children}
    </DocsLayout>
  );
}
