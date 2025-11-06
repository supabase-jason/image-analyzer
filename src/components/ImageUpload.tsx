import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ImageUpload = ({ onComplete, onCancel }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      try {
        setUploading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Upload to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        setUploading(false);
        setProcessing(true);

        toast({
          title: "Upload successful!",
          description: "AI is analyzing your image...",
        });

        // Poll for metadata (inserted by edge function)
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        
        const checkMetadata = async () => {
          const { data } = await supabase
            .from("images")
            .select("*")
            .eq("file_path", filePath)
            .maybeSingle();

          if (data) {
            setProcessing(false);
            toast({
              title: "Analysis complete!",
              description: "Your image has been processed with AI.",
            });
            onComplete();
            return true;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            setProcessing(false);
            toast({
              title: "Processing timeout",
              description: "Image uploaded but processing is taking longer than expected. Check back soon!",
              variant: "destructive",
            });
            onComplete();
            return true;
          }

          return false;
        };

        const pollInterval = setInterval(async () => {
          const done = await checkMetadata();
          if (done) clearInterval(pollInterval);
        }, 1000);

      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setUploading(false);
        setProcessing(false);
      }
    },
    [onComplete, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading || processing,
  });

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Upload Image</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={uploading || processing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${uploading || processing ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-lg font-medium">Uploading...</p>
          </div>
        ) : processing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-glow">
              <Upload className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">AI is analyzing your image</p>
              <p className="text-sm text-muted-foreground">
                Generating description, extracting colors, and creating embeddings...
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-primary" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive ? "Drop image here" : "Drag & drop an image"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ImageUpload;
