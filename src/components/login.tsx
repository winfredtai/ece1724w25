"use client";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
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
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  X,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/authProvider";

interface LoginProps {
  onClose?: () => void;
  onSwitchToSignUp?: () => void;
}

const Login = ({ onClose, onSwitchToSignUp }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);
  const [showOtherLoginMethods, setShowOtherLoginMethods] = useState(false);
  const router = useRouter();
  const { login, loginWithGoogle, loginWithOtp, verifyOtp, getPreviousPath } =
    useAuth();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize the refs array
  useEffect(() => {
    otpInputRefs.current = otpInputRefs.current.slice(0, 6);
    while (otpInputRefs.current.length < 6) {
      otpInputRefs.current.push(null);
    }
  }, []);

  // Handle sending OTP (primary login method)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的电子邮件地址");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await loginWithOtp(email);

      if (error) throw error;

      setOtpSent(true);
      // Focus on first OTP input after a short delay to allow UI to update
      setTimeout(() => {
        if (otpInputRefs.current[0]) {
          otpInputRefs.current[0].focus();
        }
      }, 100);
    } catch (err) {
      setError("发送验证码失败。请检查您的邮箱地址并重试。");
      console.error("OTP 发送错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const otpString = otp.join("");
      const { error } = await verifyOtp(email, otpString);

      if (error) throw error;

      // Redirect to previous page if available
      const previousPath = getPreviousPath();
      if (previousPath) {
        if (onClose) onClose(); // Close the modal before navigation
        router.push(previousPath);
      } else if (onClose) {
        onClose(); // Close the modal after successful login
      }
    } catch (err) {
      setError("验证码验证失败。请检查您的验证码并重试。");
      console.error("OTP 验证错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d*$/.test(value)) return;

    // Check if this is a paste of a complete 6-digit code
    if (value.length === 6 && /^\d{6}$/.test(value)) {
      const digits = value.split("");
      setOtp(digits);

      // Focus the last input after successful paste
      otpInputRefs.current[5]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Only take the first character
    setOtp(newOtp);

    // Auto-focus next input if current input is filled
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace in OTP inputs
  const handleOtpKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // If current field is empty and backspace is pressed, focus previous field
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle traditional email/password login (secondary method)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 使用 AuthProvider 的 login 函数登录
      const { error } = await login(email, password);

      if (error) throw error;

      // Redirect to previous page if available
      const previousPath = getPreviousPath();
      if (previousPath) {
        if (onClose) onClose(); // Close the modal before navigation
        router.push(previousPath);
      } else if (onClose) {
        onClose(); // Close the modal after successful login
      }
    } catch (err) {
      setError("登录失败。请检查您的凭据并重试。");
      console.error("登录错误:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 Google OAuth 登录
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const { error } = await loginWithGoogle();

      if (error) {
        throw error;
      }

      // loginWithGoogle 会自动重定向到Google授权页面
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `Google 登录失败: ${error.message}`
          : "Google 登录失败，请重试。";

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Reset OTP form
  const handleResendOtp = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
  };

  // Go back to email input
  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtp(["", "", "", "", "", ""]);
  };

  // Toggle between email-only and password login
  const toggleLoginMethod = () => {
    setUsePasswordLogin(!usePasswordLogin);
    setShowOtherLoginMethods(false);
  };

  // Disable scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ top: 0, left: 0 }}
    >
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
            登录 Karavideo.ai
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center gap-2 border-border hover:bg-accent transition-colors"
            onClick={handleGoogleLogin}
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
            <span>通过Google登录</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或者使用邮箱验证码
              </span>
            </div>
          </div>

          {/* Login Form - Either Email or Email+Password */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>

                {usePasswordLogin && (
                  <div className="relative mt-2">
                    <Lock className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={toggleLoginMethod}
                  className="text-sm text-primary hover:underline"
                >
                  {usePasswordLogin ? "使用验证码登录" : "使用密码登录"}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                onClick={usePasswordLogin ? handlePasswordLogin : handleSendOtp}
              >
                {isLoading
                  ? "处理中..."
                  : usePasswordLogin
                    ? "登录"
                    : "发送验证码"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  返回修改邮箱
                </button>
              </div>

              <div className="text-sm text-center mb-2">
                请输入发送到 {email} 的 6 位验证码
              </div>

              <div className="grid grid-cols-6 gap-2 mb-4">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={index === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="text-center px-0 text-lg"
                    disabled={isLoading}
                    ref={(el) => {
                      otpInputRefs.current[index] = el;
                    }}
                    autoFocus={index === 0}
                    onPaste={
                      index === 0
                        ? (e) => {
                            e.preventDefault();
                            const pasteData = e.clipboardData.getData("text");
                            if (pasteData && /^\d{6}$/.test(pasteData)) {
                              handleOtpChange(0, pasteData);
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </div>

              <div className="text-xs text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  重新发送验证码
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || otp.some((digit) => !digit)}
              >
                {isLoading ? "验证中..." : "验证并登录"}
              </Button>
            </form>
          )}

          {/* Other login methods toggle - only show when not in password mode */}
          {!usePasswordLogin && !otpSent && (
            <>
              <button
                type="button"
                onClick={() => setShowOtherLoginMethods(!showOtherLoginMethods)}
                className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground py-2"
              >
                <span>其他登录方式</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showOtherLoginMethods ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Other login methods section */}
              {showOtherLoginMethods && (
                <div className="mt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    type="button"
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                    </svg>
                    <span>SSO 登录</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    type="button"
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>手机号登录</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    type="button"
                    disabled={isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                    <span>GitHub 登录</span>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            没有账号？{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-primary hover:underline"
            >
              注册
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
