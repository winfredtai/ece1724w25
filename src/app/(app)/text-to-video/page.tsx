"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  RadioGroup,
  RadioGroupItem,
  Label,
  Textarea,
} from "@/components/ui";
import { ChevronDown, BadgeInfo, Loader2, Film } from "lucide-react";
import { videoApi, VideoGenerationParams } from "@/lib/api";
import VideoGenerationStatus from "@/components/videoGenerationStatus";

// Updated VideoGenerationParams interface to include new parameters
// Note: You'll need to update this in the API file as well
interface ExtendedVideoGenerationParams extends VideoGenerationParams {
  negative_prompt?: string;
  model: string;
  quality: string;
  video_length: string;
}

const TextToVideoPage: React.FC = () => {
  // Updated state management with new parameters
  const [params, setParams] = useState<ExtendedVideoGenerationParams>({
    prompt: "",
    negative_prompt: "",
    cfg: "0.5",
    aspect_ratio: "1:1",
    model: "kling",
    quality: "normal",
    video_length: "5s",
  });
  const [taskId, setTaskId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");
  const [creditsRequired, setCreditsRequired] = useState<number>(1);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: value,
    });
  };

  // Handle dropdown select
  const handleDropdownSelect = (name: string, value: string) => {
    setParams({
      ...params,
      [name]: value,
    });
  };

  // Calculate required credits based on selected options
  useEffect(() => {
    let credits = 1;

    if (params.quality === "high") {
      credits += 1;
    }

    if (params.video_length === "10s") {
      credits += 1;
    }

    setCreditsRequired(credits);
  }, [params.quality, params.video_length, params.model]);

  // Generate video with updated parameters
  const generateVideo = async () => {
    if (!params.prompt.trim()) {
      setError("请输入提示词");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const id = await videoApi.generateVideo(params);
      console.log("Generated video with task ID:", id);
      setTaskId(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "请求失败，请检查网络连接";
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  // 处理视频状态变化
  const handleStatusChange = (status: number, videoUrl: string) => {
    if (videoUrl) {
      setIsGenerating(false);
    }
  };

  const getAspectRatioLabel = (value: string) => {
    const options = {
      "1:1": "正方形 (1:1)",
      "16:9": "宽屏 (16:9)",
      "9:16": "竖屏 (9:16)",
      "4:3": "标准 (4:3)",
    };
    return options[value as keyof typeof options] || value;
  };

  const getModelLabel = (value: string) => {
    const options = {
      kling: "Kling AI",
      runaway: "Runaway",
      stability: "Stability AI",
      "modelscope-t2v": "ModelScope T2V",
    };
    return options[value as keyof typeof options] || value;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="tech-card p-8 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative z-10">
          <h1 className="text-3xl font-bold">文本生成视频</h1>
          <div className="mt-4 md:mt-0 w-full md:w-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {getModelLabel(params.model)}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem
                  onClick={() => handleDropdownSelect("model", "kling")}
                >
                  Kling AI
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDropdownSelect("model", "runaway")}
                >
                  Runaway
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDropdownSelect("model", "stability")}
                >
                  Stability AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-sm font-medium">
                提示词 <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="prompt"
                name="prompt"
                value={params.prompt}
                onChange={handleInputChange}
                placeholder="详细描述您想要生成的视频内容，例如：在火星表面，一只鸟展开翅膀飞向红色天空，4K高清，电影级质量"
                className="w-full min-h-[120px] resize-y"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="negative_prompt"
                className="block text-sm font-medium"
              >
                负面提示词（可选）
              </label>
              <Textarea
                id="negative_prompt"
                name="negative_prompt"
                value={params.negative_prompt}
                onChange={handleInputChange}
                placeholder="描述您不希望在视频中出现的元素，例如：低质量，模糊，扭曲，变形"
                className="w-full resize-y"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="aspect_ratio"
                  className="block text-sm font-medium"
                >
                  宽高比
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      id="aspect_ratio"
                    >
                      {getAspectRatioLabel(params.aspect_ratio)}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    <DropdownMenuItem
                      onClick={() =>
                        handleDropdownSelect("aspect_ratio", "1:1")
                      }
                    >
                      正方形 (1:1)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDropdownSelect("aspect_ratio", "16:9")
                      }
                    >
                      宽屏 (16:9)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDropdownSelect("aspect_ratio", "9:16")
                      }
                    >
                      竖屏 (9:16)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        handleDropdownSelect("aspect_ratio", "4:3")
                      }
                    >
                      标准 (4:3)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2">
                <label htmlFor="cfg" className="block text-sm font-medium">
                  CFG 值
                </label>
                <Input
                  id="cfg"
                  name="cfg"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={params.cfg}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="block text-sm font-medium mb-2">视频长度</div>
                <RadioGroup
                  defaultValue={params.video_length}
                  className="flex space-x-2"
                  onValueChange={(value) =>
                    handleDropdownSelect("video_length", value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5s" id="r1" />
                    <Label htmlFor="r1">5秒</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10s" id="r2" />
                    <Label htmlFor="r2">10秒</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="block text-sm font-medium mb-2">视频质量</div>
                <RadioGroup
                  defaultValue={params.quality}
                  className="flex space-x-4"
                  onValueChange={(value) =>
                    handleDropdownSelect("quality", value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="q1" />
                    <Label htmlFor="q1">标准质量</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="q2" />
                    <Label htmlFor="q2">高质量</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="p-4 border border-border/40 rounded-lg bg-muted/30 flex items-center justify-between">
              <div className="flex items-center">
                <BadgeInfo className="h-5 w-5 mr-2 text-blue-500" />
                <span className="text-sm font-medium">所需积分</span>
              </div>
              <span className="text-lg font-bold text-primary">
                {creditsRequired} 点
              </span>
            </div>

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !params.prompt.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white mt-4"
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

            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>

          <VideoGenerationStatus
            taskId={taskId}
            onGenerateVideo={generateVideo}
            isGenerateDisabled={isGenerating || !params.prompt.trim()}
            isGenerating={isGenerating}
            error={error}
            placeholderIcon="play"
            placeholderTitle="准备生成视频"
            placeholderDescription="填写表单并点击生成按钮开始创建您的AI视频"
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      <div className="tech-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-blue-500/5"></div>
        <h2 className="text-2xl font-bold mb-4 relative z-10">使用提示</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">提示词技巧</h3>
            <p className="text-sm text-muted-foreground">
              使用详细、具体的描述可以获得更好的效果。例如，描述场景、动作、颜色和风格。
            </p>
          </div>
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">相机参数</h3>
            <p className="text-sm text-muted-foreground">
              调整相机类型和值可以创建不同的视觉效果。缩放值为负表示拉远，为正表示拉近。
            </p>
          </div>
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">模型选择</h3>
            <p className="text-sm text-muted-foreground">
              不同的模型有各自的特点和擅长领域。高级模型通常能生成更高质量的视频，但需要更多积分。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToVideoPage;
