"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/authProvider";
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
  Play,
} from "lucide-react";
import Image from "next/image";

// Types for API response
interface ApiCreation {
  id: number;
  task_type: string;
  prompt: string | null;
  thumbnail_url: string | null;
  result_url: string | null;
  created_at: string;
  status: string;
}

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
  prompt?: string;
}

const MyCreationsPage = () => {
  const router = useRouter();
  const supabase = createClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Creation states
  const [creations, setCreations] = useState<UserCreation[]>([]);
  const [filteredCreations, setFilteredCreations] = useState<UserCreation[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
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

  // Check authentication and fetch user creations
  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setIsLoading(true);

        if (isAuthenticated) {
          // User is authenticated, fetch user creations
          const response = await fetch("/api/user/fetch-creation");
          const { creations } = await response.json();

          // Transform the API response to match our UserCreation interface
          const transformedCreations = creations.map(
            (creation: ApiCreation) => ({
              id: creation.id.toString(),
              type: creation.task_type === "video" ? "video" : "image",
              title: creation.prompt || "Untitled",
              description: creation.prompt || "",
              thumbnailUrl:
                creation.thumbnail_url || "/images/creations/placeholder.jpg",
              url: creation.result_url || "",
              createdAt: creation.created_at || new Date().toISOString(),
              status: creation.status || "processing",
              starred: false, // We can implement this feature later
              prompt: creation.prompt || "",
            }),
          );

          setCreations(transformedCreations);
          setFilteredCreations(transformedCreations);
        } else if (!authLoading) {
          // Redirect only when authentication status is loaded and user is not authenticated
          router.push("/login");
        }
      } catch (err) {
        console.error("Error checking auth or fetching creations:", err);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [isAuthenticated, authLoading, router]);

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

  const handleConfirmRename = async () => {
    if (selectedCreation && newTitle.trim()) {
      try {
        const taskId = parseInt(selectedCreation.id);

        // 更新任务定义中的prompt字段作为新标题
        const { error } = await supabase
          .from("video_generation_task_definitions")
          .update({ prompt: newTitle.trim() })
          .eq("id", taskId);

        if (error) throw error;

        // 更新本地状态
        setCreations((prevCreations) =>
          prevCreations.map((creation) =>
            creation.id === selectedCreation.id
              ? { ...creation, title: newTitle.trim() }
              : creation,
          ),
        );

        setRenameDialogOpen(false);
      } catch (error) {
        console.error("重命名创作失败:", error);
        alert("重命名创作失败，请稍后再试");
      }
    }
  };

  const handleToggleStar = async (creation: UserCreation) => {
    try {
      if (!user) return;

      const userId = user.id;
      const taskId = parseInt(creation.id);

      if (creation.starred) {
        // 如果已收藏，则取消收藏
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("task_id", taskId);

        if (error) throw error;
      } else {
        // 如果未收藏，则添加收藏
        const { error } = await supabase.from("user_favorites").insert({
          user_id: userId,
          task_id: taskId,
        });

        if (error) throw error;
      }

      // 更新本地状态
      setCreations((prevCreations) =>
        prevCreations.map((c) =>
          c.id === creation.id ? { ...c, starred: !c.starred } : c,
        ),
      );
    } catch (error) {
      console.error("切换收藏状态失败:", error);
    }
  };

  const handleDelete = (creation: UserCreation) => {
    setSelectedCreation(creation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCreation) {
      try {
        const taskId = parseInt(selectedCreation.id);

        // 删除任务状态
        const { error: statusError } = await supabase
          .from("video_generation_task_statuses")
          .delete()
          .eq("task_id", taskId);

        if (statusError) throw statusError;

        // 删除收藏记录
        const { error: favError } = await supabase
          .from("user_favorites")
          .delete()
          .eq("task_id", taskId);

        if (favError) throw favError;

        // 删除任务定义
        const { error: taskError } = await supabase
          .from("video_generation_task_definitions")
          .delete()
          .eq("id", taskId);

        if (taskError) throw taskError;

        // 更新本地状态
        setCreations((prevCreations) =>
          prevCreations.filter(
            (creation) => creation.id !== selectedCreation.id,
          ),
        );

        setDeleteDialogOpen(false);
      } catch (error) {
        console.error("删除创作失败:", error);
        alert("删除创作失败，请稍后再试");
      }
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

  const handlePreview = (creation: UserCreation) => {
    setSelectedCreation(creation);
    setPreviewDialogOpen(true);
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
                      <div
                        className="relative aspect-video cursor-pointer"
                        onClick={() => handlePreview(creation)}
                      >
                        <Image
                          src={creation.thumbnailUrl}
                          alt={creation.title}
                          className="h-full w-full object-cover"
                          width={400}
                          height={225}
                        />
                        <div className="absolute bottom-2 right-2 flex space-x-1">
                          {creation.status === "processing" && (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              <Loader2 className="h-3 w-3 animate-spin" />
                              生成中
                            </Badge>
                          )}
                          {creation.status === "failed" && (
                            <Badge variant="destructive">生成失败</Badge>
                          )}
                          {creation.type === "video" && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500 text-white"
                            >
                              视频
                            </Badge>
                          )}
                          {creation.type === "image" && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500 text-white"
                            >
                              图像
                            </Badge>
                          )}
                        </div>
                        {creation.status === "completed" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(creation);
                          }}
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
                          <h3 className="font-medium line-clamp-1">
                            {creation.title}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="-mr-2"
                              >
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
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRename(creation);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                重命名
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(creation);
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                下载
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePublish(creation);
                                }}
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                发布
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(creation);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {creation.prompt || creation.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          创建于{" "}
                          {new Date(creation.createdAt).toLocaleDateString(
                            "zh-CN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
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
            <span className="font-medium">
              {" "}
              &ldquo;{selectedCreation?.title}&rdquo;{" "}
            </span>
            吗？ 此操作无法撤消。
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

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedCreation?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedCreation?.type === "video" ? (
              <video
                src={selectedCreation.url}
                controls
                className="w-full rounded-lg"
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={selectedCreation?.thumbnailUrl || ""}
                alt={selectedCreation?.title || ""}
                width={800}
                height={450}
                className="w-full rounded-lg"
              />
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedCreation?.prompt}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              创建于{" "}
              {selectedCreation?.createdAt
                ? new Date(selectedCreation.createdAt).toLocaleDateString(
                    "zh-CN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )
                : ""}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
            {selectedCreation?.status === "completed" && (
              <Button asChild>
                <a href={selectedCreation.url} download>
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCreationsPage;
