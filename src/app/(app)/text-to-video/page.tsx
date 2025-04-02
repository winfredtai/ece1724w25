"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  RadioGroup,
  RadioGroupItem,
  Label,
  Textarea,
} from "@/components/ui";
import { Film, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { generateVideo } from "@/services/video";
import { useAuth } from "@/components/authProvider";
import { createClient } from "@/utils/supabase/client";

interface VideoGenerationParams {
  prompt: string;
  negative_prompt: string;
  aspect_ratio: "1:1" | "16:9" | "9:16";
  quality: "normal" | "hq";
  duration: "5s" | "10s";
  model: "kling";
}

interface UserCredits {
  credits_balance: number;
  total_credits_used: number;
}

const TextToVideoPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);

  // State management
  const [params, setParams] = useState<VideoGenerationParams>({
    prompt: "",
    negative_prompt: "",
    aspect_ratio: "1:1",
    quality: "normal",
    duration: "5s",
    model: "kling",
  });

  // Fetch user credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("user_credits")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching credits:", error);
          return;
        }

        setCredits(data || { credits_balance: 0, total_credits_used: 0 });
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    };

    fetchCredits();
  }, [isAuthenticated, user]);

  // Handle text input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: value,
    });
  };

  // Handle radio button changes
  const handleRadioChange = (name: string, value: string) => {
    setParams({
      ...params,
      [name]: value,
    });
  };

  // Get required credits for current settings
  const getRequiredCredits = () => {
    if (params.quality === "hq") {
      return params.duration === "5s" ? 2 : 4;
    }
    return params.duration === "5s" ? 1 : 2;
  };

  // Generate video
  const handleGenerateVideo = async () => {
    if (!params.prompt) {
      toast.error("请输入提示词");
      return;
    }

    if (!isAuthenticated || !user) {
      toast.error("请先登录后再生成视频");
      router.push('/login');
      return;
    }

    const requiredCredits = getRequiredCredits();
    if (!credits || credits.credits_balance < requiredCredits) {
      toast.error(`积分不足，需要 ${requiredCredits} 积分`);
      router.push('/user/profile'); // 跳转到个人中心，用户可以在那里购买积分
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Sending request with params:", params);
      const result = await generateVideo(params);
      console.log("Generation result:", result);
      
      // Refresh credits after successful generation
      const supabase = createClient();
      const { data } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      setCredits(data || { credits_balance: 0, total_credits_used: 0 });
      
      toast.success("视频生成请求已发送");
      router.push(`/user/creation`); // 跳转到创作列表页面
    } catch (error) {
      console.error("Video generation error:", error);
      if (error instanceof Error && error.message.includes("Insufficient credits")) {
        toast.error("积分不足，请先购买积分");
        router.push('/user/profile');
      } else {
        toast.error(error instanceof Error ? error.message : "生成失败，请稍后重试");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="tech-card p-8 mb-10 relative overflow-hidden max-w-3xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-teal-500/5"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Film className="h-6 w-6" />
            <h1 className="text-3xl font-bold">文本生成视频</h1>
          </div>

          <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label>选择模型</Label>
              <RadioGroup
                value={params.model}
                onValueChange={(value) => handleRadioChange("model", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kling" id="model-kling" />
                  <Label htmlFor="model-kling">Kling AI</Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="runaway" id="model-runaway" disabled />
                  <Label htmlFor="model-runaway">Runaway (即将上线)</Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="stability" id="model-stability" disabled />
                  <Label htmlFor="model-stability">Stability AI (即将上线)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">提示词</Label>
              <Textarea
                id="prompt"
                name="prompt"
                placeholder="请输入详细的场景描述..."
                value={params.prompt}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            </div>

            {/* Negative Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="negative_prompt">反向提示词（可选）</Label>
              <Textarea
                id="negative_prompt"
                name="negative_prompt"
                placeholder="请输入不想在视频中出现的内容..."
                value={params.negative_prompt}
                onChange={handleInputChange}
              />
            </div>

            {/* Quality Selection */}
            <div className="space-y-2">
              <Label>视频质量</Label>
              <RadioGroup
                value={params.quality}
                onValueChange={(value) => handleRadioChange("quality", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="quality-normal" />
                  <Label htmlFor="quality-normal">标准质量</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hq" id="quality-hq" />
                  <Label htmlFor="quality-hq">高清质量</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label>视频时长</Label>
              <RadioGroup
                value={params.duration}
                onValueChange={(value) => handleRadioChange("duration", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5s" id="duration-5s" />
                  <Label htmlFor="duration-5s">5秒</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10s" id="duration-10s" />
                  <Label htmlFor="duration-10s">10秒</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="space-y-2">
              <Label>视频比例</Label>
              <RadioGroup
                value={params.aspect_ratio}
                onValueChange={(value) => handleRadioChange("aspect_ratio", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1:1" id="ratio-1-1" />
                  <Label htmlFor="ratio-1-1">1:1 正方形</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="16:9" id="ratio-16-9" />
                  <Label htmlFor="ratio-16-9">16:9 横屏</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9:16" id="ratio-9-16" />
                  <Label htmlFor="ratio-9-16">9:16 竖屏</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerateVideo}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  生成视频
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToVideoPage;
