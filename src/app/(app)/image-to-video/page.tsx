"use client";
import React, { useState, useEffect, useRef } from "react";
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
  Switch,
} from "@/components/ui";
import { ChevronDown, BadgeInfo, Upload, X, Loader2, Film } from "lucide-react";
import { videoApi, VideoGenerationParams } from "@/lib/api";
import VideoGenerationStatus from "@/components/videoGenerationStatus";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

// Extended interface for image-to-video parameters
interface ImageToVideoParams extends VideoGenerationParams {
  negative_prompt?: string;
  model: string;
  quality: string;
  video_length: string;
  input_image?: File | null;
}

const ImageToVideoPage: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Reference for file inputs
  const imageInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [params, setParams] = useState<ImageToVideoParams>({
    prompt: "",
    negative_prompt: "",
    cfg: "0.5",
    aspect_ratio: "1:1",
    model: "kling",
    quality: "normal",
    video_length: "5s",
    input_image: null,
  });
  const [taskId, setTaskId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [videoStatus, setVideoStatus] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>("");

  const [creditsRequired, setCreditsRequired] = useState<number>(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Handle text input changes
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

  // Handle image file uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setParams({
        ...params,
        input_image: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing uploaded images
  const handleRemoveImage = () => {
    setParams({
      ...params,
      input_image: null,
    });

    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Calculate required credits based on selected options
  useEffect(() => {
    let credits = 1; // Base credits for image-to-video

    if (params.quality === "high") {
      credits += 1;
    }

    if (params.video_length === "10s") {
      credits += 1;
    }

    setCreditsRequired(credits);
  }, [params.quality, params.video_length, params.model]);

  // Handle status change callback
  const handleStatusChange = (status: number, url: string) => {
    setVideoStatus(status);
    if (url) {
      setVideoUrl(url);
    }
  };

  // Check user login status
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('检查用户登录状态失败:', error);
        setIsLoggedIn(false);
      }
    };
    
    checkUserAuth();
  }, []);

  // Generate video with uploaded images and parameters
  const generateVideo = async () => {
    if (!params.input_image) {
      setError("请上传图片");
      return;
    }
    
    // Check if user is logged in
    if (!isLoggedIn) {
      toast.error("请先登录后再生成视频");
      router.push('/login');
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      const formData = new FormData();
      
      // Add image
      formData.append("input_image", params.input_image);
      
      // Add other parameters
      if (params.prompt) formData.append("prompt", params.prompt);
      if (params.negative_prompt) formData.append("negative_prompt", params.negative_prompt);
      formData.append("cfg", params.cfg);
      formData.append("aspect_ratio", params.aspect_ratio);
      
      // Add model, quality, and duration parameters
      formData.append("model", params.model);
      formData.append("quality", params.quality);
      formData.append("video_length", params.video_length);

      // Call unified interface
      const id = await videoApi.imageToVideo(formData);
      setTaskId(id);
      
      // New: Save task to database
      if (id) {
        try {
          const response = await fetch('/api/video-task/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              external_task_id: id,
              prompt: params.prompt,
              negative_prompt: params.negative_prompt || '',
              cfg: parseFloat(params.cfg),
              aspect_ratio: params.aspect_ratio,
              model: params.model,
              high_quality: params.quality === 'high',
              video_length: params.video_length,
              task_type: 'img2video'
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('保存任务到数据库失败:', errorText);
            
            // If it's unauthorized error, prompt user to login
            if (response.status === 401) {
              toast.error("保存任务需要登录，请先登录");
              router.push('/login');
            }
          }
        } catch (saveError) {
          console.error('保存任务时出错:', saveError);
          // Note: Even if saving to database fails, we continue to display video generation status
          // Because scheduled tasks may be synchronized later
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "请求失败，请检查网络连接";
      setError(errorMessage);
      setIsGenerating(false);
    }
  };

  const getAspectRatioLabel = (value: string) => {
    const options = {
      "1:1": "正方形 (1:1)",
      "16:9": "宽屏 (16:9)",
      "9:16": "竖屏 (9:16)",
    };
    return options[value as keyof typeof options] || value;
  };

  const getModelLabel = (value: string) => {
    const options = {
      kling: "Kling AI",
      runaway: "Runaway",
      stability: "Stability AI",
    };
    return options[value as keyof typeof options] || value;
  };

  const getQualityLabel = (value: string) => {
    const options = {
      normal: "标准质量",
      high: "高质量 (+1信用点)",
    };
    return options[value as keyof typeof options] || value;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <div className="tech-card p-8 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-teal-500/5"></div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative z-10">
          <h1 className="text-3xl font-bold">图片生成视频</h1>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="upload-start"
                className="block text-sm font-medium"
              >
                上传图片 <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${
                  imagePreview
                    ? "border-emerald-300 bg-emerald-50/10"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => imageInputRef.current?.click()}
              >
                <input
                  type="file"
                  id="upload-start"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/png, image/jpeg"
                  onChange={handleImageUpload}
                />

                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={300}
                      height={300}
                      className="mx-auto max-h-[300px] w-auto object-contain rounded"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      title="移除图片"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="py-12">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      点击上传图片 (JPG, PNG)
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      文件大小不超过10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="block text-sm font-medium">
                提示词（可选）
              </label>
              <Textarea
                id="prompt"
                name="prompt"
                value={params.prompt}
                onChange={handleInputChange}
                placeholder="添加提示词以引导视频生成，例如：平滑的动作，自然的转场，高清画质"
                className="w-full resize-y"
                rows={2}
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
                placeholder="描述您不希望在视频中出现的元素，例如：模糊，闪烁，扭曲"
                className="w-full resize-y"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    >
                      {getAspectRatioLabel(params.aspect_ratio)}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
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
                  max="1"
                  value={params.cfg}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <div className="block text-sm font-medium mb-2">视频质量</div>
                <RadioGroup
                  defaultValue={params.quality}
                  className="flex space-x-2"
                  onValueChange={(value) =>
                    handleDropdownSelect("quality", value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="q1" />
                    <Label htmlFor="q1">标准</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="q2" />
                    <Label htmlFor="q2">高清</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="my-4 p-3 bg-blue-50 rounded-md flex items-start">
              <BadgeInfo className="text-blue-500 mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <strong>生成说明:</strong> 图像转视频将使用
                <strong>{creditsRequired}个信用点</strong>。视频生成可能需要1-3分钟。
              </div>
            </div>

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !params.input_image}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white mt-4"
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
            isGenerateDisabled={isGenerating || !params.input_image}
            isGenerating={isGenerating}
            error={error}
            placeholderIcon="image"
            placeholderTitle="准备生成视频"
            placeholderDescription="上传图片并点击生成按钮开始创建您的AI视频"
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageToVideoPage;
