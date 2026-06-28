import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { gitConfig } from '@/lib/shared';
import { Icon } from '@/widgets/Icon';
import { FaNpm } from 'react-icons/fa6';

export function baseOptions(): BaseLayoutProps {
  return {
    links: [],
    nav: {
      title: <Icon isOpen />,
    },
    // i18n: {
    //   toc: "Nesta página",
    // },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
