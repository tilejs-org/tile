import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { gitConfig } from './shared';
import { Icon } from '@/widgets/Icon';

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
