"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/";
import Link from "next/link";

// Generate particle data outside component to avoid regeneration
const generateParticles = (count: number) => {
  return Array.from({ length: count }).map(() => {
    const size = Math.random() * 15 + 5;
    const isSmall = size < 10;
    const randomX = `calc(${Math.random() * 100}vw - ${size / 2}px)`;
    const randomY = `calc(${Math.random() * 100}vh - ${size / 2}px)`;
    const randomX2 = `calc(${Math.random() * 100}vw - ${size / 2}px)`;
    const randomY2 = `calc(${Math.random() * 100}vh - ${size / 2}px)`;
    const randomX3 = `calc(${Math.random() * 100}vw - ${size / 2}px)`;
    const randomY3 = `calc(${Math.random() * 100}vh - ${size / 2}px)`;
    const opacity1 = Math.random() * 0.5 + 0.3;
    const opacity2 = Math.random() * 0.7 + 0.3;
    const opacity3 = Math.random() * 0.5 + 0.3;
    const duration = Math.random() * 10 + 5;

    return {
      size,
      isSmall,
      randomX,
      randomY,
      randomX2,
      randomY2,
      randomX3,
      randomY3,
      opacity1,
      opacity2,
      opacity3,
      duration,
    };
  });
};

const NotFound: React.FC = () => {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const particlesRef = useRef(generateParticles(30));

  // Auto-redirect countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center overflow-hidden relative">
      {/* Enhanced gradient background with subtle animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-indigo-500/10"
        animate={{
          opacity: [0.7, 0.9, 0.7],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* Main content card with improved entrance animation */}
      <motion.div
        className="relative z-10 max-w-md w-full bg-background/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-lg"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
          duration: 0.8,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
        >
          <motion.h1
            className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
            animate={{
              scale: [1, 1.015, 1],
              filter: ["blur(0px)", "blur(0.1px)", "blur(0px)"],
            }}
            transition={{
              duration: 6,
              times: [0, 0.5, 1],
              repeat: Infinity,
              repeatType: "mirror",
              ease: [0.33, 0.1, 0.67, 0.9], // Custom cubic bezier for extreme smoothness
              restSpeed: 0.0001,
              restDelta: 0.0001,
            }}
            style={{
              willChange: "transform, filter",
              transformOrigin: "center center",
            }}
          >
            404
          </motion.h1>
        </motion.div>

        {/* Content with staggered animation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.7,
            ease: "easeOut",
          }}
        >
          <motion.h2
            className="text-2xl font-bold mt-4 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            页面未找到
          </motion.h2>

          <motion.p
            className="text-muted-foreground mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            您访问的页面不存在或已被移除。请检查URL或返回首页。
          </motion.p>

          {/* Buttons with hover animations */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="gap-2 w-full"
              >
                返回上一页
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild className="gap-2 w-full">
                <Link href="/">
                  <motion.span
                    animate={{
                      rotate: [0, 10, 0, -10, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Home className="h-4 w-4" />
                  </motion.span>
                  返回首页
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Countdown with pulse animation */}
          <motion.div
            className="mt-8 pt-4 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <RefreshCw className="h-3 w-3 animate-spin" />
              </motion.div>
              <motion.span
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                {countdown}秒后自动跳转到首页...
              </motion.span>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Fixed floating particles to stay within viewport */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particlesRef.current.map((particle, i) => {
          return (
            <motion.div
              key={i}
              className={`absolute rounded-full ${
                i % 3 === 0
                  ? "bg-primary/20"
                  : i % 3 === 1
                    ? "bg-blue-400/15"
                    : "bg-indigo-300/20"
              }`}
              style={{
                width: particle.size,
                height: particle.size,
                left: 0,
                top: 0,
                filter: `blur(${particle.isSmall ? 1 : 0}px)`,
              }}
              initial={{
                x: particle.randomX,
                y: particle.randomY,
                opacity: particle.opacity1,
              }}
              animate={{
                x: [particle.randomX, particle.randomX2, particle.randomX3],
                y: [particle.randomY, particle.randomY2, particle.randomY3],
                opacity: [
                  particle.opacity1,
                  particle.opacity2,
                  particle.opacity3,
                ],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default NotFound;
