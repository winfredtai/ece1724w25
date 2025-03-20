"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { createClient } from "@/utils/supabase/client";

export default function LoginTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      if (error) throw error;
      
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      console.error("登录错误:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });
      
      if (error) throw error;
      
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
      console.error("登录错误:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取会话失败");
      console.error("会话错误:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 py-24">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase登录测试</CardTitle>
          <CardDescription>测试不同的登录方法和会话管理</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
              <pre className="text-xs overflow-auto max-h-60">{result}</pre>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGoogleLogin} disabled={loading}>
              Google登录测试
            </Button>
            
            <Button onClick={handleEmailLogin} disabled={loading} variant="outline">
              邮箱密码登录测试
            </Button>
            
            <Button onClick={checkSession} disabled={loading} variant="secondary">
              检查当前会话
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 