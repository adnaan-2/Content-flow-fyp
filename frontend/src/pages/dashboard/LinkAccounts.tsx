
// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { CheckCircle, Plus, ExternalLink, RefreshCcw, Loader2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// // Platform types
// type SocialPlatform = {
//   id: string;
//   name: string;
//   icon: string;
//   color: string;
//   connected: boolean;
//   accountName?: string;
//   followers?: number;
// };

// type FacebookConnectionStatus = {
//   isConnected: boolean;
//   userId?: string;
//   name?: string;
// };

// type FacebookPage = {
//   id: string;
//   name: string;
// };

// type InstagramAccount = {
//   instagram_account_id: string;
//   username: string;
//   followers_count: number;
//   media_count: number;
//   name: string;
//   bio: string;
// };

// const LinkAccounts = () => {
//   const { toast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [facebookStatus, setFacebookStatus] = useState<FacebookConnectionStatus>({ isConnected: false });
//   const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
//   const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);

//   const [platforms, setPlatforms] = useState<SocialPlatform[]>([
//     {
//       id: "facebook",
//       name: "Facebook",
//       icon: "F",
//       color: "#4267B2",
//       connected: false
//     },
//     {
//       id: "instagram",
//       name: "Instagram",
//       icon: "I",
//       color: "#E1306C",
//       connected: false
//     },
//     {
//       id: "twitter",
//       name: "Twitter",
//       icon: "T",
//       color: "#1DA1F2",
//       connected: false
//     },
//     {
//       id: "tiktok",
//       name: "TikTok",
//       icon: "T",
//       color: "#000000",
//       connected: false
//     },
//     {
//       id: "linkedin",
//       name: "LinkedIn",
//       icon: "L",
//       color: "#0077B5",
//       connected: false
//     },
//     {
//       id: "pinterest",
//       name: "Pinterest",
//       icon: "P",
//       color: "#E60023",
//       connected: false
//     }
//   ]);

//   // Check connection status on component mount
//   useEffect(() => {
//     checkConnectionStatus();
//   }, []);

//   const checkConnectionStatus = async () => {
//     try {
//       setRefreshing(true);
//       const response = await fetch('/api/social/check-connection', {
//         credentials: 'include'
//       });
//       const data = await response.json();
      
//       setFacebookStatus(data);
      
//       if (data.isConnected) {
//         // Update Facebook platform status
//         setPlatforms(prev => prev.map(platform => 
//           platform.id === 'facebook' 
//             ? { ...platform, connected: true, accountName: data.name }
//             : platform
//         ));
        
