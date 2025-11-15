import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Coins, Heart, Zap, TrendingUp, Award, Image as ImageIcon, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Profile {
  id: string;
  name: string;
  level: number;
  exp: number;
  hp: number;
  gold_earned: number;
  gold_spent: number;
  streak: number;
  progress_percentage: number;
  current_pfp_url: string | null;
  banner_url?: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState<any[]>([]);
  const [editName, setEditName] = useState("");
  const [editGoldEarned, setEditGoldEarned] = useState(0);
  const [editGoldSpent, setEditGoldSpent] = useState(0);
  const [newPfpFile, setNewPfpFile] = useState<File | null>(null);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);
  const [editingBadge, setEditingBadge] = useState<string | null>(null);
  const [badgeImageFile, setBadgeImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchEarnedBadges();
    fetchPurchasedItems();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
      setEditName(data.name);
      setEditGoldEarned(data.gold_earned);
      setEditGoldSpent(data.gold_spent);
    }
    setLoading(false);
  };

  const fetchPurchasedItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("shop_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "shop")
      .eq("purchased", true)
      .order("purchased_at", { ascending: false });
    if (data) setPurchasedItems(data);
  };

  const fetchEarnedBadges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id)
      .limit(3);

    if (!error && data) {
      setEarnedBadges(data);
    }
  };

  const uploadProfileImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/pfp/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hunter-assets")
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("hunter-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const uploadBannerImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/banner/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("hunter-assets")
      .upload(filePath, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("hunter-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      let uploadedUrl: string | null = null;
      let uploadedBannerUrl: string | null = null;
      if (newPfpFile) {
        uploadedUrl = await uploadProfileImage(newPfpFile);
      }
      if (newBannerFile) {
        uploadedBannerUrl = await uploadBannerImage(newBannerFile);
      }

      const { error } = await supabase
      .from("profiles")
      .update({
        name: editName,
        gold_earned: editGoldEarned,
        gold_spent: editGoldSpent,
        current_pfp_url: uploadedUrl ?? profile.current_pfp_url,
        banner_url: uploadedBannerUrl ?? profile.banner_url ?? null,
      })
      .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: uploadedUrl || uploadedBannerUrl ? "Images and stats updated." : "Your stats have been updated.",
        });
        setNewPfpFile(null);
        setNewBannerFile(null);
        fetchProfile();
        fetchPurchasedItems();
      }
    } catch (e: any) {
      toast({
        title: "Image Upload Failed",
        description: e.message ?? "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePfpQuickChange = async (file: File | null) => {
    if (!file || !user || !profile) return;
    try {
      setSaving(true);
      const url = await uploadProfileImage(file);
      const { error } = await supabase
        .from("profiles")
        .update({ current_pfp_url: url })
        .eq("user_id", user.id);
      if (error) {
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Profile Picture Updated" });
        fetchProfile();
      }
    } catch (e: any) {
      toast({
        title: "Image Upload Failed",
        description: e.message ?? "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadBadgeImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/badges/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hunter-assets")
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("hunter-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const updateBadgeImage = async (badgeId: string) => {
    if (!badgeImageFile || !user) return;

    try {
      setSaving(true);
      const imageUrl = await uploadBadgeImage(badgeImageFile);

      const { error } = await supabase
        .from("badges")
        .update({ image_url: imageUrl })
        .eq("id", badgeId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Badge Image Updated" });
        setEditingBadge(null);
        setBadgeImageFile(null);
        fetchEarnedBadges();
      }
    } catch (e: any) {
      toast({
        title: "Image Upload Failed",
        description: e.message ?? "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading hunter data...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center space-y-4">
          <p className="text-muted-foreground">No profile found for your account.</p>
          <Button
            onClick={async () => {
              if (!user) return;
              const fallbackName =
                (user.user_metadata as any)?.name ||
                user.email?.split("@")[0] ||
                "Hunter";
              const { error } = await supabase.from("profiles").insert({
                user_id: user.id,
                name: fallbackName,
              } as any);
              if (error) {
                toast({
                  title: "Could not create profile",
                  description: error.message,
                  variant: "destructive",
                });
              } else {
                toast({ title: "Profile created", description: "Welcome!" });
                fetchProfile();
              }
            }}
          >
            Create Profile
          </Button>
        </Card>
      </div>
    );
  }

  const expNeeded = profile.level * 100;
  const expProgress = (profile.exp / expNeeded) * 100;
  const goldTotal = profile.gold_earned - profile.gold_spent;
  const getRank = (level: number) => {
    if (level >= 150) return "S";
    if (level >= 100) return "A";
    if (level >= 60) return "B";
    if (level >= 30) return "C";
    if (level >= 10) return "D";
    return "E";
  };
  const rank = getRank(profile.level);
  const rankClass = (() => {
    switch (rank) {
      case "S": return "shadow-[0_0_25px_rgba(255,255,255,0.5)]"; // white
      case "A": return "shadow-[0_0_25px_rgba(59,130,246,0.5)]";  // blue
      case "B": return "shadow-[0_0_25px_rgba(234,179,8,0.5)]";   // yellow
      case "C": return "shadow-[0_0_25px_rgba(34,197,94,0.5)]";   // green
      case "D": return "shadow-[0_0_25px_rgba(236,72,153,0.5)]";  // pink
      case "E": return "shadow-[0_0_25px_rgba(168,85,247,0.5)]";  // purple
      default: return "";
    }
  })();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      {profile.banner_url && (
        <div className="rounded-xl overflow-hidden bg-muted border border-border">
          <img src={profile.banner_url} alt="Banner" className="w-full h-48 object-cover" />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold glow-text mb-2">Hunter Profile</h1>
        <p className="text-muted-foreground">Your path to greatness</p>
      </div>

      {/* Main Profile Card */}
      <Card className={`p-6 border-primary/20 ${rankClass}`}>
        <div className="flex items-start gap-6">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-primary">
              <AvatarImage src={profile.current_pfp_url || undefined} />
              <AvatarFallback className="text-4xl">{profile.name[0]}</AvatarFallback>
            </Avatar>
            <input
              id="pfp-quick"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePfpQuickChange(e.target.files?.[0] || null)}
            />
            <label
              htmlFor="pfp-quick"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full flex items-center justify-center text-white text-sm"
              style={{ borderRadius: '9999px' }}
              title="Change profile picture"
            >
              Change
            </label>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <h2 className="text-3xl font-bold cursor-pointer hover:text-primary transition-colors">
                      {profile.name}
                    </h2>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goldEarned">Gold Earned</Label>
                        <Input
                          id="goldEarned"
                          type="number"
                          value={editGoldEarned}
                          onChange={(e) => setEditGoldEarned(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goldSpent">Gold Spent</Label>
                        <Input
                          id="goldSpent"
                          type="number"
                          value={editGoldSpent}
                          onChange={(e) => setEditGoldSpent(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pfp">Profile Picture</Label>
                        <Input
                          id="pfp"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewPfpFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner">Banner Image</Label>
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewBannerFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button onClick={updateProfile} className="w-full" disabled={saving}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-muted-foreground">{rank}-Rank Hunter</p>
              </div>
              <Badge className="text-2xl px-6 py-2 bg-primary/20 text-primary border-primary/30">
                {rank}-RANK • LVL {profile.level}
              </Badge>
            </div>

            {/* EXP Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-exp" />
                  EXP
                </span>
                <span className="text-muted-foreground">
                  {profile.exp} / {expNeeded}
                </span>
              </div>
              <Progress value={expProgress} className="h-3 bg-muted" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Heart className="h-6 w-6 mx-auto mb-1 text-hp" />
                <p className="text-2xl font-bold">{profile.hp}</p>
                <p className="text-xs text-muted-foreground">HP</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Coins className="h-6 w-6 mx-auto mb-1 text-gold" />
                <p className="text-2xl font-bold">{goldTotal}</p>
                <p className="text-xs text-muted-foreground">Gold</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Flame className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{profile.streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>

              <div className="text-center p-3 rounded-lg bg-muted/50">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-secondary" />
                <p className="text-2xl font-bold">{profile.progress_percentage.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Progress</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Purchased Items */}
      <Card className="p-6 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Purchased Items</h3>
        </div>
        {purchasedItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No purchases yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedItems.map((item) => (
              <Card key={item.id} className="p-4 flex items-center gap-4">
                {item.image_url && (
                  <img src={item.image_url} className="h-16 w-16 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Purchased {item.purchased_at ? new Date(item.purchased_at).toLocaleString() : ""}
                  </p>
                </div>
                <span className="text-gold font-semibold flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {item.price}
                </span>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Badges */}
      <Card className="p-6 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">Recent Badges</h3>
        </div>
        {earnedBadges.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Complete quests to earn badges!
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {earnedBadges.map((badge) => (
              <div
                key={badge.id}
                className="relative group p-4 rounded-lg bg-muted/30 text-center hover:bg-muted/50 transition-colors"
              >
                <div className="relative inline-flex items-center justify-center mx-auto mb-2">
                  {badge.badges.image_url && (
                    <img
                      src={badge.badges.image_url}
                      alt={badge.badges.name}
                      className="h-16 w-16 rounded-full"
                    />
                  )}
                  {/* Hover overlay for editing */}
                  <div className="absolute inset-0 h-16 w-16 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBadge(badge.badges.id);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Badge Image</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex justify-center">
                            {badge.badges.image_url && (
                              <img
                                src={badge.badges.image_url}
                                alt={badge.badges.name}
                                className="h-32 w-32 rounded-full object-cover"
                              />
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`badge-image-${badge.id}`}>New Badge Image</Label>
                            <Input
                              id={`badge-image-${badge.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => setBadgeImageFile(e.target.files?.[0] || null)}
                            />
                          </div>
                          <Button
                            onClick={() => updateBadgeImage(badge.badges.id)}
                            className="w-full"
                            disabled={!badgeImageFile || saving}
                          >
                            {saving ? "Uploading..." : "Update Image"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <p className="font-semibold">{badge.badges.name}</p>
                <p className="text-xs text-muted-foreground">{badge.badges.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
