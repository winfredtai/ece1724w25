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
      title: "AI-Powered Image Generation",
      description:
        "Create stunning visuals with our state-of-the-art AI models",
      image: "/images/carousel/ai-image-gen.jpg",
    },
    {
      id: 2,
      title: "Text-to-Video Transformation",
      description: "Turn your descriptions into dynamic video content",
      image: "/images/carousel/text-to-video.jpg",
    },
    {
      id: 3,
      title: "Voice Cloning Technology",
      description: "Generate natural-sounding voices for your projects",
      image: "/images/carousel/voice-clone.jpg",
    },
    {
      id: 4,
      title: "3D Model Generation",
      description: "Create 3D assets from simple text prompts",
      image: "/images/carousel/3d-model-gen.jpg",
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
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105 pointer-events-none",
            )}
          >
            {/* Background image with overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-6">
                <div className="max-w-2xl text-white">
                  <Badge
                    variant="outline"
                    className="mb-2 bg-blue-500/20 text-blue-700 border-blue-500/30 backdrop-blur-sm px-4 py-1"
                  >
                    Featured
                  </Badge>
                  <h1 className="text-4xl font-bold mb-2 tracking-tight">
                    {item.title}
                  </h1>
                  <p className="text-lg mb-4 text-white/80">
                    {item.description}
                  </p>
                  <div className="flex gap-4">
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Get Started
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
                    <Button variant="outline" className="backdrop-blur-sm">
                      Learn More
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
