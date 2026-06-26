import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

import * as TabsComponents from "fumadocs-ui/components/tabs";
import * as TypeTableComponents from "fumadocs-ui/components/type-table";
import * as CardComponents from "fumadocs-ui/components/card";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,

    ...CardComponents,
    ...TabsComponents,
    ...TypeTableComponents,

    ...components,
  } satisfies MDXComponents;
}
