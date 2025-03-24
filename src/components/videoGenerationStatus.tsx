import React, { useState, useEffect, useCallback, useRef } from "react";
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
  onStatusChange?: (status: number, videoUrl: string) => void;
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
  onStatusChange,
}) => {
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({
    status: 0,
    videoUrl: "",
    coverUrl: "",
  });
  const [videoError, setVideoError] = useState(false);
  // Track if we're actively generating a new video to avoid clearing the existing one
  const [isActiveGeneration, setIsActiveGeneration] = useState(false);
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

  // 检查视频状态
  const checkVideoStatus = useCallback(
    async (id: string) => {
      if (!id) return;
      // 如果taskId变了，但函数内还在使用旧的id，直接返回
      if (id !== taskId) {
        console.log(`停止对旧任务 ${id} 的轮询，当前任务为: ${taskId}`);
        return;
      }
      
      try {
        const status = await videoApi.getVideoStatus(id);
        
        // 在完成或有视频URL时记录日志
        if (status.status === 1 || status.videoUrl) {
          console.log("视频状态更新:", status);
        }
        
        // 设置新状态
        setVideoStatus(status);

        // 如果有视频URL且状态为完成，立即通知父组件
        if (status.videoUrl && status.status === 1 && onStatusChange) {
          console.log("发现视频URL:", status.videoUrl);
          onStatusChange(status.status, status.videoUrl);
        } 
        // 如果状态是错误或其他状态，仍然通知父组件
        else if (!status.videoUrl && onStatusChange) {
          onStatusChange(status.status, status.videoUrl);
        }

        // 如果视频已生成完成或出错，停止轮询
        if (
          status.status === 1 || // 完成状态 (1)
          status.status === -1 || // 错误状态 (-1)
          (status.videoUrl && status.videoUrl !== "")
        ) {
          console.log("视频生成完成或出错，停止轮询");
          stopPolling();
        }
      } catch (error) {
        console.error("检查视频状态出错:", error);
        stopPolling();
      }
    },
    [stopPolling, onStatusChange, taskId]
  );

  // 当 taskId 变化时重新开始轮询
  useEffect(() => {
    // 只有当 taskId 改变且是一个有效值时，才重新设置视频状态和开始轮询
    if (taskId && taskId !== '' && taskId !== lastTaskIdRef.current) {
      // 记录日志
      console.log("任务ID变化，重置视频状态:", taskId);
      
      // 保存新的 taskId
      lastTaskIdRef.current = taskId;
      setIsActiveGeneration(true);
      
      // 重置状态
      setVideoStatus({
        status: 0,
        videoUrl: "",
        coverUrl: "",
      });
      setVideoError(false);
      
      // 清除之前的轮询
      stopPolling();
      
      // 先立即检查一次状态
      const checkStatus = async () => {
        try {
          const status = await videoApi.getVideoStatus(taskId);
          
          // 只在有实际进展时记录日志
          if (status.status !== 0 || status.videoUrl) {
            console.log("初始状态检查结果:", status);
          }
          
          setVideoStatus(status);
          
          // 如果有视频URL，立即通知父组件
          if (status.videoUrl && status.status === 1 && onStatusChange) {
            console.log("初始检查发现视频URL:", status.videoUrl);
            onStatusChange(status.status, status.videoUrl);
          }
          
          // 如果状态已完成或失败或有视频URL，不需要开始轮询
          if (status.status === 1 || status.status === -1 || status.videoUrl) {
            setIsActiveGeneration(false);
            return;
          }
          
          // 如果状态未完成，开始轮询
          console.log("开始轮询任务状态:", taskId);
          pollingIntervalRef.current = setInterval(() => {
            checkVideoStatus(taskId);
          }, 8000); // 每8秒检查一次
        } catch (error) {
          console.error("初始状态检查失败:", error);
          setIsActiveGeneration(false);
        }
      };
      
      checkStatus();
    } else if (!taskId) {
      // 如果taskId为空，不要重置视频状态，除非是主动点击了生成按钮
      if (isActiveGeneration) {
        setVideoStatus({
          status: 0,
          videoUrl: "",
          coverUrl: "",
        });
        setVideoError(false);
      }
      stopPolling();
    }
    
    // 组件卸载时清除轮询
    return () => {
      stopPolling();
    };
  }, [taskId, checkVideoStatus, stopPolling, onStatusChange, isActiveGeneration]);

  // 当开始生成新视频时，重置状态并停止轮询
  useEffect(() => {
    if (isGenerating && !isActiveGeneration) {
      console.log("开始生成新视频，重置状态");
      // 重置视频状态
      setVideoStatus({
        status: 0,
        videoUrl: "",
        coverUrl: "",
      });
      setVideoError(false);
      setIsActiveGeneration(true);
      
      // 立即停止所有轮询
      stopPolling();
    } else if (!isGenerating && isActiveGeneration && videoStatus.videoUrl) {
      // 视频生成完成
      setIsActiveGeneration(false);
    }
  }, [isGenerating, stopPolling, isActiveGeneration, videoStatus.videoUrl]);

  // 视频URL改变时，确保停止轮询
  useEffect(() => {
    if (videoStatus.videoUrl) {
      console.log("视频URL变化，停止轮询:", videoStatus.videoUrl.slice(0, 30) + "...");
      stopPolling();
      
      // 视频URL变化时，也通知父组件
      if (onStatusChange && videoStatus.status === 1) {
        onStatusChange(videoStatus.status, videoStatus.videoUrl);
        setIsActiveGeneration(false);
      }
    }
  }, [videoStatus.videoUrl, videoStatus.status, stopPolling, onStatusChange]);

  // 立即检查一次视频状态
  const handleRefreshStatus = useCallback(async () => {
    if (taskId && !isGenerating) {
      console.log("手动刷新任务状态:", taskId);
      await checkVideoStatus(taskId);
    }
  }, [taskId, checkVideoStatus, isGenerating]);

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
            {videoStatus.videoUrl && !videoError && !isActiveGeneration ? (
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
                <div className="mt-4 flex justify-center space-x-4">
                  <a
                    href={videoStatus.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center hover:underline"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    在新窗口打开
                  </a>
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
            ) : videoError && videoStatus.videoUrl && !isActiveGeneration ? (
              <div className="text-center">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4 mx-auto">
                  <Film className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">视频加载失败</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  无法加载视频，请尝试刷新或直接访问链接
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="sm" onClick={handleRetryVideo}>
                    重试
                  </Button>
                  <a
                    href={videoStatus.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent"
                  >
                    直接访问
                  </a>
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
