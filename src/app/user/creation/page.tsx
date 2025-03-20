"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from '@supabase/supabase-js';
import {
  Input,
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";
import {
  Film,
  Search,
  Star,
  StarOff,
  Download,
  Share2,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  X,
} from "lucide-react";

// Types for creations
interface UserCreation {
  id: string;
  type: "video" | "image";
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
  starred?: boolean;
}

const MyCreationsPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [supaUser, setSupaUser] = useState<User | null>(null);

  // Creation states
  const [creations, setCreations] = useState<UserCreation[]>([]);
  const [filteredCreations, setFilteredCreations] = useState<UserCreation[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCreation, setSelectedCreation] = useState<UserCreation | null>(
    null,
  );
  const [newTitle, setNewTitle] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortOption, setSortOption] = useState("newest");

  // 检查 Supabase 认证状态
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          // 获取用户信息
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            throw userError;
          }
          
          if (userData.user) {
            setSupaUser(userData.user);
          } else {
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("检查认证状态时出错:", err);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSupabaseAuth();
  }, [router, supabase]);

  // Load mock data
  useEffect(() => {
    // In a real application, this would be an API call
    const mockData: UserCreation[] = [
      {
        id: "1",
        type: "video",
        title: "太空中飞行的宇航员",
        description: "一个宇航员在星空中漫游，周围是壮丽的星云和行星",
        thumbnailUrl: "/images/creations/space.jpg",
        url: "https://example.com/video1.mp4",
        createdAt: "2023-04-15T10:30:00Z",
        status: "completed",
        starred: true,
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
        starred: false,
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
        starred: false,
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
        starred: false,
      },
      {
        id: "5",
        type: "video",
        title: "沙漠中的绿洲",
        description: "一片神秘的绿洲出现在广阔沙漠中，棕榈树环绕着清澈的湖泊",
        thumbnailUrl: "/images/creations/oasis.jpg",
        url: "https://example.com/video3.mp4",
        createdAt: "2023-03-28T11:20:00Z",
        status: "completed",
        starred: true,
      },
      {
        id: "6",
        type: "image",
        title: "北极光下的森林",
        description: "茂密的针叶林在北极光的照耀下，呈现出梦幻般的景象",
        thumbnailUrl: "/images/creations/aurora.jpg",
        url: "https://example.com/image2.jpg",
        createdAt: "2023-03-15T20:45:00Z",
        status: "completed",
        starred: false,
      },
      {
        id: "7",
        type: "video",
        title: "生成失败",
        description: "尝试生成的山峰视频，遇到了技术问题",
        thumbnailUrl: "/images/creations/mountains.jpg",
        url: "",
        createdAt: "2023-03-10T09:30:00Z",
        status: "failed",
        starred: false,
      },
      {
        id: "8",
        type: "image",
        title: "古代建筑",
        description: "历史悠久的古代建筑，石柱和拱门展示着精湛的工艺",
        thumbnailUrl: "/images/creations/ancient.jpg",
        url: "https://example.com/image3.jpg",
        createdAt: "2023-02-28T14:10:00Z",
        status: "completed",
        starred: false,
      },
      {
        id: "9",
        type: "video",
        title: "城市夜景",
        description: "繁华城市的夜景，霓虹灯和车流构成动态的光影画面",
        thumbnailUrl: "/images/creations/city-night.jpg",
        url: "https://example.com/video4.mp4",
        createdAt: "2023-02-20T19:25:00Z",
        status: "completed",
        starred: false,
      },
      {
        id: "10",
        type: "image",
        title: "热带雨林",
        description: "茂密的热带雨林，阳光透过树叶形成斑驳的光影",
        thumbnailUrl: "/images/creations/rainforest.jpg",
        url: "https://example.com/image4.jpg",
        createdAt: "2023-02-15T11:50:00Z",
        status: "completed",
        starred: true,
      },
    ];

    setCreations(mockData);
  }, []);

  // Apply search filter and sorting
  useEffect(() => {
    let results = [...creations];

    // Apply search filter
    if (searchQuery) {
      results = results.filter((creation) =>
        creation.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "oldest":
        results.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "a-z":
        results.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "z-a":
        results.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "starred":
        results.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
        break;
    }

    setFilteredCreations(results);
    setTotalPages(Math.ceil(results.length / itemsPerPage));
  }, [creations, searchQuery, sortOption]);

  const getPaginatedCreations = (currentTab: string = "all") => {
    let filtered = [...filteredCreations];

    // Apply tab filter
    if (currentTab !== "all") {
      filtered = filtered.filter((creation) => creation.type === currentTab);
    }

    return filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  };

  // Creation management functions
  const handleRename = (creation: UserCreation) => {
    setSelectedCreation(creation);
    setNewTitle(creation.title);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = () => {
    if (selectedCreation && newTitle.trim()) {
      setCreations((prevCreations) =>
        prevCreations.map((creation) =>
          creation.id === selectedCreation.id
            ? { ...creation, title: newTitle.trim() }
            : creation,
        ),
      );
      setRenameDialogOpen(false);
    }
  };

  const handleToggleStar = (creation: UserCreation) => {
    setCreations((prevCreations) =>
      prevCreations.map((c) =>
        c.id === creation.id ? { ...c, starred: !c.starred } : c,
      ),
    );
  };

  const handleDelete = (creation: UserCreation) => {
    setSelectedCreation(creation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCreation) {
      setCreations((prevCreations) =>
        prevCreations.filter((creation) => creation.id !== selectedCreation.id),
      );
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = (creation: UserCreation) => {
    // In a real app, this would initiate a download
    console.log(`Downloading ${creation.title}`);
    alert(`Downloading "${creation.title}". This is a mock implementation.`);
  };

  const handlePublish = (creation: UserCreation) => {
    // In a real app, this would publish the creation
    console.log(`Publishing ${creation.title}`);
    alert(`Publishing "${creation.title}". This is a mock implementation.`);
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-xl">正在加载您的创作...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">我的创作</h1>

      {/* 搜索和排序栏 */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索创作..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2.5 top-2.5"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value)}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新优先</SelectItem>
              <SelectItem value="oldest">最早优先</SelectItem>
              <SelectItem value="a-z">按名称 (A-Z)</SelectItem>
              <SelectItem value="z-a">按名称 (Z-A)</SelectItem>
              <SelectItem value="starred">收藏优先</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="video">视频</TabsTrigger>
          <TabsTrigger value="image">图像</TabsTrigger>
        </TabsList>

        {["all", "video", "image"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filteredCreations.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <Film className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-medium">没有找到创作</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? `没有找到与"${searchQuery}"相关的创作`
                    : "您还没有创建任何内容"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {getPaginatedCreations(tab).map((creation) => (
                    <Card key={creation.id} className="overflow-hidden">
                      <div className="relative aspect-video">
                        <img
                          src={creation.thumbnailUrl}
                          alt={creation.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 flex space-x-1">
                          {creation.status === "processing" && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              生成中
                            </Badge>
                          )}
                          {creation.status === "failed" && (
                            <Badge variant="destructive">生成失败</Badge>
                          )}
                          {creation.type === "video" && (
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              视频
                            </Badge>
                          )}
                          {creation.type === "image" && (
                            <Badge variant="secondary" className="bg-green-500 text-white">
                              图像
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => handleToggleStar(creation)}
                          className="absolute left-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                        >
                          {creation.starred ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-medium line-clamp-1">{creation.title}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="-mr-2">
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
                                  className="lucide lucide-more-vertical"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRename(creation)}>
                                <Edit className="mr-2 h-4 w-4" />
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(creation)}>
                                <Download className="mr-2 h-4 w-4" />
                                下载
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePublish(creation)}>
                                <Share2 className="mr-2 h-4 w-4" />
                                发布
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => handleDelete(creation)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {creation.description}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          创建于{" "}
                          {new Date(creation.createdAt).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 分页控制 */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      第 {currentPage} 页，共 {totalPages} 页
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名创作</DialogTitle>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="输入新名称"
            className="my-4"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleConfirmRename}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            您确定要删除
            <span className="font-medium"> "{selectedCreation?.title}" </span>吗？
            此操作无法撤消。
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCreationsPage;