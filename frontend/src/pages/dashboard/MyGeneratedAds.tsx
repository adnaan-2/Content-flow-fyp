import { useState, useEffect } from "react";
import { Trash2, Download, Eye, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { adService } from "@/services/api";

const MyGeneratedAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAd, setSelectedAd] = useState(null);

  useEffect(() => {
    loadAds();
  }, [currentPage]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await adService.getMyAds(currentPage, 12);
      setAds(response.data.ads);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Error loading ads:", err);
      setError("Failed to load generated ads");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adId) => {
    if (!confirm("Are you sure you want to delete this generated ad?")) return;

    try {
      await adService.deleteAd(adId);
      setAds(ads.filter(ad => ad._id !== adId));
      
      // If current page becomes empty and not the first page, go to previous page
      if (ads.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        loadAds(); // Reload to update pagination
      }
    } catch (err) {
      console.error("Error deleting ad:", err);
      setError("Failed to delete ad");
    }
  };

  const handleDownload = async (ad) => {
    try {
      const response = await fetch(ad.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-ad-${ad._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading ad:", err);
      setError("Failed to download ad");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your generated ads...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Generated Ads</CardTitle>
          <CardDescription>
            {pagination?.totalAds ? 
              `${pagination.totalAds} generated ad${pagination.totalAds !== 1 ? 's' : ''}` : 
              'Your AI-generated marketing materials'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No generated ads yet</h3>
              <p className="text-muted-foreground">
                Create your first AI-generated ad using the "Generate Ads" feature
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[600px] w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-4">
                  {ads.map((ad) => (
                    <Card key={ad._id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-3">
                        <div className="relative aspect-square mb-3">
                          <img
                            src={ad.url}
                            alt={ad.prompt}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => setSelectedAd(ad)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Generated Ad Preview</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <img
                                      src={ad.url}
                                      alt={ad.prompt}
                                      className="w-full max-h-[70vh] object-contain rounded-lg"
                                    />
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Prompt:</strong> {ad.prompt}
                                      </div>
                                      <div>
                                        <strong>Style:</strong> {ad.style}
                                      </div>
                                      <div>
                                        <strong>Dimensions:</strong> {ad.dimensions.width}×{ad.dimensions.height}
                                      </div>
                                      <div>
                                        <strong>Created:</strong> {formatDate(ad.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleDownload(ad)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDelete(ad._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium line-clamp-2">{ad.prompt}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="capitalize">{ad.style}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(ad.createdAt)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ad.dimensions.width}×{ad.dimensions.height}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasPrev}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyGeneratedAds;
