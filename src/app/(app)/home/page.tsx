"use client";
import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Card, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  width: number;
  height: number;
}

// 视频卡片组件
const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.play().catch(err => {
        console.error("视频播放失败:", err);
      });
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    // 如果用户已经悬停在卡片上，自动播放视频
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("视频加载后播放失败:", err);
      });
    }
  };
  
  return (
    <Card className="overflow-hidden group relative">
      <div 
        className="aspect-video relative overflow-hidden" 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
      >
        {/* 视频占位背景 */}
        <div className="w-full h-full bg-black/10 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        
        {/* 视频 - 懒加载 */}
        <video 
          ref={videoRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={handleVideoLoad}
          className={`absolute inset-0 w-full h-full object-cover ${isHovered && isVideoLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
        
        {/* 播放指示器 */}
        <div className={`absolute inset-0 flex items-center justify-center ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
    </Card>
  );
};

const HomePage: React.FC = () => {
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
  
  // 视频列表数据
  const videoItems: VideoItem[] = [
    {
      id: "video-1",
      videoUrl: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm4cc1sft0039mujrzts9zs91/video/1737602333639-f68a1794-cefd-483a-8774-69a9aec8299a.mp4",
      width: 640,
      height: 360
    },
    {
      id: "video-2",
      videoUrl: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm29u7tiy0005mu3qdyftoy02/video/1737612550902-cc05158b-eee5-4220-a4e8-266bec223b7f.mp4",
      width: 640,
      height: 360
    },
    {
      id: "video-3",
      videoUrl: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm4cc1sft0039mujrzts9zs91/video/1737596719640-2ae1cb33-186d-4d6f-92ef-b3de1ef848c5.mp4",
      width: 640,
      height: 360
    },
    {
      id: "video-4",
      videoUrl: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm2mq7cq70007muxhlwdpacfe/video/1734941704009-557fa9f2-3f32-49df-a345-e06f4921fbb7.mp4",
      width: 640,
      height: 360
    },
    {
      id: "video-5",
      videoUrl: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm52hfkx4006emugg9m35ygur/video/1736284387237-283417e2-7953-4328-af0c-a603aa3dec24.mp4",
      width: 640,
      height: 360
    }
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
                    <Button
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
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
                        className="size-4"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel navigation indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => handleCarouselNav(index)}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all",
                index === currentCarouselIndex
                  ? "bg-blue-600 scale-125"
                  : "bg-white/50 hover:bg-white/80",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>
      
      {/* 视频展示区域 */}
      <section className="py-12 px-6 bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto">
          <div className="flex items-center mb-8">
            <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
            <h2 className="text-2xl font-bold">AI生成视频</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videoItems.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
