"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { X, Menu } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("lg:hidden", className)}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

interface SidebarProps {
  children: ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Desktop sidebar - always visible on lg+ screens */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        {children}
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Spacer for desktop */}
      <div className="w-64 flex-shrink-0 hidden lg:block" />
    </>
  );
}

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
}

export function SidebarContent({ children, className }: SidebarContentProps) {
  const { close } = useSidebar();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Mobile close button */}
      <div className="flex items-center justify-end p-4 lg:hidden">
        <Button variant="ghost" size="sm" onClick={close}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

interface SidebarGroupProps {
  children: ReactNode;
  className?: string;
}

export function SidebarGroup({ children, className }: SidebarGroupProps) {
  return (
    <div className={cn("py-2", className)}>
      {children}
    </div>
  );
}

interface SidebarGroupLabelProps {
  children: ReactNode;
  className?: string;
}

export function SidebarGroupLabel({ children, className }: SidebarGroupLabelProps) {
  return (
    <div className={cn("px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}

interface SidebarMenuProps {
  children: ReactNode;
  className?: string;
}

export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {children}
    </nav>
  );
}

interface SidebarMenuItemProps {
  children: ReactNode;
  className?: string;
}

export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface SidebarMenuButtonProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  isActive?: boolean;
}

export function SidebarMenuButton({ 
  children, 
  className, 
  asChild = false,
  isActive = false 
}: SidebarMenuButtonProps) {
  if (asChild) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        className
      )}>
        {children}
      </div>
    );
  }

  return (
    <button className={cn(
      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-left",
      isActive && "bg-accent text-accent-foreground",
      className
    )}>
      {children}
    </button>
  );
}