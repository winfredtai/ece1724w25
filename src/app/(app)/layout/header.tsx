// src/components/layout/header.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Login from "@/components/login";
import { useAuth } from "@/components/authProvider";

interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  className,
  ...props
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the auth provider
  const { user, isAuthenticated, logout, getAvatarUrl, getUserInitials } =
    useAuth();

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

  // 处理登出
  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
  };

  // User display functions are now provided by the auth provider

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
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback className="bg-gray-400 text-gray-800">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 bg-background">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500 truncate">
                      {user?.email}
                    </div>
                    <hr className="my-1" />
                    <Link
                      href="/user/profile"
                      className="block px-4 py-2 text-sm"
                    >
                      个人中心
                    </Link>
                    <Link
                      href="/user/creation"
                      className="block px-4 py-2 text-sm"
                    >
                      我的创作
                    </Link>
                    <div
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm cursor-pointer"
                    >
                      退出登录
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => setShowLogin(true)}
                    className="block px-4 py-2 text-sm cursor-pointer"
                  >
                    登录
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
