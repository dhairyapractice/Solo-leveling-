import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Gift, Heart, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RewardItem {
  id: string;
  name: string;
  price: number;
  required_level: number;
  image_url?: string;
  item_type: string;
  purchased: boolean;
}

interface Profile {
  level: number;
  hp: number;
}

export default function Rewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<RewardItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemLevel, setNewItemLevel] = useState(1);
  const [newItemImage, setNewItemImage] = useState<File | null>(null);

  useEffect(() => {
    fetchItems();
    fetchProfile();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("shop_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("item_type", "rewards")
      .order("price", { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("level, hp")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/rewards/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("hunter-assets")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("hunter-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const addItem = async () => {
    if (!user || !newItemName.trim()) return;

    try {
      let imageUrl = null;
      if (newItemImage) {
        imageUrl = await uploadImage(newItemImage);
      }

      const { error } = await supabase.from("shop_items").insert({
        user_id: user.id,
        name: newItemName,
        price: newItemPrice,
        required_level: newItemLevel,
        image_url: imageUrl,
        item_type: "rewards",
        purchased: false,
      });

      if (error) throw error;

      toast({ title: "Reward Added", description: `${newItemName} added to rewards` });
      setNewItemName("");
      setNewItemPrice(0);
      setNewItemLevel(1);
      setNewItemImage(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const purchaseItem = async (item: RewardItem) => {
    if (!profile) return;

    if (profile.hp < item.price) {
      toast({
        title: "Insufficient HP",
        description: `You need ${item.price - profile.hp} more HP`,
        variant: "destructive",
      });
      return;
    }

    if (profile.level < item.required_level) {
      toast({
        title: "Level Too Low",
        description: `Reach level ${item.required_level} to unlock this reward`,
        variant: "destructive",
      });
      return;
    }

    // For rewards, allow multiple purchases: do not flip 'purchased' flag
    const { error: hpError } = await supabase
      .from("profiles")
      .update({
        hp: Math.max(0, profile.hp - item.price),
      })
      .eq("user_id", user?.id);

    if (hpError) {
      toast({ title: "Error", description: hpError.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Reward Claimed!",
      description: `${item.name} purchased for ${item.price} HP`,
    });
    // No change to purchased flag; still refresh to reflect HP
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2 flex items-center gap-3">
            <Gift className="h-10 w-10" />
            Rewards
          </h1>
          <p className="text-muted-foreground">Spend your HP on rewards and treats</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your HP</p>
            <p className="text-2xl font-bold text-hp flex items-center gap-2">
              <Heart className="h-6 w-6" />
              {profile?.hp || 0} / 100
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Reward Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Reward Name</Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Name of the reward"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Cost (HP)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Required Level</Label>
                  <Input
                    id="level"
                    type="number"
                    value={newItemLevel}
                    onChange={(e) => setNewItemLevel(parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Reward Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewItemImage(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={addItem} className="w-full">
                  Add Reward
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No rewards available</p>
            <p className="text-sm text-muted-foreground">Add rewards you can claim with HP!</p>
          </Card>
        ) : (
          items.map((item) => {
            const canAfford = (profile?.hp || 0) >= item.price;
            const canUnlock = (profile?.level || 0) >= item.required_level;
            const canPurchase = canAfford && canUnlock; // allow multiple purchases

            return (
              <Card
                key={item.id}
                className={`p-6 space-y-4 transition-all ${
                  item.purchased
                    ? "bg-primary/10 border-primary/30"
                    : canPurchase
                    ? "hover:glow-card cursor-pointer"
                    : "opacity-60"
                }`}
                onClick={() => canPurchase && purchaseItem(item)}
              >
                {item.image_url && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{item.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-hp font-semibold">
                      <Heart className="h-5 w-5" />
                      {item.price} HP
                    </span>
                    {item.required_level > 1 && (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        {!canUnlock && <Lock className="h-4 w-4" />}
                        Lv. {item.required_level}
                      </span>
                    )}
                  </div>
                  <Button disabled={!canPurchase} className="w-full">
                    {!canAfford
                      ? "Not Enough HP"
                      : !canUnlock
                      ? "Level Locked"
                      : "Claim Reward"}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
