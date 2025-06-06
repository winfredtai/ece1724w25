// src/components/creation-card.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Play,
  Trash2,
  Download,
  ExternalLink,
  ImageIcon,
  Film,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Creation {
  id: string;
  type: "video" | "image";
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

interface CreationCardProps {
  creation: Creation;
  onDelete: (id: string) => void;
}

export const CreationCard: React.FC<CreationCardProps> = ({
  creation,
  onDelete,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMouseEnter = () => {
    if (creation.type === "video" && creation.status === "completed") {
      setIsHovered(true);
      if (videoRef.current && isVideoLoaded && !hasError) {
        videoRef.current.play().catch((err) => {
          console.error("视频播放失败:", err);
          setHasError(true);
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (creation.type === "video") {
      setIsHovered(false);
      if (videoRef.current && !hasError) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleError = () => {
    console.error(`视频加载错误: ${creation.url}`);
    setHasError(true);
  };

  const renderStatusBadge = () => {
    switch (creation.status) {
      case "completed":
        return <Badge className="bg-green-500">已完成</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">处理中</Badge>;
      case "failed":
        return <Badge className="bg-red-500">失败</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="overflow-hidden bg-background/80 backdrop-blur-sm hover:shadow-md transition-shadow">
        <div
          className="relative h-48 cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() =>
            creation.status === "completed" && setShowPreview(true)
          }
        >
          {/* 预览内容 */}
          {creation.type === "video" ? (
            <>
              {!isHovered && (
                <>
                  {!creation.thumbnailUrl ||
                  creation.thumbnailUrl ===
                    "/images/creations/placeholder.jpg" ? (
                    creation.url ? (
                      <video
                        src={creation.url}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <Film className="h-12 w-12 text-gray-400" />
                      </div>
                    )
                  ) : (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${creation.thumbnailUrl})`,
                      }}
                    />
                  )}
                </>
              )}

              {/* 播放视频 */}
              {creation.type === "video" && creation.status === "completed" && (
                <video
                  ref={videoRef}
                  src={creation.url}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onLoadedData={handleVideoLoad}
                  onError={handleError}
                  disablePictureInPicture
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover",
                    !isHovered && "opacity-0",
                  )}
                />
              )}
            </>
          ) : (
            // 图片预览
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${creation.thumbnailUrl || creation.url})`,
              }}
            />
          )}

          {/* 加载中显示 */}
          {creation.status === "processing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-black/40 rounded-full p-3">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
          )}

          {/* 播放状态指示 */}
          {creation.type === "video" &&
            creation.status === "completed" &&
            !isHovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
            )}

          {/* 类型和状态标签 */}
          <div className="absolute top-2 left-2">
            {creation.type === "video" ? (
              <Badge
                variant="outline"
                className="bg-black/60 text-white border-none"
              >
                <Film className="h-3 w-3 mr-1" />
                视频
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-black/60 text-white border-none"
              >
                <ImageIcon className="h-3 w-3 mr-1" />
                图片
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">{renderStatusBadge()}</div>
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{creation.title}</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            创建于 {formatDate(creation.createdAt)}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {creation.description}
          </p>
        </CardContent>

        <CardFooter className="px-4 py-3 border-t flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex gap-2">
            {creation.status === "completed" && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" asChild>
                        <a href={creation.url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>下载</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(true)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>查看</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除 {creation.title} 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(creation.id);
                setShowDeleteDialog(false);
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{creation.title}</DialogTitle>
            <DialogDescription>{creation.description}</DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {creation.type === "video" ? (
              <video
                src={creation.url}
                controls
                className="w-full rounded-md"
              ></video>
            ) : (
              <Image
                src={creation.url}
                alt={creation.title}
                className="w-full rounded-md"
                width={500}
                height={300}
              />
            )}
          </div>
          <DialogFooter>
            <Button asChild>
              <a href={creation.url} download>
                <Download className="h-4 w-4 mr-2" />
                下载
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
