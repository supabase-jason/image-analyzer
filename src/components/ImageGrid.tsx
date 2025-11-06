import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Image = Database["public"]["Tables"]["images"]["Row"];

interface ImageGridProps {
  images: Image[];
}

const ImageGrid = ({ images }: ImageGridProps) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const getImageUrl = async (filePath: string) => {
    if (imageUrls[filePath]) return imageUrls[filePath];

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    setImageUrls((prev) => ({ ...prev, [filePath]: data.publicUrl }));
    return data.publicUrl;
  };

  const ImageCard = ({ image }: { image: Image }) => {
    const [url, setUrl] = useState<string>("");

    useState(() => {
      getImageUrl(image.file_path).then(setUrl);
    });

    return (
      <Card
        className="cursor-pointer group hover:shadow-glow transition-smooth overflow-hidden animate-fade-in"
        onClick={() => setSelectedImage(image)}
      >
        <div className="aspect-square overflow-hidden bg-muted">
          {url ? (
            <img
              src={url}
              alt={image.description || image.file_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium line-clamp-1">
            {image.file_name}
          </CardTitle>
          {image.description && (
            <CardDescription className="text-xs line-clamp-2">
              {image.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedImage.file_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <img
                    src={imageUrls[selectedImage.file_path]}
                    alt={selectedImage.description || selectedImage.file_name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {selectedImage.description && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">AI Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedImage.description}
                    </p>
                  </div>
                )}

                {selectedImage.color_palette && Array.isArray(selectedImage.color_palette) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Color Palette</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.color_palette.map((color: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="px-3 py-1"
                          style={{
                            backgroundColor: color,
                            color: getContrastColor(color),
                          }}
                        >
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Uploaded: {new Date(selectedImage.created_at).toLocaleDateString()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Utility function to determine contrasting text color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

export default ImageGrid;
