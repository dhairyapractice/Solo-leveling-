import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart, Coins, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShopItem {
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
  gold_earned: number;
  gold_spent: number;
}

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
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
      .eq("item_type", "shop")
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
      .select("level, gold_earned, gold_spent")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user?.id}/shop/${fileName}`;

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
        item_type: "shop",
        purchased: false,
      });

      if (error) throw error;

      toast({ title: "Item Added", description: `${newItemName} added to shop` });
      setNewItemName("");
      setNewItemPrice(0);
      setNewItemLevel(1);
      setNewItemImage(null);
      fetchItems();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const purchaseItem = async (item: ShopItem) => {
    if (!profile) return;

    const currentGold = profile.gold_earned - profile.gold_spent;

    if (currentGold < item.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.price - currentGold} more gold`,
        variant: "destructive",
      });
      return;
    }

    if (profile.level < item.required_level) {
      toast({
        title: "Level Too Low",
        description: `Reach level ${item.required_level} to unlock this item`,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("shop_items")
      .update({
        purchased: true,
        purchased_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    await supabase
      .from("profiles")
      .update({
        gold_spent: profile.gold_spent + item.price,
      })
      .eq("user_id", user?.id);

    toast({
      title: "Purchase Successful!",
      description: `${item.name} is now yours`,
    });
    fetchItems();
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shop...</p>
        </div>
      </div>
    );
  }

  const currentGold = profile ? profile.gold_earned - profile.gold_spent : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2 flex items-center gap-3">
            <ShoppingCart className="h-10 w-10" />
            Hunter Shop
          </h1>
          <p className="text-muted-foreground">Purchase items with your hard-earned gold</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Your Gold</p>
            <p className="text-2xl font-bold text-gold flex items-center gap-2">
              <Coins className="h-6 w-6" />
              {currentGold}
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Shop Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Name of the item"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Gold)</Label>
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
                  <Label htmlFor="image">Item Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewItemImage(e.target.files?.[0] || null)}
                  />
                </div>
                <Button onClick={addItem} className="w-full">
                  Add to Shop
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Shop is empty</p>
            <p className="text-sm text-muted-foreground">Add items to your hunter shop above!</p>
          </Card>
        ) : (
          items.map((item) => {
            const canAfford = currentGold >= item.price;
            const canUnlock = (profile?.level || 0) >= item.required_level;
            const canPurchase = canAfford && canUnlock && !item.purchased;

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
                    <span className="flex items-center gap-2 text-gold font-semibold">
                      <Coins className="h-5 w-5" />
                      {item.price}
                    </span>
                    {item.required_level > 1 && (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        {!canUnlock && <Lock className="h-4 w-4" />}
                        Lv. {item.required_level}
                      </span>
                    )}
                  </div>
                  {item.purchased ? (
                    <Button disabled className="w-full">
                      Purchased
                    </Button>
                  ) : (
                    <Button disabled={!canPurchase} className="w-full">
                      {!canAfford
                        ? "Not Enough Gold"
                        : !canUnlock
                        ? "Level Locked"
                        : "Purchase"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
