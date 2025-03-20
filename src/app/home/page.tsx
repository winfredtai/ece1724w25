"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Progress,
  Badge,
  Button,
  Card,
  Separator,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// Types
interface CarouselItem {
  id: number;
  title: string;
  description: string;
  image: string;
}

interface AIEffectImage {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface FeatureCard {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface ExploreCategory {
  id: number;
  title: string;
  image: string;
  subcategories: {
    id: number;
    title: string;
    image: string;
  }[];
}

const HomePage: React.FC = () => {
  // Carousel (走马灯) data
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

  // AI Effects gallery data
  const aiEffectImages: AIEffectImage[] = [
    {
      id: 1,
      title: "Style Transfer",
      image: "/images/effects/style-transfer.jpg",
      description: "Transform photos into artistic masterpieces",
    },
    {
      id: 2,
      title: "Super Resolution",
      image: "/images/effects/super-resolution.jpg",
      description: "Enhance image quality beyond original resolution",
    },
    {
      id: 3,
      title: "Background Removal",
      image: "/images/effects/background-removal.jpg",
      description: "Automatically remove and replace backgrounds",
    },
    {
      id: 4,
      title: "Image Colorization",
      image: "/images/effects/colorization.jpg",
      description: "Add realistic colors to black and white photos",
    },
    {
      id: 5,
      title: "Portrait Enhancement",
      image: "/images/effects/portrait-enhancement.jpg",
      description: "Perfect portraits with AI enhancement",
    },
    {
      id: 6,
      title: "Text-to-Image",
      image: "/images/effects/text-to-image.jpg",
      description: "Generate images from text descriptions",
    },
  ];

  // Feature cards data
  const featureCards: FeatureCard[] = [
    {
      id: 1,
      title: "Image Generation",
      description: "Create unique images from text descriptions",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "bg-gradient-to-br from-purple-600 to-blue-500",
    },
    {
      id: 2,
      title: "Video Creation",
      description: "Convert text prompts into dynamic videos",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "bg-gradient-to-br from-red-500 to-orange-500",
    },
    {
      id: 3,
      title: "Audio Generation",
      description: "Create realistic voices and sound effects",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      ),
      color: "bg-gradient-to-br from-green-500 to-teal-500",
    },
    {
      id: 4,
      title: "3D Models",
      description: "Generate 3D assets for games and AR/VR",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      color: "bg-gradient-to-br from-indigo-500 to-purple-600",
    },
  ];

  // Explore categories data
  const exploreCategories: ExploreCategory[] = [
    {
      id: 1,
      title: "Art Styles",
      image: "/images/explore/art-styles.jpg",
      subcategories: [
        {
          id: 101,
          title: "Impressionism",
          image: "/images/explore/impressionism.jpg",
        },
        { id: 102, title: "Cubism", image: "/images/explore/cubism.jpg" },
        { id: 103, title: "Pixel Art", image: "/images/explore/pixel-art.jpg" },
        {
          id: 104,
          title: "Watercolor",
          image: "/images/explore/watercolor.jpg",
        },
      ],
    },
    {
      id: 2,
      title: "Scenes",
      image: "/images/explore/scenes.jpg",
      subcategories: [
        {
          id: 201,
          title: "Landscapes",
          image: "/images/explore/landscapes.jpg",
        },
        {
          id: 202,
          title: "Cityscapes",
          image: "/images/explore/cityscapes.jpg",
        },
        { id: 203, title: "Fantasy", image: "/images/explore/fantasy.jpg" },
        { id: 204, title: "Sci-Fi", image: "/images/explore/sci-fi.jpg" },
      ],
    },
    {
      id: 3,
      title: "Characters",
      image: "/images/explore/characters.jpg",
      subcategories: [
        { id: 301, title: "Portraits", image: "/images/explore/portraits.jpg" },
        { id: 302, title: "Anime", image: "/images/explore/anime.jpg" },
        { id: 303, title: "Cartoon", image: "/images/explore/cartoon.jpg" },
        { id: 304, title: "Realistic", image: "/images/explore/realistic.jpg" },
      ],
    },
    {
      id: 4,
      title: "Objects",
      image: "/images/explore/objects.jpg",
      subcategories: [
        {
          id: 401,
          title: "Technology",
          image: "/images/explore/technology.jpg",
        },
        { id: 402, title: "Food", image: "/images/explore/food.jpg" },
        { id: 403, title: "Fashion", image: "/images/explore/fashion.jpg" },
        {
          id: 404,
          title: "Architecture",
          image: "/images/explore/architecture.jpg",
        },
      ],
    },
  ];

  // State for carousel
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // State for AI effects gallery
  const [currentEffectIndex, setCurrentEffectIndex] = useState(0);
  const effectsRef = useRef<HTMLDivElement>(null);

