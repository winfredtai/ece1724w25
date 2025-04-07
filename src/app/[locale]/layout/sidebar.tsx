"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Home,
  Compass,
  Video,
  User,
  ChevronRight,
  Sparkles,
  FolderOpen,
  Lightbulb,
} from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// Use static navigation data
const getNavData = (pathname: string) => ({
  navMain: [
    {
      title: "home",
      url: "/home",
      icon: <Home className="h-5 w-5" />,
      isActive: pathname === "/home",
    },
    {
      title: "explore",
      url: "/explore",
      icon: <Compass className="h-5 w-5" />,
      isActive: pathname === "/explore",
    },
    {
      title: "textToVideo",
      url: "/text-to-video",
      icon: <Video className="h-5 w-5" />,
      isActive: pathname === "/text-to-video",
    },
    {
      title: "imageToVideo",
      url: "/image-to-video",
      icon: <Video className="h-5 w-5" />,
      isActive: pathname === "/image-to-video",
    },
    {
      title: "aiTools",
      url: "/ai-tools",
      icon: <Lightbulb className="h-5 w-5" />,
      isActive: pathname === "/ai-tools",
    },
    {
      title: "user",
      icon: <User className="h-5 w-5" />,
      isActive:
        pathname.startsWith("/user/creation") ||
        pathname.startsWith("/user/profile") ||
        pathname.startsWith("/tools"),
      items: [
        {
          title: "creation",
          url: "/user/creation",
          icon: <Sparkles className="h-4 w-4" />,
          isActive: pathname.startsWith("zh/user/creation"),
        },
        {
          title: "profile",
          url: "/user/profile",
          icon: <FolderOpen className="h-4 w-4" />,
          isActive: pathname.startsWith("/user/profile"),
        },
      ],
    },
  ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();
  const data = getNavData(pathname);

  return (
    <Sidebar
      className="backdrop-blur-sm bg-background/50 border-r border-border/50 shadow-sm"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup className="mt-2">
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem
                key={item.title}
                className="group transition-all duration-200"
              >
                <SidebarMenuButton
                  asChild
                  className={`flex items-center gap-3 transition-all hover:bg-primary/5 ${item.isActive ? "bg-primary/10 text-primary font-medium" : ""}`}
                >
                  <a href={item.url} className="flex items-center gap-3 py-2">
                    <span
                      className={`transition-colors duration-200 ${item.isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                    >
                      {item.icon}
                    </span>
                    <span>{t(item.title)}</span>
                    {item.items?.length && (
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:rotate-90" />
                    )}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub className="animate-in slide-in-from-left-5 duration-200">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title} className="group">
                        <SidebarMenuSubButton
                          asChild
                          isActive={subItem.isActive}
                          className="transition-all hover:bg-primary/5 flex items-center gap-2"
                        >
                          <a
                            href={subItem.url}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={`transition-colors duration-200 ${subItem.isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                            >
                              {subItem.icon}
                            </span>
                            {t(subItem.title)}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
