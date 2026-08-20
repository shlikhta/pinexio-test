'use client';

import React from 'react';
import Link from 'next/link';
import SearchDialog from '@/components/search-dialog';
import Image from 'next/image';
import {
  SidebarProvider,
  SidebarLayout,
  MainContent,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeaderLogo,
  SidebarHeaderTitle,
  UserAvatar,
  NestedLink,
  useSidebar,
} from '@/components/sidebar';
import { useRouter } from 'next/navigation';

import Header from '@/components/header';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/button';
import type { SidebarNav, SidebarPage } from '@/lib/sidebar';

// Root-level docs have no icon, so unlike a SidebarMenuItem (which falls
// back to showing just its icon) they have nothing sensible to show when
// the sidebar is collapsed to icon-only mode — hide them entirely then.
// Needs useSidebar() itself since DocsShell renders the SidebarProvider
// that hook depends on, so it can't be called in DocsShell's own body.
function RootPageLinks({ pages }: { pages: SidebarPage[] }) {
  const { isOpen } = useSidebar();
  if (!isOpen) return null;

  return (
    <>
      {pages.map((page) => (
        <NestedLink key={page.href} href={page.href}>
          {page.title}
        </NestedLink>
      ))}
    </>
  );
}

export default function DocsShell({
  rootPages,
  sections,
  children,
}: SidebarNav & {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <SidebarLayout>
      {/* Left Sidebar Provider */}
      <SidebarProvider
        defaultSide="left"
        defaultMaxWidth={280}
        showIconsOnCollapse={true}
      >
        <Sidebar>
          <SidebarHeader>
            <SidebarHeaderLogo
              logo={
                <Image
                  alt="logo"
                  className={'h-auto w-aut dark:invert'}
                  width={100}
                  height={100}
                  src={`/logos/pinedocs.png`}
                />
              }
            />

            <Link href={'/'} className="flex flex-1 gap-3">
              <SidebarHeaderTitle>
                PINE<span className="text-4xl">X</span>IO
              </SidebarHeaderTitle>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <RootPageLinks pages={rootPages} />
            {sections.map((section) => (
              <SidebarMenuItem
                isCollapsable={section.pages.length > 0}
                key={section.title}
                label={section.title}
                icon={section.icon}
              >
                {section.pages.map((page) => (
                  <NestedLink key={page.href} href={page.href}>
                    {page.title}
                  </NestedLink>
                ))}
              </SidebarMenuItem>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <UserAvatar>
              {
                <Image
                  alt="logo"
                  src={'https://avatars.githubusercontent.com/u/24631970?v=4'}
                  width={100}
                  height={100}
                />
              }
            </UserAvatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Sanjay Rajeev
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                sanjayc208@gmail.com
              </span>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <MainContent>
          <Header className="justify-between py-2">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">Documentation</h1>
            </div>
            <div className="flex gap-2 items-center pr-0 lg:pr-8">
              <SearchDialog />
              <ModeToggle />
              <Button
                onClick={() =>
                  router.push('https://github.com/sanjayc208/pinedocs')
                }
              >
                {/*<Github className="h-[1.2rem] w-[1.2rem] transition-all" />*/}
              </Button>
            </div>
          </Header>
          <main className="overflow-auto p-6">{children}</main>
        </MainContent>
      </SidebarProvider>
    </SidebarLayout>
  );
}