//         // Fetch Facebook pages and Instagram accounts
//         await Promise.all([
//           fetchFacebookPages(),
//           fetchInstagramAccounts()
//         ]);
//       } else {
//         // Reset connection status
//         setPlatforms(prev => prev.map(platform => 
//           ['facebook', 'instagram'].includes(platform.id)
//             ? { ...platform, connected: false, accountName: undefined, followers: undefined }
//             : platform
//         ));
//         setFacebookPages([]);
//         setInstagramAccounts([]);
//       }
//     } catch (error) {
//       console.error('Error checking connection status:', error);
//       toast({
//         title: "Connection Check Failed",
//         description: "Unable to verify social media connections",
//         variant: "destructive"
//       });
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const fetchFacebookPages = async () => {
//     try {
//       const response = await fetch('/api/social/pages', {
//         credentials: 'include'
//       });
//       if (response.ok) {
//         const pages = await response.json();
//         setFacebookPages(pages);
        
//         // Update platform with page count
//         if (pages.length > 0) {
//           setPlatforms(prev => prev.map(platform => 
//             platform.id === 'facebook' 
//               ? { 
//                   ...platform, 
//                   connected: true, 
//                   accountName: `${pages.length} Page${pages.length > 1 ? 's' : ''} Connected`
//                 }
//               : platform
//           ));
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching Facebook pages:', error);
//     }
//   };

//   const fetchInstagramAccounts = async () => {
//     try {
//       const response = await fetch('/api/social/instagram-accounts', {
//         credentials: 'include'
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setInstagramAccounts(data.instagramDetails || []);
        
//         // Update Instagram platform status
//         if (data.instagramDetails && data.instagramDetails.length > 0) {
//           const totalFollowers = data.instagramDetails.reduce((sum: number, account: InstagramAccount) => 
//             sum + (account.followers_count || 0), 0
//           );
          
//           setPlatforms(prev => prev.map(platform => 
//             platform.id === 'instagram' 
//               ? { 
//                   ...platform, 
//                   connected: true, 
//                   accountName: `@${data.instagramDetails[0].username}`,
//                   followers: totalFollowers
//                 }
//               : platform
//           ));
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching Instagram accounts:', error);
//     }
//   };

//   const handleFacebookConnect = async () => {
//     setLoading(true);
//     try {
//       // Redirect to Facebook OAuth
//       window.location.href = '/api/social/auth';
//     } catch (error) {
//       console.error('Error connecting to Facebook:', error);
//       toast({
//         title: "Connection Failed",
//         description: "Unable to connect to Facebook. Please try again.",
//         variant: "destructive"
//       });
//       setLoading(false);
//     }
//   };

//   const handleDisconnect = async (platformId: string) => {
//     if (platformId === 'facebook' || platformId === 'instagram') {
//       try {
//         // Clear session on backend (you might want to add an endpoint for this)
//         const response = await fetch('/api/social/disconnect', {
//           method: 'POST',
//           credentials: 'include'
//         });
        
//         if (response.ok) {
//           setFacebookStatus({ isConnected: false });
//           setFacebookPages([]);
//           setInstagramAccounts([]);
          
//           setPlatforms(prev => prev.map(platform => 
//             ['facebook', 'instagram'].includes(platform.id)
//               ? { ...platform, connected: false, accountName: undefined, followers: undefined }
//               : platform
//           ));
          
//           toast({
//             title: "Disconnected Successfully",
//             description: `${platformId === 'facebook' ? 'Facebook' : 'Instagram'} account has been disconnected`,
//           });
//         }
//       } catch (error) {
//         console.error('Error disconnecting:', error);
//         toast({
//           title: "Disconnection Failed",
//           description: "Unable to disconnect account. Please try again.",
//           variant: "destructive"
//         });
//       }
//     } else {
//       // Mock disconnect for other platforms
//       setPlatforms(platforms.map(platform => 
//         platform.id === platformId 
//           ? { ...platform, connected: false, accountName: undefined, followers: undefined }
//           : platform
//       ));
//     }
//   };

//   const handleConnect = async (platformId: string) => {
//     if (platformId === 'facebook') {
//       await handleFacebookConnect();
//     } else if (platformId === 'instagram') {
//       // Instagram connects through Facebook
//       if (facebookStatus.isConnected) {
//         await fetchInstagramAccounts();
//       } else {
//         toast({
//           title: "Facebook Required",
//           description: "Please connect Facebook first to access Instagram",
//           variant: "destructive"
//         });
//       }
//     } else {
//       // Mock connect for other platforms
//       let connectedPlatformName = "";
//       setPlatforms(platforms.map(platform => {
//         if (platform.id === platformId) {
//           connectedPlatformName = platform.name;
//           return {
//             ...platform,
//             connected: true,
//             accountName: platform.id === "twitter" ? "@socialfuse" : "SocialFuse Account",
//             followers: Math.floor(Math.random() * 50000)
//           };
//         }
//         return platform;
//       }));
      
//       toast({
//         title: "Connected Successfully",
//         description: `${connectedPlatformName} account has been connected`,
//       });
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight">Link Accounts</h1>
//           <p className="text-muted-foreground">
//             Connect your social media accounts to manage them all in one place.
//           </p>
//         </div>
//         <Button 
//           variant="outline" 
//           size="sm" 
//           className="flex items-center gap-2"
//           onClick={checkConnectionStatus}
//           disabled={refreshing}
//         >
//           {refreshing ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <RefreshCcw className="h-4 w-4" />
//           )}
//           <span>Refresh Connections</span>
//         </Button>
//       </div>

//       {/* Connection Status Info */}
//       {facebookStatus.isConnected && (
//         <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
//           <div className="flex items-center gap-2">
//             <CheckCircle className="h-5 w-5 text-green-600" />
//             <span className="text-green-800 dark:text-green-200 font-medium">
//               Connected to Facebook as {facebookStatus.name}
//             </span>
//           </div>
//           <div className="mt-2 text-sm text-green-700 dark:text-green-300">
//             {facebookPages.length > 0 && (
//               <span>{facebookPages.length} Facebook page(s) • </span>
//             )}
//             {instagramAccounts.length > 0 && (
//               <span>{instagramAccounts.length} Instagram account(s)</span>
//             )}
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {platforms.map((platform) => (
//           <Card key={platform.id} className="overflow-hidden">
//             <CardHeader className="pb-3">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div 
//                     className="h-10 w-10 rounded-full flex items-center justify-center"
//                     style={{ backgroundColor: `${platform.color}20` }}
//                   >
//                     <span style={{ color: platform.color }} className="text-xl font-bold">
//                       {platform.icon}
//                     </span>
//                   </div>
//                   <div>
//                     <CardTitle>{platform.name}</CardTitle>
//                     {platform.connected && platform.accountName && (
//                       <CardDescription>{platform.accountName}</CardDescription>
//                     )}
//                   </div>
//                 </div>
//                 {platform.connected && (
//                   <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
//                     <CheckCircle className="h-3 w-3 mr-1" /> Connected
//                   </Badge>
//                 )}
//               </div>
//             </CardHeader>
//             <CardContent>
//               {platform.connected ? (
//                 <div className="py-2">
//                   {platform.followers && (
//                     <div className="flex justify-between items-center mb-2">
//                       <span className="text-sm text-muted-foreground">Followers</span>
//                       <span className="font-medium">{platform.followers?.toLocaleString()}</span>
//                     </div>
//                   )}
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm text-muted-foreground">Status</span>
//                     <span className="text-sm text-green-500">Active</span>
//                   </div>
                  
//                   {/* Show connected pages/accounts details */}
//                   {platform.id === 'facebook' && facebookPages.length > 0 && (
//                     <div className="mt-3 pt-3 border-t">
//                       <span className="text-xs text-muted-foreground">Connected Pages:</span>
//                       <div className="mt-1 space-y-1">
//                         {facebookPages.slice(0, 2).map((page) => (
//                           <div key={page.id} className="text-xs text-foreground">
//                             • {page.name}
//                           </div>
//                         ))}
//                         {facebookPages.length > 2 && (
//                           <div className="text-xs text-muted-foreground">
//                             +{facebookPages.length - 2} more
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
                  
//                   {platform.id === 'instagram' && instagramAccounts.length > 0 && (
//                     <div className="mt-3 pt-3 border-t">
//                       <span className="text-xs text-muted-foreground">Connected Accounts:</span>
//                       <div className="mt-1 space-y-1">
//                         {instagramAccounts.slice(0, 2).map((account) => (
//                           <div key={account.instagram_account_id} className="text-xs text-foreground">
//                             • @{account.username} ({account.followers_count?.toLocaleString()} followers)
//                           </div>
//                         ))}
//                         {instagramAccounts.length > 2 && (
//                           <div className="text-xs text-muted-foreground">
//                             +{instagramAccounts.length - 2} more
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="py-6 flex flex-col items-center justify-center text-center">
//                   <p className="text-sm text-muted-foreground mb-2">
//                     Connect your {platform.name} account to start managing your content
//                   </p>
//                   {platform.id === 'instagram' && !facebookStatus.isConnected && (
//                     <p className="text-xs text-amber-600 dark:text-amber-400">
//                       Requires Facebook connection first
//                     </p>
//                   )}
//                 </div>
//               )}
//             </CardContent>
//             <CardFooter className="border-t bg-muted/50 flex justify-between items-center">
//               {platform.connected ? (
//                 <>
//                   <Button variant="ghost" size="sm" className="text-muted-foreground">
//                     <ExternalLink className="h-4 w-4 mr-1" /> View Profile
//                   </Button>
//                   <Button 
//                     variant="ghost" 
//                     size="sm" 
//                     className="text-destructive hover:text-destructive/90"
//                     onClick={() => handleDisconnect(platform.id)}
//                   >
//                     Disconnect
//                   </Button>
//                 </>
//               ) : (
//                 <Button 
//                   className="w-full" 
//                   onClick={() => handleConnect(platform.id)}
//                   disabled={loading || (platform.id === 'instagram' && !facebookStatus.isConnected)}
//                 >
//                   {loading && platform.id === 'facebook' ? (
//                     <Loader2 className="h-4 w-4 mr-1 animate-spin" />
//                   ) : (
//                     <Plus className="h-4 w-4 mr-1" />
//                   )}
//                   Connect {platform.name}
//                 </Button>
//               )}
//             </CardFooter>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default LinkAccounts;
import React from 'react'

export default function LinkAccounts() {
  return (
    <div>
      <h1>Link accounts</h1>
    </div>
  )
}
