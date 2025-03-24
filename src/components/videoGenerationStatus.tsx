import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui";
import { RefreshCw, Film, Camera } from "lucide-react";
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
  onStatusChange?: (status: number, videoUrl: string) => void;
}

const VideoGenerationStatus: React.FC<VideoGenerationStatusProps> = ({
  taskId,
  onGenerateVideo,
  isGenerateDisabled,
  isGenerating,
  onStatusChange,
}) => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({
    status: 0,
    videoUrl: "",
    coverUrl: "",
  });
  const [videoError, setVideoError] = useState(false);

  const lastTaskIdRef = useRef<string>("");

  // 停止所有轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 获取状态文本
  const getStatusText = () => {
    switch (videoStatus.status) {
      case -1:
        return "生成失败，请重试";
      case 0:
        return "正在准备中...";
      case 5:
        return "正在排队中...";
      case 10:
        return "正在生成视频...";
      case 1:
        return "视频生成完成！";
      default:
        return "准备就绪";
    }
  };

  // 检查视频状态 - 简化版
  const checkVideoStatus = useCallback(
    async (id: string) => {
      if (!id) return;
      
      try {
        // 首先从API获取最新状态
        const status = await videoApi.getVideoStatus(id);
        
        // 设置新状态
        setVideoStatus(status);

        // 如果状态发生变化，通知父组件
        if (onStatusChange) {
          onStatusChange(status.status, status.videoUrl || "");
        }

        // 如果视频已生成完成或出错，停止轮询
        if (status.status === 1 || status.status === -1 || status.videoUrl) {
          console.log("视频生成完成或出错，停止轮询");
          stopPolling();
        }

        // 更新数据库状态（可选步骤，通过调用API端点）
        // 注意：这里依赖于定时任务来更新数据库，不再在前端做更新
      } catch (error) {
        console.error("检查视频状态出错:", error);
        // 轮询出错时不要停止，继续尝试，除非视频生成过程已结束
      }
    },
    [stopPolling, onStatusChange]
  );

  // 当 taskId 变化时重新开始轮询
  useEffect(() => {
    // 只有当 taskId 存在且有效时，才开始轮询
    if (taskId && taskId !== '') {
      console.log("任务ID变化，开始轮询:", taskId);
      
      // 保存新的 taskId
      lastTaskIdRef.current = taskId;
      
      // 重置状态
      setVideoStatus({
        status: 0,
        videoUrl: "",
        coverUrl: "",
      });
      setVideoError(false);
      
      // 清除之前的轮询
      stopPolling();
      
      // 立即检查一次状态
      checkVideoStatus(taskId);
      
      // 设置轮询间隔（每8秒检查一次）
      pollingIntervalRef.current = setInterval(() => {
        checkVideoStatus(taskId);
      }, 8000);
    } else if (!taskId) {
      // 如果taskId为空，重置状态并停止轮询
      setVideoStatus({
        status: 0,
        videoUrl: "",
        coverUrl: "",
      });
      setVideoError(false);
      stopPolling();
    }
    
    // 组件卸载时清除轮询
    return () => {
      stopPolling();
    };
  }, [taskId, checkVideoStatus, stopPolling]);

  // 当开始生成新视频时，重置状态
  useEffect(() => {
    if (isGenerating) {
      console.log("开始生成新视频，重置状态");
      // 重置视频状态
      setVideoStatus({
        status: 0,
        videoUrl: "",
        coverUrl: "",
      });
      setVideoError(false);
    }
  }, [isGenerating]);

  // 立即检查一次视频状态
  const handleRefreshStatus = useCallback(async () => {
    if (taskId) {
      console.log("手动刷新任务状态:", taskId);
      await checkVideoStatus(taskId);
    }
  }, [taskId, checkVideoStatus]);

  // 当视频加载失败时尝试重新加载
  const handleRetryVideo = useCallback(() => {
    setVideoError(false);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center border border-border/50 rounded-lg p-6 bg-background/50 backdrop-blur-sm h-full">
      {/* 仅显示视频结果或生成状态 */}
      <div className="w-full">
        {isGenerating || videoStatus.status !== 0 || videoStatus.videoUrl ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {videoStatus.videoUrl && !videoError ? (
              <div className="w-full">
                <h3 className="text-xl font-medium mb-4 text-center">生成结果</h3>
                <video
                  key={videoStatus.videoUrl} // 添加key确保URL更新时重新渲染
                  src={videoStatus.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto rounded-lg shadow-lg"
                  onLoadStart={() => console.log("Video load started:", videoStatus.videoUrl)}
                  onLoadedData={() => {
                    console.log("Video loaded successfully:", videoStatus.videoUrl);
                    // 视频加载完成后通知父组件
                    if (onStatusChange) {
                      onStatusChange(1, videoStatus.videoUrl);
                    }
                  }}
                  onError={(e) => {
                    // 视频加载失败时通知父组件
                    console.error("Video failed to load:", videoStatus.videoUrl, e);
                    setVideoError(true);
                    if (onStatusChange) {
                      onStatusChange(-1, "");
                    }
                  }}
                ></video>
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateVideo}
                    disabled={isGenerateDisabled}
                  >
                    生成新视频
                  </Button>
                </div>
              </div>
            ) : videoError ? (
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl"></div>
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-red-600 to-orange-600 mb-4 mx-auto">
                    <Film className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">加载视频失败</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  无法加载视频，请尝试刷新页面或重新生成
                </p>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryVideo}
                  >
                    重试加载
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onGenerateVideo}
                    disabled={isGenerateDisabled}
                  >
                    重新生成
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl animate-pulse"></div>
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 mx-auto">
                    {videoStatus.status === 5 || videoStatus.status === 0 ? (
                      <RefreshCw className="h-10 w-10 text-white animate-spin" />
                    ) : videoStatus.status === -1 ? (
                      <Film className="h-10 w-10 text-white animate-ping" />
                    ) : (
                      <Camera className="h-10 w-10 text-white animate-pulse" />
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-medium mb-2">{getStatusText()}</h3>
                <p className="text-sm text-muted-foreground">
                  请耐心等待，视频生成可能需要几分钟时间
                </p>
                {taskId && !isGenerating && (
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
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground text-center">
              点击生成视频按钮开始创建您的 AI 视频
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerationStatus;
