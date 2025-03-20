import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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

// Types for mock data
interface UserCreation {
  id: string;
  type: "video" | "image";
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

interface UserStats {
  totalCreations: number;
  completedCreations: number;
  processingCreations: number;
  failedCreations: number;
  videoCount: number;
  imageCount: number;
  usagePercentage: number;
}

interface UserSubscription {
  plan: "free" | "basic" | "pro" | "enterprise";
  startDate: string;
  nextBillingDate: string;
  creditsTotal: number;
  creditsUsed: number;
}

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    preferences: user?.preferences || {
      theme: "system",
      notifications: true,
      language: "zh-CN",
    },
  });

  // Mock data for user creations
  const [userCreations, setUserCreations] = useState<UserCreation[]>([
    {
      id: "1",
      type: "video",
      title: "太空中飞行的宇航员",
      description: "一个宇航员在星空中漫游，周围是壮丽的星云和行星",
      thumbnailUrl: "/images/creations/space.jpg",
      url: "https://example.com/video1.mp4",
      createdAt: "2023-04-15T10:30:00Z",
      status: "completed",
    },
    {
      id: "2",
      type: "video",
      title: "海底世界探索",
      description: "深海的神秘生物和珊瑚礁，色彩斑斓的鱼群穿梭其中",
      thumbnailUrl: "/images/creations/underwater.jpg",
      url: "https://example.com/video2.mp4",
      createdAt: "2023-04-10T14:20:00Z",
      status: "completed",
    },
    {
      id: "3",
      type: "image",
      title: "未来城市全景",
      description: "2150年的未来城市，高楼林立，飞行汽车穿梭其中",
      thumbnailUrl: "/images/creations/future-city.jpg",
      url: "https://example.com/image1.jpg",
      createdAt: "2023-04-05T09:15:00Z",
      status: "completed",
    },
    {
      id: "4",
      type: "video",
      title: "正在生成中...",
      description: "森林中的神秘小屋，周围是雾气缭绕的古树",
      thumbnailUrl: "/images/creations/forest.jpg",
      url: "",
      createdAt: "2023-04-20T16:45:00Z",
      status: "processing",
    },
  ]);

  // Mock user stats
  const [userStats] = useState<UserStats>({
    totalCreations: 14,
    completedCreations: 12,
    processingCreations: 1,
    failedCreations: 1,
    videoCount: 10,
    imageCount: 4,
    usagePercentage: 65,
  });

  // Mock subscription data
  const [subscription] = useState<UserSubscription>({
    plan: "basic",
    startDate: "2023-03-01T00:00:00Z",
    nextBillingDate: "2023-05-01T00:00:00Z",
    creditsTotal: 100,
    creditsUsed: 65,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(userCreations.length / itemsPerPage);

  const paginatedCreations = userCreations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Redirects to login if not authenticated and not loading
  React.useEffect(() => {
    // Only redirect if we're not loading and the user is not authenticated
    // This prevents redirection during the initial auth check
    if (!isAuthenticated && !isLoading) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

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
      if (user) {
        await updateProfile({
          name: profileForm.name,
          email: profileForm.email,
          preferences: profileForm.preferences,
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleDeleteCreation = (id: string) => {
    setUserCreations(userCreations.filter((creation) => creation.id !== id));
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
  const getSubscriptionPlanInfo = (plan: string) => {
    switch (plan) {
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

  const planInfo = getSubscriptionPlanInfo(subscription.plan);

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Profile Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-1 mb-8">
        <div className="bg-background rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col md:flex-row items-center mb-4 md:mb-0">
            <Avatar className="h-24 w-24 md:mr-6 mb-4 md:mb-0 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
              <p className="text-muted-foreground mb-2">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Badge variant="outline" className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {user.role === "admin" ? "管理员" : "普通用户"}
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
                    <p className="text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">最近登录时间</h3>
                    <p className="text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(user.lastLogin)} {formatTime(user.lastLogin)}
                    </p>
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
                    {subscription.creditsUsed}/{subscription.creditsTotal}
                  </span>
                </div>
                <Progress
                  value={
                    (subscription.creditsUsed / subscription.creditsTotal) * 100
                  }
                  className="h-2"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">订阅开始日期</h3>
                <p className="text-sm">{formatDate(subscription.startDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">下次续费日期</h3>
                <p className="text-sm">
                  {formatDate(subscription.nextBillingDate)}
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
                  <h3 className="text-sm text-muted-foreground mb-1">
                    总创作数
                  </h3>
                  <p className="text-2xl font-bold">
                    {userStats.totalCreations}
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm text-muted-foreground mb-1">已完成</h3>
                  <p className="text-2xl font-bold">
                    {userStats.completedCreations}
                  </p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm text-muted-foreground mb-1">视频</h3>
                  <p className="text-2xl font-bold">{userStats.videoCount}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <h3 className="text-sm text-muted-foreground mb-1">图片</h3>
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
                        {paginatedCreations.map((creation) => (
                          <CreationCard
                            key={creation.id}
                            creation={creation}
                            onDelete={() => handleDeleteCreation(creation.id)}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                          <div className="flex items-center space-x-2">
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
                            <div className="text-sm">
                              页 {currentPage} / {totalPages}
                            </div>
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
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-block p-3 rounded-full bg-muted mb-4">
                        <Film className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">还没有创作</h3>
                      <p className="text-muted-foreground mb-4">
                        开始创建您的第一个AI生成内容吧
                      </p>
                      <Button onClick={() => router.push("/text-to-video")}>
                        创建新视频
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {userCreations
                      .filter((creation) => creation.type === "video")
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((creation) => (
                        <CreationCard
                          key={creation.id}
                          creation={creation}
                          onDelete={() => handleDeleteCreation(creation.id)}
                        />
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {userCreations
                      .filter((creation) => creation.type === "image")
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((creation) => (
                        <CreationCard
                          key={creation.id}
                          creation={creation}
                          onDelete={() => handleDeleteCreation(creation.id)}
                        />
                      ))}
                  </div>
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
