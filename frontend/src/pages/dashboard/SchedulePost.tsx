import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Filter, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

// Platform icons (simplified for this example)
const platformIcons = {
  facebook: "fab fa-facebook",
  instagram: "fab fa-instagram",
  twitter: "fab fa-twitter",
  linkedin: "fab fa-linkedin",
};

const platformColors = {
  facebook: "bg-blue-100 text-blue-800",
  instagram: "bg-pink-100 text-pink-800",
  twitter: "bg-sky-100 text-sky-800",
  linkedin: "bg-blue-100 text-blue-800",
};

interface ScheduledPost {
  id: string;
  content: string;
  date: Date;
  platform: string;
  media?: string;
}

const SchedulePosts = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [newPost, setNewPost] = useState({
    content: "",
    platform: "",
    date: new Date(),
    time: "12:00",
    media: "",
  });
  const { toast } = useToast();

  // Dummy data for demonstration
  useEffect(() => {
    // This would be replaced with an API call to fetch posts
    const dummyPosts: ScheduledPost[] = [
      {
        id: "1",
        content: "Check out our new product launch!",
        date: new Date(2023, 8, 15, 10, 0),
        platform: "facebook",
      },
      {
        id: "2",
        content: "Join our webinar on digital marketing",
        date: new Date(2023, 8, 17, 14, 30),
        platform: "instagram",
      },
      {
        id: "3",
        content: "New blog post: 10 tips for content creation",
        date: new Date(2023, 8, 20, 9, 0),
        platform: "twitter",
      },
      {
        id: "4",
        content: "We're hiring! Join our team",
        date: new Date(2023, 8, 22, 11, 0),
        platform: "linkedin",
      },
    ];
    setScheduledPosts(dummyPosts);
  }, []);

  // Get posts for selected date
  const getPostsForSelectedDate = () => {
    if (!selectedDate) return [];
    
    let filteredPosts = scheduledPosts.filter(post => 
      post.date.getDate() === selectedDate.getDate() &&
      post.date.getMonth() === selectedDate.getMonth() &&
      post.date.getFullYear() === selectedDate.getFullYear()
    );
    
    // Apply platform filter if not "all"
    if (selectedPlatform !== "all") {
      filteredPosts = filteredPosts.filter(post => post.platform === selectedPlatform);
    }
    
    return filteredPosts;
  };

  // Handle scheduling a new post
  const handleSchedulePost = async () => {
    // Combine date and time
    const [hours, minutes] = newPost.time.split(':').map(Number);
    const scheduledDateTime = new Date(newPost.date);
    scheduledDateTime.setHours(hours, minutes);
    
    const post: ScheduledPost = {
      id: Date.now().toString(), // In real app, this would come from backend
      content: newPost.content,
      date: scheduledDateTime,
      platform: newPost.platform,
      media: newPost.media || undefined,
    };
    
    // In a real app, this would be an API call
    try {
      // const response = await axios.post('/api/schedule', post);
      // Add the new post to the list
      setScheduledPosts([...scheduledPosts, post]);
      
      toast({
        title: "Post scheduled",
        description: `Your post has been scheduled for ${format(scheduledDateTime, 'PPp')}`,
      });
      
      // Reset form and close dialog
      setNewPost({
        content: "",
        platform: "",
        date: new Date(),
        time: "12:00",
        media: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule post",
        variant: "destructive",
      });
    }
  };

  // Get dates with posts for highlighting in calendar
  const getDatesWithPosts = () => {
    let dates: Date[] = [];
    let filteredPosts = scheduledPosts;
    
    if (selectedPlatform !== "all") {
      filteredPosts = scheduledPosts.filter(post => post.platform === selectedPlatform);
    }
    
    filteredPosts.forEach(post => {
      dates.push(post.date);
    });
    
    return dates;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Posts</h1>
          <p className="text-muted-foreground">
            Plan and schedule your content across platforms
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Post
        </Button>
      </div>
      
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar and Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Select a date to view scheduled posts</CardDescription>
            
            <div className="mt-2">
              <Label htmlFor="platform-filter">Filter by platform</Label>
              <Select 
                value={selectedPlatform} 
                onValueChange={setSelectedPlatform}
              >
                <SelectTrigger id="platform-filter" className="mt-1">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                booked: getDatesWithPosts(),
              }}
              modifiersStyles={{
                booked: { fontWeight: 'bold', textDecoration: 'underline' },
              }}
            />
          </CardContent>
        </Card>
        
        {/* Posts for selected date */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Posts for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
            </CardTitle>
            <CardDescription>
              {getPostsForSelectedDate().length} posts scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getPostsForSelectedDate().length > 0 ? (
              <div className="space-y-4">
                {getPostsForSelectedDate().map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-0">
                      <div className="flex justify-between items-center">
                        <Badge className={platformColors[post.platform as keyof typeof platformColors]}>
                          <i className={platformIcons[post.platform as keyof typeof platformIcons] + " mr-1"}></i>
                          {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {format(post.date, 'h:mm a')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p>{post.content}</p>
                      {post.media && (
                        <img 
                          src={post.media} 
                          alt="Post media" 
                          className="mt-2 rounded-md max-h-40 object-cover" 
                        />
                      )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p>No posts scheduled for this date.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Schedule Post
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Schedule Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Post</DialogTitle>
            <DialogDescription>
              Create a new post and schedule it for publishing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform</Label>
              <Select 
                value={newPost.platform} 
                onValueChange={(value) => setNewPost({...newPost, platform: value})}
              >
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your post content..."
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="media">Media URL (optional)</Label>
              <Input
                id="media"
                type="text"
                placeholder="Enter media URL"
                value={newPost.media}
                onChange={(e) => setNewPost({...newPost, media: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPost.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newPost.date ? format(newPost.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newPost.date}
                    onSelect={(date) => date && setNewPost({...newPost, date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={newPost.time}
                  onChange={(e) => setNewPost({...newPost, time: e.target.value})}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSchedulePost}>Schedule Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePosts;