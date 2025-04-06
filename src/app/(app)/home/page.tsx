"use client";
import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

// 轮播图数据类型
interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
}

// 视频数据类型
interface VideoItem {
  id: string;
  title?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  created_at?: string;
}

// 视频卡片组件
const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && isVideoLoaded && !hasError) {
      videoRef.current.play().catch((err) => {
        console.error("视频播放失败:", err);
        setHasError(true);
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && !hasError) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleError = () => {
    console.error(`视频加载错误: ${video.videoUrl}`);
    setHasError(true);
  };

  return (
    <Card className="overflow-hidden group relative shadow-sm hover:shadow">
      <div
        className="relative aspect-video bg-black/5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 预览内容 */}
        {!isHovered && (
          <>
            {!video.thumbnailUrl ||
            video.thumbnailUrl === "/images/creations/placeholder.jpg" ? (
              video.videoUrl ? (
                <video
                  ref={previewRef}
                  src={video.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${video.thumbnailUrl})`,
                }}
              />
            )}
          </>
        )}

        {/* 加载中显示 */}
        {!isVideoLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 播放视频 */}
        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            !isHovered && "opacity-0",
          )}
        />

        {/* 播放状态指示 - 仅在视频已加载且未悬停时显示 */}
        {!isHovered && !hasError && isVideoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center">
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
                className="text-white"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}

        {/* 错误状态显示 */}
        {hasError && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="text-center p-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2 text-red-500"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm">视频无法播放</p>
            </div>
          </div>
        )}
      </div>

      {/* 视频标题 */}
      {video.title && (
        <div className="p-3">
          <p className="text-sm line-clamp-2">{video.title}</p>
        </div>
      )}
    </Card>
  );
};

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("开始获取视频数据...");
        const response = await fetch("/api/videos/latest");
        console.log("API响应状态:", response.status);

        const data = await response.json();
        console.log("API响应数据:", data);

        if (!response.ok) {
          throw new Error(data.error || "获取视频失败");
        }

        if (Array.isArray(data)) {
          setVideos(data);
          console.log("成功设置视频数据:", data);
        } else {
          throw new Error("返回的数据格式不正确");
        }
      } catch (err) {
        console.error("获取视频失败:", err);
        setError(err instanceof Error ? err.message : "获取视频失败");
        // 如果是开发环境，显示更详细的错误信息
        if (process.env.NODE_ENV === "development") {
          console.error("详细错误信息:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestVideos();
  }, []);

  // 轮播图数据
  const carouselItems: CarouselItem[] = [
    {
      id: 1,
      title: "AI 视频生成",
      description: "只需输入文本描述，即可生成精彩的视频内容",
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/014-9_20241122_1737_Whales%20Soaring%20Skyward_remix_01jdban9ykevctk8csk530rqmc.mp4.mp4",
    },
    {
      id: 2,
      title: "多场景视频制作",
      description: "支持多种场景风格，让您的创意无限绽放",
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/004-Slack_13_assets_task_01jd7x3embfre84ebggt0r4f24_task_01jd7x3embfre84ebggt0r4f24_genid_7597d81b-a033-4b25-85f1-1d8d924686ba_24_11_21_17_43_314345_videos_00000_107724_s.mp4.mp4",
    },
    {
      id: 3,
      title: "一键生成视频",
      description: "简单易用的界面，让视频创作变得轻而易举",
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/009-9_20240924_1806_Eerie%20Submarine%20Ruins_storyboard_01j8kbe4htf0sarh18w85y61r5.mp4.mp4",
    },
  ];

  // 轮播图状态和控制
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // 轮播图自动切换
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex(
        (prevIndex) => (prevIndex + 1) % carouselItems.length,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // 手动轮播图导航
  const handleCarouselNav = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <section className="relative h-[350px] overflow-hidden">
        {carouselItems.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-all duration-1000",
              index === currentCarouselIndex
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-105 pointer-events-none z-0",
            )}
          >
            {/* 动态视频背景 */}
            <div className="absolute inset-0 overflow-hidden">
              {/* 主背景视频 */}
              <video
                key={item.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute w-full h-full object-cover"
                poster={item.image}
              >
                <source src={item.videoUrl} type="video/mp4" />
              </video>

              {/* 渐变叠加层 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-2xl text-white">
                  <Badge
                    variant="outline"
                    className="mb-2 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1"
                  >
                    AI 视频生成
                  </Badge>
                  <h1 className="text-5xl font-bold mb-4 tracking-tight">
                    {item.title}
                  </h1>
                  <p className="text-xl mb-8 text-white/90 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex gap-4">
                    <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
                      立即体验
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      className="backdrop-blur-sm border-white/30 hover:bg-white/20 hover:border-white/50"
                    >
                      了解更多
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="flex space-x-2">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => handleCarouselNav(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  index === currentCarouselIndex
                    ? "bg-white scale-100"
                    : "bg-white/50 scale-75",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="container py-4">
        <div className="space-y-4">
          {/* 视频区域 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1.5 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl font-bold">最新视频</h2>
            </div>
            <div className="mb-8">
              {isLoading ? (
                // 加载状态
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <div className="aspect-video bg-gray-200"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                // 错误状态
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
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
                      className="mx-auto mb-2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p className="text-gray-600">{error}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4"
                    variant="outline"
                  >
                    重试
                  </Button>
                </div>
              ) : videos.length === 0 ? (
                // 空状态
                <div className="text-center py-8">
                  <p className="text-gray-600">暂无视频</p>
                </div>
              ) : (
                // 视频列表
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
