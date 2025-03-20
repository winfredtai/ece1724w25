// src/components/layout/header.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import Login from "@/components/login";

interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

// export const AppHeader = ({ className }: AppHeaderProps) => {

export const AppHeader: React.FC<AppHeaderProps> = ({
  className,
  ...props
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  useEffect(() => {
    if (dropdownOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        className,
      )}
      {...props}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/60 to-blue-500/60 rounded-full blur opacity-75 animate-pulse"></div>
            <Link href="/" className="block">
              <span className="relative text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                Karavideo.ai
              </span>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="border-primary/20 shadow-sm hover:shadow-md transition-all"
            asChild
          >
            <Link href="/text-to-video">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              <span>创建视频</span>
            </Link>
          </Button>

          {!isAuthenticated && (
            <Button
              className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-md transition-all cursor-pointer"
              onClick={() => setShowLogin(true)}
            >
              登录
            </Button>
          )}

          <div className="relative" ref={dropdownRef}>
            <Avatar
              onClick={toggleDropdown}
              className="cursor-pointer h-10 w-10 border border-gray-700"
            >
              <AvatarImage src={isAuthenticated ? user?.avatarUrl : ""} />
              <AvatarFallback className="bg-gray-400 text-gray-800">
                {isAuthenticated ? user?.initials : "?"}
              </AvatarFallback>
            </Avatar>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 bg-background">
                {isAuthenticated ? (
                  <>
                    <a href="/profile" className="block px-4 py-2 text-sm">
                      Home Page
                    </a>
                    <div
                      onClick={logout}
                      className="block px-4 py-2 text-sm cursor-pointer"
                    >
                      Sign out
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => setShowLogin(true)}
                    className="block px-4 py-2 text-sm cursor-pointer"
                  >
                    Sign in
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </header>
  );
};
