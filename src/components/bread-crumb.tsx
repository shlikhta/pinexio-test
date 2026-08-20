import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  sectionTitle: string;
  pageTitle: string;
  separator?: React.ReactNode;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  sectionTitle,
  pageTitle,
  separator = <ChevronRight size={16} />,
}) => {
  return (
    <div className="flex items-center text-sm">
      <span className="text-gray-600 dark:text-gray-300">{sectionTitle}</span>
      <span className="text-gray-400 dark:text-gray-500 mx-2">{separator}</span>
      <span className="text-gray-600 dark:text-gray-300 font-bold">
        {pageTitle}
      </span>
    </div>
  );
};

export default Breadcrumb;
