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
import { createClient } from "@/utils/supabase/client";
import { User } from '@supabase/supabase-js';

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
  
  // Supabase 状态
  const [supaUser, setSupaUser] = useState<User | null>(null);
  const [isSupaAuthenticated, setIsSupaAuthenticated] = useState(false);
  const supabase = createClient();

  // 获取 Supabase 用户信息
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          return;
        }
        
        if (data.session) {
          setIsSupaAuthenticated(true);
          
          // 获取用户信息
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            return;
          }
          
          if (userData.user) {
            setSupaUser(userData.user);
          }
        } else {
          setIsSupaAuthenticated(false);
          setSupaUser(null);
        }
      } catch (_) {
        // 错误处理，但不使用错误对象
      }
    };
    
    // 立即检查一次
    checkSupabaseAuth();
    
    // 检查cookie是否有登录标记
    const checkAuthCookie = () => {
      const cookies = document.cookie.split(';');
      const authSuccess = cookies.find(cookie => cookie.trim().startsWith('auth_success='));
      
      if (authSuccess) {
        checkSupabaseAuth();
        // 清除cookie以防止重复刷新
        document.cookie = "auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    };
    
    // 页面加载时检查cookie
    checkAuthCookie();
    
    // 添加定时器每10秒检查一次cookie，以捕获重定向后的登录状态
    const cookieInterval = setInterval(checkAuthCookie, 10000);
    
    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsSupaAuthenticated(true);
        setSupaUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsSupaAuthenticated(false);
        setSupaUser(null);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(cookieInterval);
    };
  }, [supabase.auth]);

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
  
  // 处理 Supabase 登出
  const handleSupaLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  // 获取用户展示信息
  const getUserInitials = () => {
    if (supaUser?.user_metadata?.full_name) {
      const nameParts = supaUser.user_metadata.full_name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return supaUser.user_metadata.full_name.substring(0, 2).toUpperCase();
    }
    
    if (supaUser?.email) {
      return supaUser.email.substring(0, 2).toUpperCase();
    }
    
    return "?";
  };
  
  const getAvatarUrl = () => {
    if (supaUser?.user_metadata?.avatar_url) {
      return supaUser.user_metadata.avatar_url;
    }
    
    if (supaUser?.user_metadata?.picture) {
      return supaUser.user_metadata.picture;
    }
    
    return "";
  };

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

          {!isSupaAuthenticated && (
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
                {isSupaAuthenticated ? (
                  <>
                    <Link href="/user/profile" className="block px-4 py-2 text-sm">
                      个人中心
                    </Link>
                    <Link href="/user/creation" className="block px-4 py-2 text-sm">
                      我的创作
                    </Link>
                    <div
                      onClick={handleSupaLogout}
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