  // State for explore categories
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  // Carousel auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex(
        (prevIndex) => (prevIndex + 1) % carouselItems.length,
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // Handler for manual carousel navigation
  const handleCarouselNav = (index: number) => {
    setCurrentCarouselIndex(index);
  };

  // Handler for AI effects gallery navigation
  const handleEffectScroll = (direction: "left" | "right") => {
    if (effectsRef.current) {
      const scrollAmount = 300; // Adjust based on card width + margin
      effectsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Handler for AI effects gallery navigation
  const handleEffectNav = (direction: "left" | "right") => {
    if (direction === "left") {
      setCurrentEffectIndex((prevIndex) =>
        prevIndex === 0 ? aiEffectImages.length - 1 : prevIndex - 1,
      );
    } else {
      setCurrentEffectIndex(
        (prevIndex) => (prevIndex + 1) % aiEffectImages.length,
      );
    }
  };

  // Handler for category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // 增强渲染卡片的函数
  const renderFeatureCard = (card: FeatureCard) => (
    <Card
      key={card.id}
      className={cn(
        "border border-border/30 shadow-md transition-all duration-300 overflow-hidden group hover:shadow-xl",
        "bg-background/20 backdrop-blur-sm",
        "relative h-full",
      )}
    >
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${card.color}20, transparent 80%)`,
        }}
      ></div>
      <div
        className="absolute top-0 left-0 w-1 h-full transition-all duration-300 group-hover:h-full group-hover:w-full group-hover:opacity-10"
        style={{ background: card.color }}
      ></div>

      <CardHeader>
        <div
          className="mb-4 inline-flex p-3 rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{ color: card.color, background: `${card.color}15` }}
        >
          {card.icon}
        </div>
        <CardTitle className="text-xl">{card.title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {card.description}
        </CardDescription>
      </CardHeader>
    </Card>
  );

  // This function was previously used but is now replaced with direct rendering

  // 展示区块样式封装
  // const SectionContainer = ({ children, title, subtitle, className = '' }: {
  //   children: React.ReactNode,
  //   title: string,
  //   subtitle: string,
  //   className?: string
  // }) => (
  //   <div className={`my-10 ${className}`}>
  //     <div className="mb-6 relative">
  //       <h2 className="text-2xl font-bold mb-2 inline-block">
  //         {title}
  //         <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-gradient-to-r from-primary to-blue-500"></div>
  //       </h2>
  //       <p className="text-muted-foreground">{subtitle}</p>
  //     </div>
  //     {children}
  //   </div>
  // );

  return (
    <div className="min-h-screen">
      {/* Hero Carousel */}
      <section className="relative h-[550px] overflow-hidden">
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
                    className="mb-4 bg-blue-500/20 text-blue-700 border-blue-500/30 backdrop-blur-sm px-4 py-1"
                  >
                    Featured
                  </Badge>
                  <h1 className="text-5xl font-bold mb-4 tracking-tight">
                    {item.title}
                  </h1>
                  <p className="text-xl mb-8 text-white/80">
                    {item.description}
                  </p>
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Get Started
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
                        className="size-4"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </Button>
                    <Button
                      size="lg"
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
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => handleCarouselNav(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all",
                index === currentCarouselIndex
                  ? "bg-blue-600 scale-125"
                  : "bg-white/50 hover:bg-white/80",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* AI Effects Gallery Section */}
      <section className="py-20 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="mb-3 bg-blue-500/20 text-blue-700 border-blue-500/30 px-4 py-1"
            >
              AI Effects
            </Badge>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              AI Effect Gallery
            </h2>
            <p className="text-muted-foreground text-lg">
              Transform your content with our powerful AI effects
            </p>
            <Separator className="mt-8 max-w-[100px] mx-auto bg-blue-500/30" />
          </div>

          <div className="relative">
            {/* Left arrow */}
            <Button
              onClick={() => handleEffectNav("left")}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-4 z-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-blue-500/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>

            {/* Gallery */}
            <div className="relative py-4">
              {/* Featured effect */}
              <Card className="max-w-4xl mx-auto overflow-hidden border border-border/30 shadow-lg bg-background/20 backdrop-blur-sm">
                <div className="md:flex">
                  <div className="md:w-1/2 relative overflow-hidden">
                    <img
                      src={aiEffectImages[currentEffectIndex].image}
                      alt={aiEffectImages[currentEffectIndex].title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                    <Badge className="absolute top-4 left-4 bg-blue-600/80 text-white border-0 backdrop-blur-sm">
                      Featured
                    </Badge>
                  </div>
                  <div className="p-8 md:w-1/2">
                    <CardTitle className="text-2xl mb-4">
                      {aiEffectImages[currentEffectIndex].title}
                    </CardTitle>
                    <CardDescription className="text-base mb-6">
                      {aiEffectImages[currentEffectIndex].description}
                    </CardDescription>
                    <Progress value={75} className="h-1 mb-6" />
                    <p className="text-xs text-muted-foreground mb-6">
                      75% of users recommend this effect
                    </p>
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Try it now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Horizontal scrollable thumbnails */}
              <div
                ref={effectsRef}
                className="flex overflow-x-auto gap-4 py-8 px-2 max-w-4xl mx-auto hide-scrollbar bg-background/10 rounded-lg p-4 backdrop-blur-sm"
                onWheel={(e) => {
                  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    // User is scrolling horizontally
                    return;
                  }
                  // Convert vertical scroll to horizontal
                  e.preventDefault();
                  handleEffectScroll(e.deltaY > 0 ? "right" : "left");
                }}
              >
                {aiEffectImages.map((effect, index) => (
                  <div
                    key={effect.id}
                    onClick={() => setCurrentEffectIndex(index)}
                    className={cn(
                      "flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border border-border/30",
                      index === currentEffectIndex
                        ? "ring-2 ring-blue-600 scale-110 shadow-md"
                        : "opacity-70 hover:opacity-100 hover:shadow-sm",
                    )}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <img
                            src={effect.image}
                            alt={effect.title}
                            className="w-full h-full object-cover"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{effect.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>

              {/* Effect indicators - keeping these for mobile/smaller screens */}
              <div className="flex justify-center mt-4 space-x-2">
                {aiEffectImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentEffectIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentEffectIndex
                        ? "bg-blue-600 scale-125"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                    )}
                    aria-label={`View effect ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right arrow */}
            <Button
              onClick={() => handleEffectNav("right")}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-4 z-10 rounded-full shadow-md bg-background/80 backdrop-blur-sm border-blue-500/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-blue-500/10"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="mb-3 bg-blue-500/20 text-blue-700 border-blue-500/30 px-4 py-1"
            >
              Features
            </Badge>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Start Your Generation
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our powerful AI tools to create stunning content
            </p>
            <Separator className="mt-8 max-w-[100px] mx-auto bg-blue-500/30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureCards.map((card) => renderFeatureCard(card))}
          </div>
        </div>
      </section>

      {/* Explore Categories Section */}
      <section className="py-20 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-indigo-500/10"></div>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <Badge
              variant="outline"
              className="mb-3 bg-blue-500/20 text-blue-700 border-blue-500/30 px-4 py-1"
            >
              Discover
            </Badge>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Explore Categories
            </h2>
            <p className="text-muted-foreground text-lg">
              Browse through our collection of AI-powered creative categories
            </p>
            <Separator className="mt-8 max-w-[100px] mx-auto bg-blue-500/30" />
          </div>

          <div className="space-y-10">
            {exploreCategories.map((category) => (
              <Card
                key={category.id}
                className="overflow-hidden border border-border/30 shadow-md bg-background/20 backdrop-blur-sm"
              >
                {/* Category header */}
                <div
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div
                    className="h-56 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url(${category.image})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between p-8">
                    <CardTitle className="text-3xl font-bold text-white">
                      {category.title}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "rounded-full bg-black/20 border-white/20 text-white hover:bg-black/40 hover:text-white transition-all duration-300",
                        expandedCategory === category.id ? "rotate-180" : "",
                      )}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Subcategories */}
                <div
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 transition-all duration-500",
                    expandedCategory === category.id
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden",
                  )}
                >
                  {category.subcategories.map((subcat) => (
                    <Card
                      key={subcat.id}
                      className="overflow-hidden border border-border/30 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group bg-background/20 backdrop-blur-sm"
                    >
                      <div className="h-36 overflow-hidden relative">
                        <img
                          src={subcat.image}
                          alt={subcat.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <CardHeader className="p-3">
                        <CardTitle className="text-base">
                          {subcat.title}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-600/90"></div>
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-10 rounded-2xl shadow-lg border border-white/20">
            <Badge
              variant="outline"
              className="mb-4 bg-white/20 text-white border-white/30 px-4 py-1"
            >
              Start Today
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              Ready to Create Your AI Masterpiece?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
              Join thousands of creators who are pushing the boundaries of
              what&apos;s possible with AI-generated content.
            </p>
            <Button
              variant="secondary"
              size="lg"
              className="px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 bg-white text-primary hover:bg-white/90 backdrop-blur-sm text-black"
            >
              Get Started for Free
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
              <p className="text-muted-foreground">
                Transforming ideas into visual reality with AI.
              </p>
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
                Product
              </h4>
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Features
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Pricing
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    API
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Documentation
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Blog
                  </Button>
                </li>
                <li>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-muted-foreground hover:text-primary"
                  >
                    Community
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Connect
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
                Privacy Policy
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
              >
                Terms of Service
              </Button>
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground hover:text-primary text-sm"
              >
                Cookie Policy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
