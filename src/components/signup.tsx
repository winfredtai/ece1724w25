// src/components/signup.tsx
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Separator,
} from "@/components/ui";
import { Mail, AlertCircle, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface SignUpProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

const SignUp = ({ onClose, onSwitchToLogin }: SignUpProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的电子邮件地址");
      return;
    }

    setIsLoading(true);

    try {
      // 使用 Supabase 发送魔法链接邮件
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (err) {
      setError("注册失败。请检查您的电子邮件地址并重试。");
      console.error("注册错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 Supabase Google OAuth 注册
  const handleSupabaseGoogleSignUp = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // 指定重定向URL，确保正确处理回调
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }

      // Supabase会自动重定向到Google授权页面
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Google 注册失败: ${error.message}`
          : "Google 注册失败，请重试。";

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Disable scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      ></div>

      <Card className="w-full max-w-md relative bg-background border-border">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            注册 Karavideo.ai
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Success message */}
          {emailSent && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 text-sm flex items-start gap-2">
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
                className="mt-0.5 flex-shrink-0"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>验证邮件已发送！请检查您的收件箱完成注册。</span>
            </div>
          )}

          {/* Error message */}
          {error && !emailSent && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!emailSent && (
            <>
              {/* Google Sign Up Button */}
              <Button
                variant="outline"
                type="button"
                className="w-full flex items-center justify-center gap-2 border-border hover:bg-accent transition-colors"
                onClick={handleSupabaseGoogleSignUp}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                <span>使用 Google 注册</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或使用邮箱注册
                  </span>
                </div>
              </div>

              {/* Email only Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="电子邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    我们将向您发送验证邮件以完成注册。
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "发送验证邮件中..." : "注册"}
                </Button>
              </form>
            </>
          )}

          {emailSent && (
            <Button onClick={onClose} className="w-full mt-2">
              关闭
            </Button>
          )}
        </CardContent>

        <CardFooter className="flex flex-col border-t pt-6">
          <div className="text-center text-sm text-muted-foreground">
            已经有账号？{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-primary hover:text-primary/80 hover:cursor-pointer"
            >
              登录
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUp;
