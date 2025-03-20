import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Loader2, RefreshCw, Play, Film, Video, Camera } from "lucide-react";
import { VideoStatus, videoApi } from "@/lib/api";

interface VideoGenerationStatusProps {
  taskId: string;
  onGenerateVideo: () => void;
  isGenerateDisabled: boolean;
  isGenerating: boolean;
  error: string;
  placeholderIcon?: "play" | "image";
  placeholderTitle?: string;
  placeholderDescription?: string;
}

const VideoGenerationStatus: React.FC<VideoGenerationStatusProps> = ({
  taskId,
  onGenerateVideo,
  isGenerateDisabled,
  isGenerating,
  error,
  placeholderIcon = "play",
  placeholderTitle = "准备生成视频",
  placeholderDescription = "填写表单并点击生成按钮开始创建您的AI视频",
}) => {
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({
    status: 0,
    videoUrl: "",
    coverUrl: "",
  });

  // 获取状态文本
  const getStatusText = () => {
    switch (videoStatus.status) {
      case 5:
        return "正在排队中...";
      case 10:
        return "正在生成视频...";
      case 90:
        return "视频生成完成！";
      default:
        return "准备就绪";
    }
  };

  // 检查视频状态
  const checkVideoStatus = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        const status = await videoApi.getVideoStatus(id);
        setVideoStatus(status);

        // 如果视频已生成完成或出错，停止轮询
        if (
          status.status === 90 ||
          (status.videoUrl && status.videoUrl !== "")
        ) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      } catch {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    },
    [pollingInterval, setVideoStatus, setPollingInterval],
  );

  // 开始轮询视频状态

  // 当 taskId 变化时重新开始轮询
  useEffect(() => {
    const startPolling = (id: string) => {
      if (!id) return;

      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }

      const interval = setInterval(() => {
        checkVideoStatus(id);
      }, 10000);

      setPollingInterval(interval);
    };

    if (taskId) {
      checkVideoStatus(taskId); // 立即检查一次
      startPolling(taskId);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [checkVideoStatus, pollingInterval, taskId]);

  // 立即检查一次视频状态
  const handleRefreshStatus = async () => {
    if (taskId) {
      await checkVideoStatus(taskId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center border border-border/50 rounded-lg p-6 bg-background/50 backdrop-blur-sm h-full">
      {isGenerating || videoStatus.videoUrl ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          {videoStatus.videoUrl ? (
            <div className="w-full">
              <h3 className="text-xl font-medium mb-4 text-center">生成结果</h3>
              <video
                src={videoStatus.videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-auto rounded-lg shadow-lg"
              ></video>
              <div className="mt-4 flex justify-center space-x-4">
                <a
                  href={videoStatus.videoUrl}
                  download
                  className="text-primary flex items-center hover:underline"
                >
                  <Video className="h-4 w-4 mr-1" />
                  下载视频
                </a>
                {videoStatus.coverUrl && (
                  <a
                    href={videoStatus.coverUrl}
                    download
                    className="text-primary flex items-center hover:underline"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    下载封面
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl animate-pulse"></div>
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 mx-auto">
                  {videoStatus.status === 5 ? (
                    <RefreshCw className="h-10 w-10 text-white animate-spin" />
                  ) : (
                    <Camera className="h-10 w-10 text-white animate-pulse" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-medium mb-2">{getStatusText()}</h3>
              <p className="text-sm text-muted-foreground">
                请耐心等待，视频生成可能需要几分钟时间
              </p>
              {taskId && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    任务ID: {taskId}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshStatus}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    刷新状态
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 mb-4 mx-auto">
            {placeholderIcon === "play" ? (
              <Play className="h-10 w-10 text-primary" />
            ) : (
              <Film className="h-10 w-10 text-primary" />
            )}
          </div>
          <h3 className="text-xl font-medium mb-2">{placeholderTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {placeholderDescription}
          </p>
        </div>
      )}

      {!videoStatus.videoUrl && (
        <div className="w-full mt-6">
          <Button
            onClick={onGenerateVideo}
            disabled={isGenerateDisabled}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
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

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default VideoGenerationStatus;
