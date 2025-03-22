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
import { ChevronDown, BadgeInfo, Upload, X } from "lucide-react";
import { videoApi, VideoGenerationParams } from "@/lib/api";
import VideoGenerationStatus from "@/components/videoGenerationStatus";
import Image from "next/image";

// Extended interface for image-to-video parameters
interface ImageToVideoParams extends VideoGenerationParams {
  negative_prompt?: string;
  model: string;
  quality: string;
  video_length: string;
  start_image?: File | null;
  end_image?: File | null;
}

const ImageToVideoPage: React.FC = () => {
  // Reference for file inputs
  const startImageInputRef = useRef<HTMLInputElement>(null);
  const endImageInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [params, setParams] = useState<ImageToVideoParams>({
    prompt: "",
    negative_prompt: "",
    cfg: "0.5",
    aspect_ratio: "1:1",
    model: "kling",
    quality: "normal",
    video_length: "5s",
    start_image: null,
    end_image: null,
  });
  const [taskId, setTaskId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const [creditsRequired, setCreditsRequired] = useState<number>(1);
  const [startImagePreview, setStartImagePreview] = useState<string | null>(
    null,
  );
  const [endImagePreview, setEndImagePreview] = useState<string | null>(null);
  const [useEndImage, setUseEndImage] = useState<boolean>(false);

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
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "start_image" | "end_image",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setParams({
        ...params,
        [type]: file,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "start_image") {
          setStartImagePreview(reader.result as string);
        } else {
          setEndImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing uploaded images
  const handleRemoveImage = (type: "start_image" | "end_image") => {
    setParams({
      ...params,
      [type]: null,
    });

    if (type === "start_image") {
      setStartImagePreview(null);
      if (startImageInputRef.current) {
        startImageInputRef.current.value = "";
      }
    } else {
      setEndImagePreview(null);
      if (endImageInputRef.current) {
        endImageInputRef.current.value = "";
      }
    }
  };

  // Calculate required credits based on selected options
  useEffect(() => {
    let credits = 2; // Base credits for image-to-video is higher

    if (params.quality === "high") {
      credits += 1;
    }

    if (params.video_length === "10s") {
      credits += 1;
    }

    if (useEndImage && params.end_image) {
      credits += 1; // Additional credit for using end image
    }

    setCreditsRequired(credits);
  }, [
    params.quality,
    params.video_length,
    params.model,
    useEndImage,
    params.end_image,
  ]);

  // Toggle end image usage
  const toggleEndImage = () => {
    setUseEndImage(!useEndImage);
    if (!useEndImage && !params.end_image) {
      // Prompt user to select end image when enabling the feature
      setTimeout(() => {
        if (endImageInputRef.current) {
          endImageInputRef.current.click();
        }
      }, 100);
    }
  };

  // Generate video with uploaded images and parameters
  const generateVideo = async () => {
    if (!params.start_image) {
      setError("请上传起始图片");
      return;
    }

    if (useEndImage && !params.end_image) {
      setError("请上传结束图片或关闭结束图片选项");
      return;
    }

    setError("");
    setIsGenerating(true);

    try {
      // In a real implementation, you would modify the API to handle file uploads
      const formData = new FormData();
      formData.append("prompt", params.prompt);
      formData.append("negative_prompt", params.negative_prompt || "");
      formData.append("cfg", params.cfg);
      formData.append("aspect_ratio", params.aspect_ratio);
      formData.append("model", params.model);
      formData.append("quality", params.quality);
      formData.append("video_length", params.video_length);

      if (params.start_image) {
        formData.append("start_image", params.start_image);
      }

      if (useEndImage && params.end_image) {
        formData.append("end_image", params.end_image);
      }

      // You'll need to extend your API to handle image-to-video generation
      const id = await videoApi.generateImageToVideo(formData);
      setTaskId(id);
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
      "4:3": "标准 (4:3)",
    };
    return options[value as keyof typeof options] || value;
  };

  const getModelLabel = (value: string) => {
    const options = {
      kling: "Kling AI",
      runaway: "Runaway",
      stability: "Stability AI",
      "modelscope-i2v": "ModelScope I2V",
    };
    return options[value as keyof typeof options] || value;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="tech-card p-8 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5"></div>

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
                <DropdownMenuItem
                  onClick={() =>
                    handleDropdownSelect("model", "modelscope-i2v")
                  }
                >
                  ModelScope I2V
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="start_image"
                className="block text-sm font-medium"
              >
                起始图片 <span className="text-red-500">*</span>
              </label>
              <div className="border border-border/50 rounded-lg p-4 bg-background/50">
                {startImagePreview ? (
                  <div className="relative">
                    <Image
                      src={startImagePreview}
                      alt="Start frame"
                      className="w-full h-auto rounded-md object-cover max-h-[200px]"
                      width={400}
                      height={200}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 w-8 h-8 p-0"
                      onClick={() => handleRemoveImage("start_image")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-md cursor-pointer bg-muted/30"
                    onClick={() => startImageInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">点击上传起始图片</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      支持 JPG, PNG, WEBP 格式
                    </p>
                  </div>
                )}
                <input
                  ref={startImageInputRef}
                  type="file"
                  id="start_image"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "start_image")}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="use-end-image"
                checked={useEndImage}
                onCheckedChange={toggleEndImage}
              />
              <Label htmlFor="use-end-image" className="font-medium">
                使用结束图片（可选）
              </Label>
            </div>

            {useEndImage && (
              <div className="space-y-2 pl-6 border-l-2 border-border/30">
                <label
                  htmlFor="end_image"
                  className="block text-sm font-medium"
                >
                  结束图片
                </label>
                <div className="border border-border/50 rounded-lg p-4 bg-background/50">
                  {endImagePreview ? (
                    <div className="relative">
                      <Image
                        src={endImagePreview}
                        alt="End frame"
                        className="w-full h-auto rounded-md object-cover max-h-[200px]"
                        width={400}
                        height={200}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 w-8 h-8 p-0"
                        onClick={() => handleRemoveImage("end_image")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/50 rounded-md cursor-pointer bg-muted/30"
                      onClick={() => endImageInputRef.current?.click()}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">点击上传结束图片</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持 JPG, PNG, WEBP 格式
                      </p>
                    </div>
                  )}
                  <input
                    ref={endImageInputRef}
                    type="file"
                    id="end_image"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "end_image")}
                  />
                </div>
              </div>
            )}

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
          </div>

          <VideoGenerationStatus
            taskId={taskId}
            onGenerateVideo={generateVideo}
            isGenerateDisabled={
              isGenerating ||
              !params.start_image ||
              (useEndImage && !params.end_image)
            }
            isGenerating={isGenerating}
            error={error}
            placeholderIcon="image"
            placeholderTitle="准备生成视频"
            placeholderDescription="上传图片并调整参数以开始创建图片转视频"
          />
        </div>
      </div>

      <div className="tech-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-blue-500/5"></div>
        <h2 className="text-2xl font-bold mb-4 relative z-10">使用提示</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">图片选择技巧</h3>
            <p className="text-sm text-muted-foreground">
              选择清晰、高质量的图片可获得更好的效果。图片主体应居中并具有良好的光照条件。
            </p>
          </div>
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">结束图片</h3>
            <p className="text-sm text-muted-foreground">
              添加结束图片可以让AI生成从起始图片到结束图片的平滑过渡。两张图片的内容相似效果更佳。
            </p>
          </div>
          <div className="p-4 border border-border/30 rounded-lg bg-background/20 backdrop-blur-sm">
            <h3 className="text-lg font-medium mb-2">提示词作用</h3>
            <p className="text-sm text-muted-foreground">
              虽然提示词是可选的，但添加适当的提示词可以引导AI更好地理解您希望的动画风格和内容。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideoPage;
