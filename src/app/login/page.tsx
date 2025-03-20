"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Login from "@/components/login";
import SignUp from "@/components/signup";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isSupaAuthenticated, setIsSupaAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 检查是否已经登录
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          setIsSupaAuthenticated(true);
          // 已登录，重定向到个人资料页面
          router.push("/user/profile");
        }
      } catch (err) {
        console.error("检查认证状态时出错:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSupabaseAuth();
  }, [router, supabase]);

  const handleOpenModal = (loginMode: boolean) => {
    setIsLoginMode(loginMode);
    setShowModal(true);
  };

  // 如果正在加载或已验证，不显示页面内容
  if (isLoading || isSupaAuthenticated) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>

        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-1 mb-8">
            <div className="bg-background rounded-lg p-6 md:p-8 text-center">
              <h1 className="text-3xl font-bold mb-3">欢迎来到 Karavideo.ai</h1>
              <p className="text-muted-foreground text-lg mb-6">
                登录或注册以管理和创建令人惊艳的AI生成视频
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={() => handleOpenModal(true)}
                >
                  <LogIn className="h-5 w-5" />
                  登录账户
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => handleOpenModal(false)}
                >
                  <UserPlus className="h-5 w-5" />
                  注册账户
                </Button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">
                选择 Karavideo.ai 的理由
              </CardTitle>
              <CardDescription>
                登录后即可体验我们强大的AI视频生成功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="m22 8-6 4 6 4V8Z" />
                      <rect width="12" height="12" x="2" y="6" rx="2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-1">AI视频生成</h3>
                  <p className="text-muted-foreground text-sm">
                    通过简单的文字描述，几分钟内创建高质量AI视频
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect width="18" height="10" x="3" y="11" rx="2" />
                      <circle cx="12" cy="5" r="2" />
                      <path d="M12 7v4" />
                      <line x1="8" x2="16" y1="16" y2="16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-1">个性化控制</h3>
                  <p className="text-muted-foreground text-sm">
                    自定义视频风格、时长和特效，满足您的创意需求
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-1">多语言支持</h3>
                  <p className="text-muted-foreground text-sm">
                    支持多种语言和字幕生成，轻松创建全球化内容
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {isLoginMode
                ? "还没有账户？立即注册使用我们的AI视频创作工具"
                : "已有账户？登录以继续使用我们的AI视频创作工具"}
            </p>
            <Button
              variant="outline"
              onClick={() => handleOpenModal(!isLoginMode)}
              className="hover:bg-primary/10"
            >
              {isLoginMode ? "创建新账户" : "登录账户"}
            </Button>
          </div>
        </div>
      </div>

      {/* Authentication Modals */}
      {showModal && !isLoginMode && (
        <SignUp
          onClose={() => setShowModal(false)}
          onSwitchToLogin={() => setIsLoginMode(true)}
        />
      )}
      {showModal && isLoginMode && (
        <Login
          onClose={() => setShowModal(false)}
          onSwitchToSignUp={() => setIsLoginMode(false)}
        />
      )}
    </>
  );
};

export default LoginPage;
