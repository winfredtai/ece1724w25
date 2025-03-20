"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProfileRedirect() {
  const router = useRouter();
  const supabase = createClient();
  
  useEffect(() => {
    const checkAuth = async () => {
      // 检查用户是否已登录
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        // 如果已登录，重定向到新的用户profile页面
        router.push("/user/profile");
      } else {
        // 如果未登录，重定向到登录页面
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router, supabase]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
} 