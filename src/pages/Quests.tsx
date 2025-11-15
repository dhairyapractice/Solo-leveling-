import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Scroll, CheckCircle2, Circle, Zap, Heart, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Quest {
  id: string;
  title: string;
  description?: string;
  quest_type: string;
  difficulty: string;
  status_category_id?: string;
  exp_reward: number;
  hp_reward: number;
  completed: boolean;
}

interface StatusCategory {
  id: string;
  name: string;
}

// Default values for new quests - can be overridden when creating/editing
const DIFFICULTY_REWARDS = {
  S: { exp: 1000, hp: 500, penalty: 0 },
  A: { exp: 500, hp: 250, penalty: 0 },
  B: { exp: 250, hp: 100, penalty: 0 },
  C: { exp: 100, hp: 50, penalty: 0 },
  D: { exp: 50, hp: 25, penalty: 0 },
} as const;

export default function Quests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [categories, setCategories] = useState<StatusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestType, setNewQuestType] = useState("Daily");
  const [newQuestDifficulty, setNewQuestDifficulty] = useState("C");
  const [newQuestCategory, setNewQuestCategory] = useState("");
  const [customExp, setCustomExp] = useState<number | null>(null);
  const [customHp, setCustomHp] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchQuests();
      await fetchCategories();
      if (user) {
        // Calculate initial progress and streak on load
        await updateProgressAndStreak();
      }
    };
    loadData();
  }, [user]);

  const fetchQuests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setQuests(data);
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

  const updateProgressAndStreak = async () => {
    if (!user) return;

    // Get user's current profile data including exp history
    const { data: profile } = await supabase
      .from("profiles")
      .select("exp, exp_history, streak, last_active_date, progress_percentage")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    
    // Initialize exp_history if it doesn't exist
    const expHistory = profile.exp_history || {};
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    
    let progressPercentage = 0;
    let streak = profile.streak || 0;
    
    // Check if we've already updated today
    if (profile.last_active_date !== todayStr) {
      // Calculate progress based on today's exp vs yesterday's exp
      const yesterdayExp = expHistory[yesterdayStr] || 0;
      const todayExp = expHistory[todayStr] || 0;
      
      if (yesterdayExp > 0) {
        // Calculate percentage change from yesterday
        progressPercentage = Math.round(((todayExp - yesterdayExp) / yesterdayExp) * 100);
      } else if (todayExp > 0) {
        // If no yesterday's data but we have today's, set to 100%
        progressPercentage = 100;
      }
      
      // Update streak
      if (todayExp > 0) {
        // If we have activity today and it's a new day
        if (profile.last_active_date === yesterdayStr) {
          // Consecutive day
          streak++;
        } else if (profile.last_active_date !== todayStr) {
          // Missed a day, reset streak
          streak = 1;
        }
      } else if (profile.last_active_date && profile.last_active_date < yesterdayStr) {
        // No activity today and missed a day, reset streak
        streak = 0;
      }
      
      // Update profile with new progress and streak
      await supabase
        .from("profiles")
        .update({
          progress_percentage: progressPercentage,
          streak: streak,
          last_active_date: todayStr,
          exp_history: {
            ...expHistory,
            [todayStr]: profile.exp // Store current exp for today
          }
        })
        .eq("user_id", user.id);
    }

    // Update profile with progress and streak
    const { error } = await supabase
      .from("profiles")
      .update({
        progress_percentage: progressPercentage,
        streak: streak,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating progress and streak:", error);
    }
  };

  const addQuest = async () => {
    if (!user || !newQuestTitle.trim()) return;

    const difficultyRewards = DIFFICULTY_REWARDS[newQuestDifficulty as keyof typeof DIFFICULTY_REWARDS];
    const expReward = customExp !== null ? customExp : difficultyRewards.exp;
    const hpReward = customHp !== null ? customHp : difficultyRewards.hp;

    const questType = newQuestType.toLowerCase();

    const { error } = await supabase
      .from("quests")
      .insert({
        user_id: user.id,
        title: newQuestTitle,
        description: newQuestDesc,
        quest_type: questType,
        difficulty: newQuestDifficulty,
        status_category_id: newQuestCategory || null,
        exp_reward: expReward,
        hp_reward: hpReward,
        completed: false,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quest Added", description: `${newQuestTitle} created successfully` });
      setNewQuestTitle("");
      setNewQuestDesc("");
      setNewQuestCategory("");
      setCustomExp(null);
      setCustomHp(null);
      
      // Update progress if daily quest was added
      if (questType === "daily") {
        await updateProgressAndStreak();
      }
      
      fetchQuests();
    }
  };

  const editQuest = async (quest: Quest, updates: Partial<Quest>) => {
    const { error } = await supabase.from("quests")
      .update({
        title: updates.title ?? quest.title,
        description: updates.description ?? quest.description,
        quest_type: updates.quest_type ?? quest.quest_type,
        difficulty: updates.difficulty ?? quest.difficulty,
        status_category_id: updates.status_category_id ?? quest.status_category_id,
        exp_reward: updates.exp_reward ?? quest.exp_reward,
        hp_reward: updates.hp_reward ?? quest.hp_reward,
      })
      .eq("id", quest.id);
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quest Updated", description: "Changes saved." });
      fetchQuests();
    }
  };

  const deleteQuest = async (quest: Quest) => {
    const questType = quest.quest_type.toLowerCase();
    const { error } = await supabase.from("quests").delete().eq("id", quest.id);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quest Deleted", description: `${quest.title} removed.` });
      
      // Update progress if daily quest was deleted
      if (questType === "daily") {
        await updateProgressAndStreak();
      }
      
      fetchQuests();
    }
  };

  const toggleQuest = async (quest: Quest) => {
    const newCompleted = !quest.completed;

    const { error } = await supabase
      .from("quests")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", quest.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update profile stats
    if (newCompleted) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        const newExp = profile.exp + quest.exp_reward;
        const newHp = Math.min(100, Math.max(0, profile.hp + quest.hp_reward));
        const expNeeded = profile.level * 100;
        const newLevel = profile.level + Math.floor(newExp / expNeeded);

        await supabase
          .from("profiles")
          .update({
            exp: newExp,
            level: newLevel,
            hp: newHp,
          })
          .eq("user_id", user?.id);
      }

      // Update category EXP if assigned
      if (quest.status_category_id) {
        const { data: category } = await supabase
          .from("status_categories")
          .select("*")
          .eq("id", quest.status_category_id)
          .single();

        if (category) {
          const newExp = category.exp + quest.exp_reward;
          const expNeeded = category.level * 50;
          const newLevel = category.level + Math.floor(newExp / expNeeded);

          await supabase
            .from("status_categories")
            .update({
              exp: newExp,
              level: newLevel,
            })
            .eq("id", quest.status_category_id);
        }
      }
    }

    // Update progress and streak for daily quests
    if (quest.quest_type.toLowerCase() === "daily") {
      await updateProgressAndStreak();
    }

    fetchQuests();
    toast({
      title: newCompleted ? "Quest Completed!" : "Quest Uncompleted",
      description: newCompleted
        ? `+${quest.exp_reward} EXP, ${quest.hp_reward >= 0 ? "+" : ""}${quest.hp_reward} HP`
        : "Progress updated",
    });
  };

  const markFailed = async (quest: Quest) => {
    const rewards = DIFFICULTY_REWARDS[quest.difficulty as keyof typeof DIFFICULTY_REWARDS];
    const expPenalty = rewards.penalty;

    // Only penalize daily/weekly
    const type = (quest.quest_type || "").toLowerCase();
    if (!(type === "daily" || type === "weekly")) {
      toast({ title: "No Penalty Applied", description: "Penalties apply to daily/weekly tasks only." });
      return;
    }

    // Update profile EXP negatively
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user?.id)
      .single();
    if (profile) {
      const newExp = Math.max(0, profile.exp + expPenalty);
      const expNeeded = profile.level * 100;
      const levelDrop = newExp < 0 ? 0 : Math.floor(newExp / expNeeded); // keep simple, no level drop below 1
      await supabase
        .from("profiles")
        .update({
          exp: newExp,
          level: Math.max(1, profile.level + levelDrop),
        })
        .eq("user_id", user?.id);
    }

    toast({
      title: "Penalty Applied",
      description: `${expPenalty} EXP for missing ${quest.quest_type} quest`,
      variant: "destructive",
    });
    fetchQuests();
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      S: "text-red-500 border-red-500",
      A: "text-orange-500 border-orange-500",
      B: "text-yellow-500 border-yellow-500",
      C: "text-green-500 border-green-500",
      D: "text-blue-500 border-blue-500",
    };
    return colors[difficulty as keyof typeof colors] || "text-muted-foreground";
  };

  const filterQuests = (type: string) => {
    return quests.filter((q) => (q.quest_type || "").toLowerCase() === type.toLowerCase());
  };

  const QuestList = ({ questType }: { questType: string }) => {
    const filteredQuests = filterQuests(questType);

    return (
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No {questType.toLowerCase()} quests yet</p>
          </Card>
        ) : (
          filteredQuests.map((quest) => (
            <Card
              key={quest.id}
              className={`p-4 cursor-pointer transition-all ${
                quest.completed ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"
              }`}
              onClick={() => toggleQuest(quest)}
            >
              <div className="flex items-start gap-3">
                {quest.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`font-semibold ${
                        quest.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {quest.title}
                    </p>
                    <span
                      className={`px-2 py-0.5 text-xs font-bold border rounded ${getDifficultyColor(
                        quest.difficulty
                      )}`}
                    >
                      {quest.difficulty}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          markFailed(quest);
                        }}
                      >
                        Penalty
                      </Button>
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
                            <DialogTitle>Edit Quest</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 py-2">
                            <Label>Title</Label>
                            <Input defaultValue={quest.title} id={`title-${quest.id}`} />
                            <Label>Description</Label>
                            <Textarea defaultValue={quest.description} id={`desc-${quest.id}`} rows={3} />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Type</Label>
                                <Select defaultValue={quest.quest_type} onValueChange={(v) => (quest.quest_type = v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Daily">Daily</SelectItem>
                                    <SelectItem value="Weekly">Weekly</SelectItem>
                                    <SelectItem value="Monthly">Monthly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Difficulty</Label>
                                <Select defaultValue={quest.difficulty} onValueChange={(v) => (quest.difficulty = v)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="S">S</SelectItem>
                                    <SelectItem value="A">A</SelectItem>
                                    <SelectItem value="B">B</SelectItem>
                                    <SelectItem value="C">C</SelectItem>
                                    <SelectItem value="D">D</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>EXP Reward</Label>
                                <Input
                                  type="number"
                                  defaultValue={quest.exp_reward}
                                  id={`exp-${quest.id}`}
                                />
                              </div>
                              <div>
                                <Label>HP Reward</Label>
                                <Input
                                  type="number"
                                  defaultValue={quest.hp_reward}
                                  id={`hp-${quest.id}`}
                                />
                              </div>
                            </div>
                            <Button
                              className="w-full"
                              onClick={async () => {
                                const title = (document.getElementById(`title-${quest.id}`) as HTMLInputElement)?.value ?? quest.title;
                                const description = (document.getElementById(`desc-${quest.id}`) as HTMLTextAreaElement)?.value ?? quest.description;
                                const expVal = parseInt((document.getElementById(`exp-${quest.id}`) as HTMLInputElement)?.value || `${quest.exp_reward}`, 10);
                                const hpVal = parseInt((document.getElementById(`hp-${quest.id}`) as HTMLInputElement)?.value || `${quest.hp_reward}`, 10);
                                await editQuest(quest, {
                                  title,
                                  description,
                                  quest_type: quest.quest_type,
                                  difficulty: quest.difficulty,
                                  exp_reward: isNaN(expVal) ? quest.exp_reward : expVal,
                                  hp_reward: isNaN(hpVal) ? quest.hp_reward : hpVal,
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
                          deleteQuest(quest);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {quest.description && (
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-exp">
                      <Zap className="h-3 w-3" />
                      +{quest.exp_reward} EXP
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        quest.hp_reward >= 0 ? "text-hp" : "text-destructive"
                      }`}
                    >
                      <Heart className="h-3 w-3" />
                      {quest.hp_reward >= 0 ? "+" : ""}
                      {quest.hp_reward} HP
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2 flex items-center gap-3">
            <Scroll className="h-10 w-10" />
            Quest Board
          </h1>
          <p className="text-muted-foreground">Complete daily tasks to level up</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Quest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quest Title</Label>
                <Input
                  id="title"
                  value={newQuestTitle}
                  onChange={(e) => setNewQuestTitle(e.target.value)}
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newQuestDesc}
                  onChange={(e) => setNewQuestDesc(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customExp">Custom EXP (Optional)</Label>
                  <Input
                    id="customExp"
                    type="number"
                    min="0"
                    placeholder={`Default: ${DIFFICULTY_REWARDS[newQuestDifficulty as keyof typeof DIFFICULTY_REWARDS].exp}`}
                    value={customExp ?? ''}
                    onChange={(e) => setCustomExp(e.target.value ? parseInt(e.target.value, 10) : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customHp">Custom HP (Optional)</Label>
                  <Input
                    id="customHp"
                    type="number"
                    placeholder={`Default: ${DIFFICULTY_REWARDS[newQuestDifficulty as keyof typeof DIFFICULTY_REWARDS].hp}`}
                    value={customHp ?? ''}
                    onChange={(e) => setCustomHp(e.target.value ? parseInt(e.target.value, 10) : null)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newQuestType} onValueChange={setNewQuestType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={newQuestDifficulty} onValueChange={setNewQuestDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S (50 EXP, -20 HP)</SelectItem>
                      <SelectItem value="A">A (25 EXP, -10 HP)</SelectItem>
                      <SelectItem value="B">B (10 EXP, -5 HP)</SelectItem>
                      <SelectItem value="C">C (5 EXP, 0 HP)</SelectItem>
                      <SelectItem value="D">D (2 EXP, 0 HP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Status Category (Optional)</Label>
                <Select value={newQuestCategory} onValueChange={setNewQuestCategory}>
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
              <Button onClick={addQuest} className="w-full">
                Create Quest
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="Daily" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="Daily">Daily</TabsTrigger>
          <TabsTrigger value="Weekly">Weekly</TabsTrigger>
          <TabsTrigger value="Monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="Daily">
          <QuestList questType="Daily" />
        </TabsContent>
        <TabsContent value="Weekly">
          <QuestList questType="Weekly" />
        </TabsContent>
        <TabsContent value="Monthly">
          <QuestList questType="Monthly" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
