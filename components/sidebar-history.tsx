"use client";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
} from "@/components/ui/sidebar";
import { useSession } from "@/providers/session-provider";
import { SidebarChatsList } from "./sidebar-chats-list";

export function SidebarHistory() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarChatsList />
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
