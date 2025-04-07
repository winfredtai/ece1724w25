"use client";
import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Card, Separator } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
  videoUrl?: string;
}

interface VideoItem {
  id: string;
  title?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  created_at?: string;
}

const VideoCard: React.FC<{ video: VideoItem }> = ({ video }) => {
  const t = useTranslations("Home");
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current && isVideoLoaded && !hasError) {
      videoRef.current.play().catch((err) => {
        console.error(t("videoError"), err);
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
    setHasError(true);
  };

  return (
    <Card 
      className="overflow-hidden group relative hover:shadow-xl transition-all duration-300 border-transparent hover:border-primary/20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative aspect-video bg-black/5"
      >
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
                  disablePictureInPicture
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

        {!isVideoLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <video
          ref={videoRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="auto"
          onLoadedData={handleVideoLoad}
          onError={handleError}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            !isHovered && "opacity-0",
          )}
        />

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
              <p className="text-sm">{t("videoError")}</p>
            </div>
          </div>
        )}
      </div>

      {video.title && (
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 p-4 transform transition-all duration-300",
            isHovered ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          )}
        >
          <div className="backdrop-blur-md bg-black/50 border border-white/20 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-white line-clamp-2">{video.title}</p>
            {video.created_at && (
              <p className="text-xs text-white/70 mt-1">
                {new Date(video.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("Home");

  useEffect(() => {
    const fetchLatestVideos = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/videos/latest");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("Error.getVideoError"));
        }

        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          throw new Error(t("Error.getVideoError"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("Error.getVideoError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestVideos();
  }, [t]);

  // Carousel data
  const carouselItems: CarouselItem[] = [
    {
      id: 1,
      title: t("Carousel.title1"),
      description: t("Carousel.description1"),
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/014-9_20241122_1737_Whales%20Soaring%20Skyward_remix_01jdban9ykevctk8csk530rqmc.mp4.mp4",
    },
    {
      id: 2,
      title: t("Carousel.title2"),
      description: t("Carousel.description2"),
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/004-Slack_13_assets_task_01jd7x3embfre84ebggt0r4f24_task_01jd7x3embfre84ebggt0r4f24_genid_7597d81b-a033-4b25-85f1-1d8d924686ba_24_11_21_17_43_314345_videos_00000_107724_s.mp4.mp4",
    },
    {
      id: 3,
      title: t("Carousel.title3"),
      description: t("Carousel.description3"),
      image: "/images/carousel/text-to-video.jpg",
      videoUrl:
        "https://cdn.openai.com/sora/landing-page/md/009-9_20240924_1806_Eerie%20Submarine%20Ruins_storyboard_01j8kbe4htf0sarh18w85y61r5.mp4.mp4",
    },
  ];

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Switch carousel automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex(
        (prevIndex) => (prevIndex + 1) % carouselItems.length,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // Switch carousel manually
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
            <div className="absolute inset-0 overflow-hidden">
              <video
                key={item.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                className="absolute w-full h-full object-cover"
                poster={item.image}
              >
                <source src={item.videoUrl} type="video/mp4" />
              </video>

              {/* Gradient overlay */}
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
                    {t("aiVideoGeneration")}
                  </Badge>
                  <h1 className="text-5xl font-bold mb-4 tracking-tight">
                    {item.title}
                  </h1>
                  <p className="text-xl mb-8 text-white/90 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex gap-4">
                    <Button asChild className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href="/text-to-video">
                        {t("startToday")}
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
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="backdrop-blur-sm border-white/30 hover:bg-white/20 hover:border-white/50"
                    >
                      {t("learnMore")}
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

      {/* Latest Videos Section */}
      <section className="py-16 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge
                variant="outline"
                className="mb-3 bg-primary/10 text-primary border-primary/20 px-4 py-1"
              >
                {t("discover")}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {t("latestVideos")}
              </h2>
            </div>
            <Button
              variant="outline"
              className="px-4 py-2 border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-primary"
            >
              {t("viewAll")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Button>
          </div>
          
          <div className="relative">
            {isLoading ? (
              // Loading state
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                  <Card key={index} className="animate-pulse overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : error ? (
              // Error state
              <div className="bg-background/50 backdrop-blur-sm rounded-lg border border-red-100 p-8 text-center">
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
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  {t("retry")}
                </Button>
              </div>
            ) : videos.length === 0 ? (
              // Empty state
              <div className="bg-background/50 backdrop-blur-sm rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">{t("noVideos")}</p>
              </div>
            ) : (
              // Video list
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-indigo-500/50 backdrop-blur-md"></div>
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto bg-background/10 backdrop-blur-md p-10 rounded-xl shadow-lg border border-white/20">
            <Badge
              variant="outline"
              className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1"
            >
              {t("startToday")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-white">
              {t("readyToCreate")}
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
              {t("joinCreators")}
            </p>
            <Button
              size="lg"
              className="px-8 py-6 text-lg gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {t("getStarted")}
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background/80 backdrop-blur-sm text-foreground py-16 border-t">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-6 w-6 p-0 flex items-center justify-center rounded-full bg-primary/10 text-primary border-primary/20"
                >
                  AI
                </Badge>
                Karavideo.ai
              </h3>
              <p className="text-muted-foreground">{t("footerDescription")}</p>
              <div className="flex gap-4 mt-6">
                {/* Social media icons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-muted/50 hover:bg-muted backdrop-blur-sm border-blue-500/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-muted/50 hover:bg-muted backdrop-blur-sm border-blue-500/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 bg-muted/50 hover:bg-muted backdrop-blur-sm border-blue-500/10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                {t("product")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("features")}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("pricing")}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("api")}
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                {t("resources")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("documentation")}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("blog")}
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    {t("community")}
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                {t("connect")}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Twitter
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Discord
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    GitHub
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-muted" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <p>&copy; 2025 SimpleVideo. All rights reserved.</p>
            <div className="flex gap-6">
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
              >
                {t("privacyPolicy")}
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
              >
                {t("termsOfService")}
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
              >
                {t("cookiePolicy")}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
