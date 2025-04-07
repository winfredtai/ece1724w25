"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

// 创建一个新组件来处理参数相关的逻辑
function DebugContent() {
  const searchParams = useSearchParams();
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    // 收集所有URL参数作为调试信息
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    setErrorDetails(JSON.stringify(params, null, 2));
  }, [searchParams]);

  return (
    <div className="bg-black/10 p-4 rounded-md overflow-auto text-left">
      <pre className="text-sm">{errorDetails || "无参数信息"}</pre>
    </div>
  );
}

// 加载状态组件
function LoadingState() {
  return (
    <div className="bg-black/10 p-4 rounded-md overflow-auto text-left">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default function AuthDebug() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">认证调试</h1>
          <p className="text-muted-foreground">
            以下是认证过程中的参数信息，可用于调试问题。
          </p>
        </div>

        <Suspense fallback={<LoadingState />}>
          <DebugContent />
        </Suspense>

        <div className="flex flex-col gap-2">
          <Button onClick={() => router.push("/")}>返回首页</Button>
          <Button variant="outline" onClick={() => router.back()}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
}
