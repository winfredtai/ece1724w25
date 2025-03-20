"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function AuthCodeError() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  // 自动重定向倒计时
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">认证错误</h1>
          <p className="text-muted-foreground">
            登录过程中出现了问题。可能是链接已过期或无效。
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/")}>
            返回首页 ({countdown})
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
} 