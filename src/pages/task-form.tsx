import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import {
  useGetTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getGetTaskQueryKey,
  getGetUserProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { scheduleTask, cancelTask } from "@/lib/notifications";
import { useUpload } from "@workspace/object-storage-web";
import { usePlan } from "@/hooks/use-plan";

const SHARED_MEDIA_CACHE = "taskmyscreen-shared-media-v1";
const SHARED_IMAGE_KEY = "pending-share-image";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueAtDate: z.date({ error: "Please pick a date" }),
  dueAtTime: z.string().min(1, "Please set a time"),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Compresses an image to max 1200px on longest side, JPEG 82% quality.
 * Used for free-tier users to reduce storage costs.
 */
async function compressImage(file: File): Promise<File> {
  const MAX_DIMENSION = 1200;
  const QUALITY = 0.82;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));

      // Already small and JPEG — skip re-encoding
      if (scale >= 1 && file.type === "image/jpeg" && file.size < 500_000) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressedName = file.name.replace(/\.[^/.]+$/, ".jpg");
          resolve(new File([blob], compressedName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        QUALITY,
      );
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

export default function TaskForm() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const search = useSearch();
  const isEditing = !!id && id !== "new";
  const isRescheduling = isEditing && new URLSearchParams(search).get("reschedule") === "1";
  const isShareTarget = new URLSearchParams(search).get("share") === "1";
  // Task ids are backend-generated UUIDs (text primary key), never numeric —
  // do not parseInt() them.
  const taskId = isEditing ? (id as string) : "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scheduleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isPro, plan } = usePlan();

  // Image state — managed outside the form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onError: () => toast({ title: "Image upload failed", variant: "destructive" }),
  });

  const { data: existingTask, isLoading: isTaskLoading } = useGetTask(taskId, {
    query: { enabled: isEditing, queryKey: getGetTaskQueryKey(taskId) }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      dueAtDate: undefined,
      dueAtTime: "12:00",
    },
  });

  // Load shared image from service worker cache when arriving via share target
  useEffect(() => {
    if (!isShareTarget) return;
    (async () => {
      try {
        const cache = await caches.open(SHARED_MEDIA_CACHE);
        const response = await cache.match(SHARED_IMAGE_KEY);
        if (response) {
          const blob = await response.blob();
          const fileName = response.headers.get("X-File-Name") || "screenshot.png";
          const file = new File([blob], fileName, { type: blob.type || "image/png" });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
          await cache.delete(SHARED_IMAGE_KEY);
        }
      } catch {}
    })();
  }, [isShareTarget]);

  // Populate form when editing an existing task
  useEffect(() => {
    if (existingTask) {
      const dueAt = existingTask.dueAt ? new Date(existingTask.dueAt) : undefined;
      form.reset({
        title: existingTask.title,
        description: existingTask.description || "",
        dueAtDate: dueAt,
        dueAtTime: dueAt ? format(dueAt, "HH:mm") : "12:00",
      });
      if (existingTask.imageUrl) {
        setExistingImageUrl(existingTask.imageUrl);
        setImagePreview(existingTask.imageUrl);
      }
    }
  }, [existingTask, form]);

  // Auto-scroll to schedule section when arriving via reschedule
  useEffect(() => {
    if (isRescheduling && scheduleRef.current) {
      setTimeout(() => {
        scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }
  }, [isRescheduling]);

  // Revoke object URL on unmount or preview change
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExistingImageUrl(null);
  }, [imagePreview]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [imagePreview]);

  const createMutation = useCreateTask({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
        if (data.dueAt) {
          scheduleTask({
            taskId: data.id,
            title: data.title,
            body: data.description ?? "Your task is due now.",
            imageUrl: data.imageUrl ?? undefined,
            dueAt: data.dueAt,
            plan,
          });
        }
        toast({ title: "Task created" });
        setLocation("/tasks");
      },
      onError: (error: any) => {
        // 402 = monthly limit reached → redirect to upgrade
        if (error?.status === 402 || error?.response?.status === 402) {
          setLocation("/upgrade");
          return;
        }
        toast({ title: "Failed to create task", variant: "destructive" });
      },
    }
  });

  const updateMutation = useUpdateTask({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        cancelTask(data.id);
        if (data.dueAt) {
          scheduleTask({
            taskId: data.id,
            title: data.title,
            body: data.description ?? "Your task is due now.",
            imageUrl: data.imageUrl ?? undefined,
            dueAt: data.dueAt,
            plan,
          });
        }
        toast({ title: "Task updated" });
        setLocation("/tasks");
      },
      onError: () => toast({ title: "Failed to update task", variant: "destructive" }),
    }
  });

  const deleteMutation = useDeleteTask({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
        cancelTask(taskId);
        toast({ title: "Task deleted" });
        setLocation("/tasks");
      },
      onError: () => toast({ title: "Failed to delete task", variant: "destructive" }),
    }
  });

  const onSubmit = async (values: FormValues) => {
    // Build dueAt string
    const date = new Date(values.dueAtDate);
    if (values.dueAtTime) {
      const [hours, minutes] = values.dueAtTime.split(":");
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }
    const dueAtStr = date.toISOString();

    // Upload image — compress for free users, original for PRO
    let resolvedImageUrl: string | undefined = existingImageUrl || undefined;
    if (imageFile) {
      const fileToUpload = isPro ? imageFile : await compressImage(imageFile);
      const result = await uploadFile(fileToUpload);
      if (result) {
        resolvedImageUrl = `/api/storage${result.objectPath}`;
      }
    }

    const payload = {
      title: values.title,
      description: values.description || undefined,
      dueAt: dueAtStr,
      imageUrl: resolvedImageUrl,
      scheduled: true,
    };

    if (isEditing) {
      updateMutation.mutate({ id: taskId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  if (isEditing && isTaskLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="flex flex-col h-full bg-background"
    >
      <header className="px-4 h-14 flex items-center border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10 justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9 rounded-full" onClick={() => setLocation("/tasks")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">{isEditing ? "Edit Task" : "New Task"}</h1>
        </div>
        {isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-full"
            onClick={() => deleteMutation.mutate({ id: taskId })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24">

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">What needs to be done?</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title..." className="h-14 text-lg border-border/50 bg-card rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details..."
                      className="min-h-[100px] resize-none border-border/50 bg-card rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule — required */}
            <div ref={scheduleRef} className="p-4 rounded-xl border border-border/50 bg-card space-y-4">
              <p className="text-sm font-medium">
                Schedule reminder <span className="text-destructive">*</span>
              </p>
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="dueAtDate"
                  render={({ field }) => (
                    <FormItem className="flex-1 flex flex-col">
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background rounded-lg border-border/50 h-11",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueAtTime"
                  render={({ field }) => (
                    <FormItem className="w-1/3 flex flex-col">
                      <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Time</FormLabel>
                      <FormControl>
                        <Input type="time" className="bg-background rounded-lg border-border/50 h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Image attachment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground uppercase text-xs tracking-wider">Image Attachment (Optional)</p>
                {!isPro && (
                  <span className="text-[10px] text-muted-foreground/60 italic">Compressed on free plan</span>
                )}
              </div>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card">
                  <img
                    src={imagePreview}
                    alt="Attachment preview"
                    className="w-full max-h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 bg-card transition-colors text-muted-foreground hover:text-primary"
                >
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-sm font-medium">Attach a screenshot or photo</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading image{!isPro ? " (compressing...)" : "..."}  </span>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border flex justify-center z-20">
              <div className="w-full max-w-md">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full h-14 text-base font-semibold shadow-lg shadow-primary/20"
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isEditing ? "Save Changes" : "Create Task"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
