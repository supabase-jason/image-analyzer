import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, Brain, Palette } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <div className="gradient-hero min-h-screen flex items-center justify-center p-4">
        <div className="container max-w-6xl">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10 animate-glow">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Image Analyzer
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Upload your images and let AI automatically generate rich descriptions, 
              extract color palettes, and create semantic embeddings.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="gradient-primary hover:opacity-90 transition-smooth text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
                <Upload className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your images for instant processing
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
                <Brain className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Automatic descriptions and semantic understanding
                </p>
              </div>

              <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border">
                <Palette className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-2">Color Extraction</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent color palette generation from your images
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
