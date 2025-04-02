"use client";
import React, { useState } from "react";
import {
  Button,
  Input,
  RadioGroup,
  RadioGroupItem,
  Label,
  Textarea,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Film, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

interface VideoGenerationParams {
  prompt: string;
  negative_prompt: string;
  model: "standard" | "high-quality";
  duration: "5s" | "10s";
}

const ImageToVideoPage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model, setModel] = useState<'standard' | 'high-quality'>('standard');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');

  // State management
  const [params, setParams] = useState<VideoGenerationParams>({
    prompt: "",
    negative_prompt: "",
    model: "standard",
    duration: "5s",
  });

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

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件大小不能超过 10MB");
        return;
      }
      
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Generate video
  const generateVideo = async () => {
    if (!selectedFile) {
      toast.error("请选择图片");
      return;
    }

    if (!params.prompt) {
      toast.error("请输入提示词");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('input_image', selectedFile);
      formData.append('prompt', params.prompt);
      if (params.negative_prompt) {
        formData.append('negative_prompt', params.negative_prompt);
      }
      formData.append('cfg', '0.3'); // 默认值

      // 根据选择的模型和时长确定 API 路径
      let apiPath = '/api/kling/i2v';
      if (model === 'high-quality') {
        apiPath += '/hq';
      }
      apiPath += `/${duration}`;

      const response = await fetch(apiPath, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '生成失败');
      }

      const data = await response.json();
      console.log('Generation result:', data);
      
      toast.success("视频生成请求已发送");
      
      // 可以跳转到任务详情页
      if (data.taskId) {
        router.push(`/user/creation?taskId=${data.taskId}`);
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : "生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <h1 className="text-2xl font-bold mb-6">图片生成视频</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">上传图片</Label>
              <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer text-center w-full"
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-[300px] mx-auto rounded-lg"
                      />
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                      >
                        重新选择
                      </Button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        点击或拖拽上传图片
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        支持 JPG/PNG 格式，文件大小不超过 10MB
                      </div>
                    </div>
                  )}
                </label>
              </div>
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

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">选择模型</Label>
              <Select
                value={model}
                onValueChange={(value: 'standard' | 'high-quality') => setModel(value)}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">标准质量</SelectItem>
                  <SelectItem value="high-quality">高质量</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label htmlFor="duration">视频时长</Label>
              <Select
                value={duration}
                onValueChange={(value: '5s' | '10s') => setDuration(value)}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="选择时长" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5秒</SelectItem>
                  <SelectItem value="10s">10秒</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              disabled={!selectedFile || !params.prompt || isGenerating}
              onClick={generateVideo}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "开始生成"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageToVideoPage;
