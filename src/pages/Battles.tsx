import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Skull, CheckCircle2, Circle, Coins, Calendar, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Battle {
  id: string;
  name: string;
  difficulty: string;
  status_category_id?: string;
  battle_date?: string;
  gold: number;
  completed: boolean;
}

interface StatusCategory {
  id: string;
  name: string;
}

export default function Battles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [categories, setCategories] = useState<StatusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBattleName, setNewBattleName] = useState("");
  const [newBattleDifficulty, setNewBattleDifficulty] = useState("C");
  const [newBattleCategory, setNewBattleCategory] = useState("");
  const [newBattleDate, setNewBattleDate] = useState("");
  const [newBattleGold, setNewBattleGold] = useState(0);

  useEffect(() => {
    fetchBattles();
    fetchCategories();
  }, [user]);

  const fetchBattles = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("boss_battles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBattles(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("status_categories")
      .select("id, name")
      .eq("user_id", user.id);

    if (data) {
      setCategories(data);
    }
  };

  const addBattle = async () => {
    if (!user || !newBattleName.trim()) return;

    const { error } = await supabase
      .from("boss_battles")
      .insert({
        user_id: user.id,
        name: newBattleName,
        difficulty: newBattleDifficulty,
        status_category_id: newBattleCategory || null,
        battle_date: newBattleDate || null,
        gold: newBattleGold,
        completed: false,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Boss Battle Added", description: `${newBattleName} registered` });
      setNewBattleName("");
      setNewBattleCategory("");
      setNewBattleDate("");
      setNewBattleGold(0);
      fetchBattles();
    }
  };

  const editBattle = async (battle: Battle, updates: Partial<Battle>) => {
    const { error } = await supabase
      .from("boss_battles")
      .update({
        name: updates.name ?? battle.name,
        difficulty: updates.difficulty ?? battle.difficulty,
        status_category_id: updates.status_category_id ?? battle.status_category_id,
        battle_date: updates.battle_date ?? battle.battle_date,
        gold: typeof updates.gold === "number" ? updates.gold : battle.gold,
      })
      .eq("id", battle.id);
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Battle Updated", description: "Changes saved." });
      fetchBattles();
    }
  };

  const deleteBattle = async (battle: Battle) => {
    const { error } = await supabase.from("boss_battles").delete().eq("id", battle.id);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Battle Deleted", description: `${battle.name} removed.` });
      fetchBattles();
    }
  };

  const toggleBattle = async (battle: Battle) => {
    const newCompleted = !battle.completed;

    const { error } = await supabase
      .from("boss_battles")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", battle.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update profile gold if completed
    if (newCompleted && battle.gold > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            gold_earned: profile.gold_earned + battle.gold,
          })
          .eq("user_id", user?.id);
      }
    }

    fetchBattles();
    toast({
      title: newCompleted ? "Boss Defeated!" : "Battle Reopened",
      description: newCompleted && battle.gold > 0 ? `+${battle.gold} Gold earned` : "Status updated",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      S: "text-red-500 border-red-500 bg-red-500/10",
      A: "text-orange-500 border-orange-500 bg-orange-500/10",
      B: "text-yellow-500 border-yellow-500 bg-yellow-500/10",
      C: "text-green-500 border-green-500 bg-green-500/10",
      D: "text-blue-500 border-blue-500 bg-blue-500/10",
    };
    return colors[difficulty as keyof typeof colors] || "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading battles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2 flex items-center gap-3">
            <Skull className="h-10 w-10" />
            Boss Battles
          </h1>
          <p className="text-muted-foreground">Face your biggest challenges and earn gold</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Battle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Boss Battle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Battle Name</Label>
                <Input
                  id="name"
                  value={newBattleName}
                  onChange={(e) => setNewBattleName(e.target.value)}
                  placeholder="Name of the boss battle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={newBattleDifficulty} onValueChange={setNewBattleDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S">S-Rank</SelectItem>
                    <SelectItem value="A">A-Rank</SelectItem>
                    <SelectItem value="B">B-Rank</SelectItem>
                    <SelectItem value="C">C-Rank</SelectItem>
                    <SelectItem value="D">D-Rank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Status Category (Optional)</Label>
                <Select value={newBattleCategory} onValueChange={setNewBattleCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Battle Date (Optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={newBattleDate}
                  onChange={(e) => setNewBattleDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gold">Gold Reward</Label>
                <Input
                  id="gold"
                  type="number"
                  value={newBattleGold}
                  onChange={(e) => setNewBattleGold(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <Button onClick={addBattle} className="w-full">
                Register Battle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {battles.length === 0 ? (
          <Card className="p-12 text-center">
            <Skull className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No boss battles registered yet</p>
            <p className="text-sm text-muted-foreground">
              Register your first major challenge above!
            </p>
          </Card>
        ) : (
          battles.map((battle) => (
            <Card
              key={battle.id}
              className={`p-6 cursor-pointer transition-all ${
                battle.completed ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50 border-destructive/20"
              }`}
              onClick={() => toggleBattle(battle)}
            >
              <div className="flex items-start gap-4">
                {battle.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3
                      className={`text-xl font-bold ${
                        battle.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {battle.name}
                    </h3>
                    <span
                      className={`px-3 py-1 text-sm font-bold border rounded-full ${getDifficultyColor(
                        battle.difficulty
                      )}`}
                    >
                      {battle.difficulty}-RANK
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle>Edit Battle</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <Label>Name</Label>
                            <Input defaultValue={battle.name} id={`bname-${battle.id}`} />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Difficulty</Label>
                                <Select defaultValue={newBattleDifficulty} onValueChange={setNewBattleDifficulty}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="S">S-Rank</SelectItem>
                                    <SelectItem value="A">A-Rank</SelectItem>
                                    <SelectItem value="B">B-Rank</SelectItem>
                                    <SelectItem value="C">C-Rank</SelectItem>
                                    <SelectItem value="D">D-Rank</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Gold</Label>
                                <Input type="number" defaultValue={battle.gold} id={`bgold-${battle.id}`} />
                              </div>
                            </div>
                            <Label>Battle Date</Label>
                            <Input type="date" defaultValue={battle.battle_date || ""} id={`bdate-${battle.id}`} />
                            <Button
                              className="w-full"
                              onClick={async () => {
                                const name = (document.getElementById(`bname-${battle.id}`) as HTMLInputElement)?.value ?? battle.name;
                                const goldVal = parseInt((document.getElementById(`bgold-${battle.id}`) as HTMLInputElement)?.value || `${battle.gold}`, 10);
                                const dateVal = (document.getElementById(`bdate-${battle.id}`) as HTMLInputElement)?.value || battle.battle_date || null;
                                await editBattle(battle, {
                                  name,
                                  difficulty: newBattleDifficulty,
                                  gold: isNaN(goldVal) ? battle.gold : goldVal,
                                  battle_date: dateVal || undefined,
                                });
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBattle(battle);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    {battle.gold > 0 && (
                      <span className="flex items-center gap-2 text-gold">
                        <Coins className="h-4 w-4" />
                        {battle.gold} Gold
                      </span>
                    )}
                    {battle.battle_date && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(battle.battle_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
