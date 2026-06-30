import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/components/layouts/shared";
import { NavbarLinks } from "@/components/NavbarLinks";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: "custom",
          on: "nav",
          children: <NavbarLinks />,
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}