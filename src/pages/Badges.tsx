import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Award, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Badge {
  id: string;
  name: string;
  description?: string;
  criteria_type?: string;
  criteria_value?: number;
  image_url?: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

export default function Badges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newBadgeCriteria, setNewBadgeCriteria] = useState("");
  const [newBadgeValue, setNewBadgeValue] = useState(0);
  const [newBadgeImage, setNewBadgeImage] = useState<File | null>(null);

  useEffect(() => {
    fetchBadges();
    fetchEarnedBadges();
  }, [user]);

  const fetchBadges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setAllBadges(data);
    }
    setLoading(false);
  };

  const fetchEarnedBadges = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (!error && data) {
      setEarnedBadges(data as UserBadge[]);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/badges/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hunter-assets")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("hunter-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addBadge = async () => {
    if (!user || !newBadgeName.trim()) return;

    try {
      let imageUrl = null;
      if (newBadgeImage) {
        imageUrl = await uploadImage(newBadgeImage);
      }

      const { error } = await supabase.from("badges").insert({
        user_id: user.id,
        name: newBadgeName,
        description: newBadgeDesc,
        criteria_type: newBadgeCriteria || null,
        criteria_value: newBadgeValue > 0 ? newBadgeValue : null,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({ title: "Badge Created", description: `${newBadgeName} badge added` });
      setNewBadgeName("");
      setNewBadgeDesc("");
      setNewBadgeCriteria("");
      setNewBadgeValue(0);
      setNewBadgeImage(null);
      fetchBadges();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const awardBadge = async (badgeId: string) => {
    if (!user) return;

    const alreadyEarned = earnedBadges.some((eb) => eb.badge_id === badgeId);
    if (alreadyEarned) {
      toast({
        title: "Already Earned",
        description: "You already have this badge",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("user_badges").insert({
      user_id: user.id,
      badge_id: badgeId,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Badge Earned!", description: "Congratulations on your achievement!" });
      fetchEarnedBadges();
    }
  };

  const isEarned = (badgeId: string) => {
    return earnedBadges.some((eb) => eb.badge_id === badgeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2 flex items-center gap-3">
            <Trophy className="h-10 w-10" />
            Badge Collection
          </h1>
          <p className="text-muted-foreground">
            Earned {earnedBadges.length} out of {allBadges.length} badges
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Badge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  placeholder="e.g., First Victory"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  placeholder="Achievement description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria">Criteria Type (Optional)</Label>
                <Select value={newBadgeCriteria} onValueChange={setNewBadgeCriteria}>
                  <SelectTrigger id="criteria">
                    <SelectValue placeholder="Select criteria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="level">Level</SelectItem>
                    <SelectItem value="exp">Total EXP</SelectItem>
                    <SelectItem value="gold">Total Gold</SelectItem>
                    <SelectItem value="quests">Quests Completed</SelectItem>
                    <SelectItem value="battles">Boss Battles Won</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newBadgeCriteria && (
                <div className="space-y-2">
                  <Label htmlFor="value">Criteria Value</Label>
                  <Input
                    id="value"
                    type="number"
                    value={newBadgeValue}
                    onChange={(e) => setNewBadgeValue(parseInt(e.target.value) || 0)}
                    placeholder="e.g., 10 for level 10"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="image">Badge Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewBadgeImage(e.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={addBadge} className="w-full">
                Create Badge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="earned" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="earned">Earned ({earnedBadges.length})</TabsTrigger>
          <TabsTrigger value="available">
            Available ({allBadges.length - earnedBadges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No badges earned yet</p>
                <p className="text-sm text-muted-foreground">
                  Complete quests and achieve milestones to earn badges!
                </p>
              </Card>
            ) : (
              earnedBadges.map((userBadge) => (
                <Card key={userBadge.id} className="p-6 space-y-4 border-primary/30 glow-card">
                  {userBadge.badges.image_url && (
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={userBadge.badges.image_url}
                        alt={userBadge.badges.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-primary">{userBadge.badges.name}</h3>
                    {userBadge.badges.description && (
                      <p className="text-sm text-muted-foreground">
                        {userBadge.badges.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBadges.filter((badge) => !isEarned(badge.id)).length === 0 ? (
              <Card className="col-span-full p-12 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">All badges earned!</p>
                <p className="text-sm text-muted-foreground">
                  Congratulations! Create more badges to continue your journey.
                </p>
              </Card>
            ) : (
              allBadges
                .filter((badge) => !isEarned(badge.id))
                .map((badge) => (
                  <Card
                    key={badge.id}
                    className="p-6 space-y-4 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    {badge.image_url ? (
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted grayscale">
                        <img
                          src={badge.image_url}
                          alt={badge.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                        <Award className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold">{badge.name}</h3>
                      {badge.description && (
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                      )}
                      {badge.criteria_type && badge.criteria_value && (
                        <p className="text-xs text-muted-foreground">
                          Requirement: {badge.criteria_value} {badge.criteria_type}
                        </p>
                      )}
                      <Button onClick={() => awardBadge(badge.id)} className="w-full">
                        Claim Badge
                      </Button>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
