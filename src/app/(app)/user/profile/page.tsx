"use client"; // This is a client component that uses React hooks

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  Input,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  Film,
  Settings,
  Edit2,
  Save,
  Calendar,
  Clock,
  Crown,
  Star,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { CreationCard } from "@/components/creation-card";
import { Tables } from "@/types/supabase";
import { useAuth } from "@/components/authProvider";

type UserCreation = Partial<Tables<"video_generation_task_definitions">> &
  Partial<Tables<"video_generation_task_statuses">>;

type UserStats = {
  totalCreations: number;
  completedCreations: number;
  processingCreations: number;
  failedCreations: number;
  videoCount: number;
  imageCount: number;
  usagePercentage: number;
};

type UserSubscription = Tables<"user_subscriptions">;

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    preferences: {
      theme: "system" as "light" | "dark" | "system",
      notifications: true,
      language: "zh-CN",
    },
  });

  const [userCreations, setUserCreations] = useState<UserCreation[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({} as UserStats);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(userCreations.length / itemsPerPage);

  const paginatedCreations = userCreations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const { user, logout, getAvatarUrl } = useAuth();

  // Function declarations with useCallback
  const fetchUserCreations = useCallback(async () => {
    try {
      const response = await fetch("/user/fetch-creation");
      if (!response.ok) {
        throw new Error(`Error fetching creations: ${response.statusText}`);
      }

      const data = await response.json();
      const creations = data.creations as UserCreation[];

      if (!creations || creations.length === 0) {
        setUserCreations([]);
        setUserStats((prev) => ({
          ...prev,
          totalCreations: 0,
          completedCreations: 0,
          processingCreations: 0,
          failedCreations: 0,
          videoCount: 0,
          imageCount: 0,
        }));
        return;
      }

      setUserCreations(creations);

      const stats = {
        totalCreations: creations.length,
        completedCreations: creations.filter((c) => c.status === "completed")
          .length,
        processingCreations: creations.filter((c) => c.status === "processing")
          .length,
        failedCreations: creations.filter((c) => c.status === "failed").length,
        videoCount: creations.filter((c) => c.task_type === "video").length,
        imageCount: creations.filter((c) => c.task_type === "image").length,
      };

      setUserStats((prev) => ({
        ...prev,
        ...stats,
      }));
    } catch (error) {
      console.error("获取用户创作失败:", error);
    }
  }, []);

  const fetchUserSubscription = useCallback(async () => {
    try {
      const response = await fetch("/user/fetch-subscription");
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error("获取用户订阅失败:", error);
    }
  }, []);

  const fetchUserCredits = useCallback(async () => {
    try {
      const response = await fetch("/user/fetch-credit");
      const data = await response.json();
      setUserStats((prev) => ({
        ...prev,
        usagePercentage: subscription?.credits_per_period
          ? Math.round(
              (data.total_credits_used / subscription.credits_per_period) * 100,
            )
          : 0,
      }));
    } catch (error) {
      console.error("获取用户额度失败:", error);
    }
  }, [subscription]);

  useEffect(() => {
    if (user) {
      fetchUserCreations();
      fetchUserSubscription();
      fetchUserCredits();
    }
  }, [
    user,
    fetchUserCreations,
    fetchUserSubscription,
    fetchUserCredits,
    subscription,
  ]);

  const handleDeleteCreation = async (id: number) => {
    try {
      // Delete the task status first (due to foreign key constraint)
      const { error: statusError } = await supabase
        .from("video_generation_task_statuses")
        .delete()
        .eq("task_id", id);

      if (statusError) throw statusError;

      // Then delete the task definition
      const { error: taskError } = await supabase
        .from("video_generation_task_definitions")
        .delete()
        .eq("id", id);

      if (taskError) throw taskError;

      // Update the UI
      setUserCreations(userCreations.filter((creation) => creation.id !== id));

      // Update stats
      const deletedCreation = userCreations.find((c) => c.id === id);
      if (deletedCreation) {
        setUserStats((prev) => ({
          ...prev,
          totalCreations: prev.totalCreations - 1,
          completedCreations:
            deletedCreation.status === "completed"
              ? prev.completedCreations - 1
              : prev.completedCreations,
          processingCreations:
            deletedCreation.status === "processing"
              ? prev.processingCreations - 1
              : prev.processingCreations,
          failedCreations:
            deletedCreation.status === "failed"
              ? prev.failedCreations - 1
              : prev.failedCreations,
          videoCount:
            deletedCreation.task_type === "video"
              ? prev.videoCount - 1
              : prev.videoCount,
          imageCount:
            deletedCreation.task_type === "image"
              ? prev.imageCount - 1
              : prev.imageCount,
        }));
      }
    } catch (error) {
      console.error("删除创作失败:", error);
    }
  };

  //   // Mock data for user creations
  //   const [userCreations, setUserCreations] = useState<UserCreation[]>([
  //     {
  //       id: 1,
  //       type: "video",
  //       title: "太空中飞行的宇航员",
  //       description: "一个宇航员在星空中漫游，周围是壮丽的星云和行星",
  //       thumbnailUrl: "/images/creations/space.jpg",
  //       url: "https://example.com/video1.mp4",
  //       createdAt: "2023-04-15T10:30:00Z",
  //       status: "completed",
  //     },
  //     {
  //       id: "2",
  //       type: "video",
  //       title: "海底世界探索",
  //       description: "深海的神秘生物和珊瑚礁，色彩斑斓的鱼群穿梭其中",
  //       thumbnailUrl: "/images/creations/underwater.jpg",
  //       url: "https://example.com/video2.mp4",
  //       createdAt: "2023-04-10T14:20:00Z",
  //       status: "completed",
  //     },
  //     {
  //       id: "3",
  //       type: "image",
  //       title: "未来城市全景",
  //       description: "2150年的未来城市，高楼林立，飞行汽车穿梭其中",
  //       thumbnailUrl: "/images/creations/future-city.jpg",
  //       url: "https://example.com/image1.jpg",
  //       createdAt: "2023-04-05T09:15:00Z",
  //       status: "completed",
  //     },
  //     {
  //       id: "4",
  //       type: "video",
  //       title: "正在生成中...",
  //       description: "森林中的神秘小屋，周围是雾气缭绕的古树",
  //       thumbnailUrl: "/images/creations/forest.jpg",
  //       url: "",
  //       createdAt: "2023-04-20T16:45:00Z",
  //       status: "processing",
  //     },
  //   ]);

  //   // Mock user stats
  //   const [userStats] = useState<UserStats>({
  //     totalCreations: 14,
  //     completedCreations: 12,
  //     processingCreations: 1,
  //     failedCreations: 1,
  //     videoCount: 10,
  //     imageCount: 4,
  //     usagePercentage: 65,
  //   });

  //   // Mock subscription data
  //   const [subscription] = useState<UserSubscription>({
  //     plan: "basic",
  //     startDate: "2023-03-01T00:00:00Z",
  //     nextBillingDate: "2023-05-01T00:00:00Z",
  //     creditsTotal: 100,
  //     creditsUsed: 65,
  //   });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  const handlePreferenceChange = (type: string, value: string | boolean) => {
    setProfileForm({
      ...profileForm,
      preferences: {
        ...profileForm.preferences,
        [type]: value,
      },
    });
  };

  const handleSaveProfile = async () => {
    try {
      // 暂未实现真正的保存逻辑，仅模拟效果
      setIsEditing(false);
    } catch (error) {
      console.error("更新资料失败:", error);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get subscription plan display information
  const getSubscriptionPlanInfo = (planType: string) => {
    switch (planType) {
      case "free":
        return { name: "免费版", color: "bg-gray-200 text-gray-700" };
      case "basic":
        return { name: "基础版", color: "bg-blue-100 text-blue-700" };
      case "pro":
        return { name: "专业版", color: "bg-purple-100 text-purple-700" };
      case "enterprise":
        return { name: "企业版", color: "bg-amber-100 text-amber-700" };
      default:
        return { name: "未知", color: "bg-gray-100 text-gray-700" };
    }
  };

  const planInfo = subscription
    ? getSubscriptionPlanInfo(subscription.plan_type)
    : getSubscriptionPlanInfo("free");

  // 获取用户展示信息
  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const nameParts = user.user_metadata.full_name.split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return user.user_metadata.full_name.substring(0, 2).toUpperCase();
    }

    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }

    return "?";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Profile Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-1 mb-8">
        <div className="bg-background rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
            <Avatar className="h-24 w-24 md:mr-6 mb-4 md:mb-0 border-4 border-background shadow-lg">
              <AvatarImage src={getAvatarUrl()} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-1">
                {user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  user?.email}
              </h1>
              <div className="text-muted-foreground mb-2">{user?.email}</div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Badge variant="outline" className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  普通用户
                </Badge>
                <Badge className={`flex items-center ${planInfo.color}`}>
                  <Crown className="h-3 w-3 mr-1" />
                  {planInfo.name}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-1" />
                  编辑资料
                </>
              )}
            </Button>
            <Button size="sm" onClick={() => router.push("/text-to-video")}>
              <Film className="h-4 w-4 mr-1" />
              新建创作
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Profile Info & Stats */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                账户信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      用户名
                    </label>
                    <Input
                      name="name"
                      value={profileForm.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      邮箱
                    </label>
                    <Input
                      name="email"
                      value={profileForm.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    className="mt-2"
                  >
                    保存更改
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-1">账户创建时间</h3>
                    <div className="text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(user?.created_at || "")}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">最近登录时间</h3>
                    <div className="text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(user?.user_metadata?.last_sign_in_at)}{" "}
                      {formatTime(user?.user_metadata?.last_sign_in_at)}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={logout}
              >
                退出登录
              </Button>
            </CardFooter>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                我的订阅
              </CardTitle>
              <CardDescription>
                当前套餐: <span className="font-medium">{planInfo.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">额度使用情况</span>
                  <span className="text-sm font-medium">
                    {subscription?.credits_per_period || 0}/
                    {subscription?.credits_per_period || 0}
                  </span>
                </div>
                <Progress
                  value={
                    subscription
                      ? (subscription.credits_per_period /
                          subscription.credits_per_period) *
                        100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">订阅开始日期</h3>
                <p className="text-sm">
                  {subscription ? formatDate(subscription.start_date) : "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">下次续费日期</h3>
                <p className="text-sm">
                  {subscription
                    ? formatDate(subscription.next_renewal_date)
                    : "-"}
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                升级套餐
              </Button>
            </CardFooter>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                创作统计
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">总创作数</h3>
                  <p className="text-2xl font-bold">
                    {userStats.totalCreations}
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">已完成</h3>
                  <p className="text-2xl font-bold">
                    {userStats.completedCreations}
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">视频</h3>
                  <p className="text-2xl font-bold">{userStats.videoCount}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm font-medium mb-1">图片</h3>
                  <p className="text-2xl font-bold">{userStats.imageCount}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">使用量</span>
                  <span className="text-sm font-medium">
                    {userStats.usagePercentage}%
                  </span>
                </div>
                <Progress value={userStats.usagePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Creations */}
        <div className="md:col-span-2">
          <Card className="bg-background/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Film className="h-5 w-5 mr-2" />
                  我的创作
                </CardTitle>
                <CardDescription>查看和管理您的所有AI创作</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/text-to-video")}
              >
                创建新视频
              </Button>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger value="all">全部</TabsTrigger>
                    <TabsTrigger value="videos">视频</TabsTrigger>
                    <TabsTrigger value="images">图片</TabsTrigger>
                  </TabsList>

                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="排序方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">最新创建</SelectItem>
                      <SelectItem value="oldest">最早创建</SelectItem>
                      <SelectItem value="a-z">按名称 A-Z</SelectItem>
                      <SelectItem value="z-a">按名称 Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <TabsContent value="all" className="space-y-6">
                  {userCreations.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Show only 2 creations in profile page */}
                        {paginatedCreations.slice(0, 2).map((creation) => (
                          <CreationCard
                            key={creation.id?.toString() || ""}
                            creation={{
                              id: creation.id?.toString() || "",
                              type:
                                creation.task_type === "video"
                                  ? "video"
                                  : "image",
                              title: creation.prompt || "Untitled",
                              description: creation.prompt || "",
                              thumbnailUrl:
                                creation.thumbnail_url ||
                                "/images/creations/placeholder.jpg",
                              url: creation.result_url || "",
                              createdAt: creation.created_at || "",
                              status:
                                (creation.status as
                                  | "completed"
                                  | "processing"
                                  | "failed") || "processing",
                            }}
                            onDelete={() =>
                              handleDeleteCreation(creation.id || 0)
                            }
                          />
                        ))}
                      </div>

                      {/* View All button */}
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={() => router.push("/user/creation")}
                          variant="outline"
                          className="w-full max-w-xs"
                        >
                          查看全部创作
                        </Button>
                      </div>

                      {/* Pagination controls - hidden in profile page */}
                      {false && totalPages > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages),
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        您还没有创作任何内容
                      </div>
                      <Button onClick={() => router.push("/text-to-video")}>
                        创建第一个视频
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  {userCreations.filter((c) => c.task_type === "video").length >
                  0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Show only 2 video creations */}
                        {userCreations
                          .filter((c) => c.task_type === "video")
                          .slice(0, 2)
                          .map((creation) => (
                            <CreationCard
                              key={creation.id?.toString() || ""}
                              creation={{
                                id: creation.id?.toString() || "",
                                type:
                                  creation.task_type === "video"
                                    ? "video"
                                    : "image",
                                title: creation.prompt || "Untitled",
                                description: creation.prompt || "",
                                thumbnailUrl:
                                  creation.thumbnail_url ||
                                  "/images/creations/placeholder.jpg",
                                url: creation.result_url || "",
                                createdAt: creation.created_at || "",
                                status:
                                  (creation.status as
                                    | "completed"
                                    | "processing"
                                    | "failed") || "processing",
                              }}
                              onDelete={() =>
                                handleDeleteCreation(creation.id || 0)
                              }
                            />
                          ))}
                      </div>

                      {/* View All Videos button */}
                      {userCreations.filter((c) => c.task_type === "video")
                        .length > 2 && (
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={() => router.push("/user/creation")}
                            variant="outline"
                            className="w-full max-w-xs"
                          >
                            查看全部视频
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        您还没有创建任何视频
                      </div>
                      <Button onClick={() => router.push("/text-to-video")}>
                        创建第一个视频
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="images" className="space-y-6">
                  {userCreations.filter((c) => c.task_type === "image").length >
                  0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Show only 2 image creations */}
                        {userCreations
                          .filter((c) => c.task_type === "image")
                          .slice(0, 2)
                          .map((creation) => (
                            <CreationCard
                              key={creation.id?.toString() || ""}
                              creation={{
                                id: creation.id?.toString() || "",
                                type:
                                  creation.task_type === "video"
                                    ? "video"
                                    : "image",
                                title: creation.prompt || "Untitled",
                                description: creation.prompt || "",
                                thumbnailUrl:
                                  creation.thumbnail_url ||
                                  "/images/creations/placeholder.jpg",
                                url: creation.result_url || "",
                                createdAt: creation.created_at || "",
                                status:
                                  (creation.status as
                                    | "completed"
                                    | "processing"
                                    | "failed") || "processing",
                              }}
                              onDelete={() =>
                                handleDeleteCreation(creation.id || 0)
                              }
                            />
                          ))}
                      </div>

                      {/* View All Images button */}
                      {userCreations.filter((c) => c.task_type === "image")
                        .length > 2 && (
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={() => router.push("/user/creation")}
                            variant="outline"
                            className="w-full max-w-xs"
                          >
                            查看全部图片
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-muted-foreground mb-4">
                        您还没有创建任何图片
                      </div>
                      <Button onClick={() => router.push("/text-to-image")}>
                        创建第一个图片
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                账户设置
              </CardTitle>
              <CardDescription>管理您的账户偏好设置</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preferences" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="preferences">偏好设置</TabsTrigger>
                  <TabsTrigger value="notifications">通知设置</TabsTrigger>
                  <TabsTrigger value="security">安全设置</TabsTrigger>
                </TabsList>

                <TabsContent value="preferences">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">界面主题</h3>
                      <div className="flex space-x-4">
                        <div
                          className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${profileForm.preferences.theme === "light" ? "border-primary" : "hover:border-primary"}`}
                          onClick={() =>
                            handlePreferenceChange("theme", "light")
                          }
                        >
                          <div className="w-20 h-12 bg-white rounded mb-2"></div>
                          <span className="text-sm">浅色</span>
                        </div>
                        <div
                          className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${profileForm.preferences.theme === "dark" ? "border-primary" : "hover:border-primary"}`}
                          onClick={() =>
                            handlePreferenceChange("theme", "dark")
                          }
                        >
                          <div className="w-20 h-12 bg-gray-800 rounded mb-2"></div>
                          <span className="text-sm">深色</span>
                        </div>
                        <div
                          className={`border rounded-md p-3 flex flex-col items-center cursor-pointer ${profileForm.preferences.theme === "system" ? "border-primary" : "hover:border-primary"}`}
                          onClick={() =>
                            handlePreferenceChange("theme", "system")
                          }
                        >
                          <div className="w-20 h-12 bg-gradient-to-r from-gray-100 to-gray-800 rounded mb-2"></div>
                          <span className="text-sm">跟随系统</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3">语言设置</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`border rounded-md p-3 flex items-center cursor-pointer ${profileForm.preferences.language === "zh-CN" ? "border-primary" : "hover:border-primary"}`}
                          onClick={() =>
                            handlePreferenceChange("language", "zh-CN")
                          }
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-2">
                            中
                          </div>
                          <span>中文 (简体)</span>
                        </div>
                        <div
                          className={`border rounded-md p-3 flex items-center cursor-pointer ${profileForm.preferences.language === "en" ? "border-primary" : "hover:border-primary"}`}
                          onClick={() =>
                            handlePreferenceChange("language", "en")
                          }
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            En
                          </div>
                          <span>English</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notifications">
                  <div>
                    <h3 className="text-sm font-medium mb-3">电子邮件通知</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm">创作完成通知</label>
                        <input
                          type="checkbox"
                          className="toggle"
                          checked={profileForm.preferences.notifications}
                          onChange={(e) =>
                            handlePreferenceChange(
                              "notifications",
                              e.target.checked,
                            )
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">系统更新通知</label>
                        <input
                          type="checkbox"
                          className="toggle"
                          defaultChecked
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm">营销邮件</label>
                        <input type="checkbox" className="toggle" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">账户安全</h3>
                      <div className="space-y-4">
                        <Button variant="outline">修改密码</Button>
                        <div>
                          <h4 className="text-sm font-medium mb-1">两步验证</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            启用两步验证以提高账户安全性
                          </p>
                          <Button variant="secondary" size="sm">
                            设置两步验证
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
