"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
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

const MyCreationsPage: React.FC = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [supaUser, setSupaUser] = useState<any>(null);

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

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            已完成
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            生成中
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            失败
          </Badge>
        );
      default:
        return null;
    }
  };

  // Creation item component
  const CreationItem = ({ creation }: { creation: UserCreation }) => {
    const isCompleted = creation.status === "completed";

    return (
      <Card className="overflow-hidden h-full transition-all hover:shadow-md">
        <div className="relative aspect-video overflow-hidden bg-black/5">
          <img
            src={creation.thumbnailUrl}
            alt={creation.title}
            className="w-full h-full object-cover"
          />
          {creation.status === "processing" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                <span className="text-white text-sm">正在生成...</span>
              </div>
            </div>
          )}
          {creation.status === "failed" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-sm bg-red-500/80 px-3 py-1 rounded-full">
                生成失败
              </span>
            </div>
          )}
          {creation.starred && (
            <div className="absolute top-2 right-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="opacity-90">
              {creation.type === "video" ? (
                <Film className="h-3 w-3 mr-1" />
              ) : null}
              {creation.type === "video" ? "视频" : "图片"}
            </Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-base line-clamp-1">
              {creation.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isCompleted && (
                  <>
                    <DropdownMenuItem onClick={() => handleRename(creation)}>
                      <Edit className="h-4 w-4 mr-2" />
                      重命名
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStar(creation)}
                    >
                      {creation.starred ? (
                        <>
                          <StarOff className="h-4 w-4 mr-2" />
                          取消星标
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4 mr-2" />
                          添加星标
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(creation)}>
                      <Download className="h-4 w-4 mr-2" />
                      下载
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePublish(creation)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      发布
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => handleDelete(creation)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 h-10 mb-2">
            {creation.description}
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <div>{formatDate(creation.createdAt)}</div>
            <StatusBadge status={creation.status} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
  }

  if (!supaUser) {
    return null; // 重定向到登录页面已在useEffect中处理
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">我的创作</h1>
          <div className="text-muted-foreground">查看和管理您的所有AI生成内容</div>
        </div>
        <Button onClick={() => router.push("/text-to-video")}>
          <Film className="h-4 w-4 mr-2" />
          创建新视频
        </Button>
      </div>

      <Card className="bg-background/80 backdrop-blur-sm mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索创作..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10"
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-3"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="排序方式" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新创建</SelectItem>
                  <SelectItem value="oldest">最早创建</SelectItem>
                  <SelectItem value="a-z">按名称 A-Z</SelectItem>
                  <SelectItem value="z-a">按名称 Z-A</SelectItem>
                  <SelectItem value="starred">星标优先</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="video">视频</TabsTrigger>
          <TabsTrigger value="image">图片</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {getPaginatedCreations().length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {getPaginatedCreations().map((creation) => (
                <CreationItem key={creation.id} creation={creation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-3 rounded-full bg-muted mb-4">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">没有找到创作</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "尝试使用其他搜索词"
                  : "开始创建您的第一个AI生成内容吧"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/text-to-video")}>
                  创建新视频
                </Button>
              )}
              {searchQuery && (
                <Button variant="outline" onClick={clearSearch}>
                  清除搜索
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getPaginatedCreations("video").map((creation) => (
              <CreationItem key={creation.id} creation={creation} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getPaginatedCreations("image").map((creation) => (
              <CreationItem key={creation.id} creation={creation} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名创作</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入新标题"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleConfirmRename}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            确定要删除 &ldquo;{selectedCreation?.title}&rdquo;
            吗？此操作无法撤销。
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
