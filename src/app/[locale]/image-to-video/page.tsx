"use client";
import React, { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Textarea,
  Card,
  CardContent,
} from "@/components/ui";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface VideoGenerationParams {
  prompt: string;
  negative_prompt: string;
  model: "standard" | "high-quality";
  duration: "5s" | "10s";
}

const ImageToVideoPage: React.FC = () => {
  const t = useTranslations("ImageToVideo");
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [model, setModel] = useState<"standard" | "high-quality">("standard");
  const [duration, setDuration] = useState<"5s" | "10s">("5s");

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
        toast.error(t("Error.fileSizeTooLarge"));
        return;
      }

      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];

      // Validate file type
      if (!file.type.match("image/jpeg") && !file.type.match("image/png")) {
        toast.error(t("Error.invalidFileType"));
        return;
      }

      // Validate file size
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("Error.fileSizeTooLarge"));
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
      toast.error(t("Error.fileRequired"));
      return;
    }

    if (!params.prompt) {
      toast.error(t("Error.promptRequired"));
      return;
    }

    setIsGenerating(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("input_image", selectedFile);
      formData.append("prompt", params.prompt);
      if (params.negative_prompt) {
        formData.append("negative_prompt", params.negative_prompt);
      }
      formData.append("cfg", "0.3");

      let apiPath = "/api/kling/i2v";
      if (model === "high-quality") {
        apiPath += "/hq";
      }
      apiPath += `/${duration}`;

      const response = await fetch(apiPath, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("Error.generateFailed"));
      }

      const data = await response.json();
      console.log("Generation result:", data);

      toast.success(t("generateSuccess"));

      if (data.taskId) {
        router.push(`/user/creation?taskId=${data.taskId}`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : t("Error.generateFailed"),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">{t("uploadImage")}</Label>
              <div
                className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="image"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="relative">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      width={300}
                      height={300}
                      className="max-h-[300px] mx-auto rounded-lg object-contain"
                      unoptimized // Since we're using object URL
                    />
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      {t("reselect")}
                    </Button>
                  </div>
                ) : (
                  <div className="py-8 text-center w-full">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 mb-2 h-8 w-8"
                      >
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
                        <line x1="16" x2="22" y1="5" y2="5"></line>
                        <line x1="19" x2="19" y1="2" y2="8"></line>
                        <circle cx="9" cy="9" r="2"></circle>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t("dragUploadImage")}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t("supportFormat")}
                      </div>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                        className="mt-3"
                      >
                        {t("selectImage")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">{t("prompt")}</Label>
              <Textarea
                id="prompt"
                name="prompt"
                placeholder={t("Placeholder.prompt")}
                value={params.prompt}
                onChange={handleInputChange}
                className="min-h-[100px]"
              />
            </div>

            {/* Negative Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="negative_prompt">{t("negative_prompt")}</Label>
              <Textarea
                id="negative_prompt"
                name="negative_prompt"
                placeholder={t("Placeholder.negative_prompt")}
                value={params.negative_prompt}
                onChange={handleInputChange}
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">{t("model")}</Label>
              <Select
                value={model}
                onValueChange={(value: "standard" | "high-quality") =>
                  setModel(value)
                }
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder={"standard"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">{t("standard")}</SelectItem>
                  <SelectItem value="high-quality">
                    {t("high-quality")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label htmlFor="duration">{t("duration")}</Label>
              <Select
                value={duration}
                onValueChange={(value: "5s" | "10s") => setDuration(value)}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder={"5s"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">{t("5s")}</SelectItem>
                  <SelectItem value="10s">{t("10s")}</SelectItem>
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
                  {t("generateInProgress")}
                </>
              ) : (
                t("startGenerating")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageToVideoPage;
