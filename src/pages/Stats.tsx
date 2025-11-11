import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, TrendingUp, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatusCategory {
  id: string;
  name: string;
  level: number;
  exp: number;
  icon?: string;
  color?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category_id: string;
  exp_reward: number;
}

export default function Stats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<StatusCategory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StatusCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchGoals();
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("status_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const fetchGoals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);

    if (!error && data) {
      setGoals(data);
    }
  };

  const addCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    const { error } = await supabase
      .from("status_categories")
      .insert({
        user_id: user.id,
        name: newCategoryName,
        level: 1,
        exp: 0,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category Added", description: `${newCategoryName} created successfully` });
      setNewCategoryName("");
      fetchCategories();
    }
  };

  const addGoal = async () => {
    if (!user || !selectedCategory || !newGoalTitle.trim()) return;

    const { error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        category_id: selectedCategory.id,
        title: newGoalTitle,
        description: newGoalDesc,
        exp_reward: 100,
        completed: false,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goal Added", description: `${newGoalTitle} created successfully` });
      setNewGoalTitle("");
      setNewGoalDesc("");
      fetchGoals();
    }
  };

  const toggleGoal = async (goal: Goal) => {
    const newCompleted = !goal.completed;
    
    const { error } = await supabase
      .from("goals")
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq("id", goal.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update category EXP if completing goal
    if (newCompleted) {
      const category = categories.find((c) => c.id === goal.category_id);
      if (category) {
        const newExp = category.exp + goal.exp_reward;
        const expNeeded = category.level * 50;
        const newLevel = category.level + Math.floor(newExp / expNeeded);

        await supabase
          .from("status_categories")
          .update({
            exp: newExp,
            level: newLevel,
          })
          .eq("id", category.id);

        // Update profile EXP
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user?.id)
          .single();

        if (profile) {
          const profileNewExp = profile.exp + goal.exp_reward;
          const profileExpNeeded = profile.level * 100;
          const profileNewLevel = profile.level + Math.floor(profileNewExp / profileExpNeeded);

          await supabase
            .from("profiles")
            .update({
              exp: profileNewExp,
              level: profileNewLevel,
            })
            .eq("user_id", user?.id);
        }

        fetchCategories();
      }
    }

    fetchGoals();
    toast({
      title: newCompleted ? "Goal Completed!" : "Goal Uncompleted",
      description: newCompleted ? `+${goal.exp_reward} EXP earned` : "Progress updated",
    });
  };

  const editGoal = async (goal: Goal, updates: Partial<Goal>) => {
    const { error } = await supabase
      .from("goals")
      .update({
        title: updates.title ?? goal.title,
        description: updates.description ?? goal.description,
        exp_reward: typeof updates.exp_reward === "number" ? updates.exp_reward : goal.exp_reward,
      })
      .eq("id", goal.id);
    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goal Updated", description: "Changes saved." });
      fetchGoals();
    }
  };

  const deleteGoal = async (goal: Goal) => {
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Goal Deleted", description: `${goal.title} removed.` });
      fetchGoals();
    }
  };

  const getCategoryGoals = (categoryId: string) => {
    return goals.filter((g) => g.category_id === categoryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold glow-text mb-2">Status Categories</h1>
          <p className="text-muted-foreground">Track your growth across different life sectors</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Work, Skills, Fitness"
                />
              </div>
              <Button onClick={addCategory} className="w-full">
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const categoryGoals = getCategoryGoals(category.id);
          const completedGoals = categoryGoals.filter((g) => g.completed).length;
          const expNeeded = category.level * 50;
          const expProgress = (category.exp / expNeeded) * 100;

          return (
            <Dialog key={category.id} onOpenChange={(open) => open && setSelectedCategory(category)}>
              <DialogTrigger asChild>
                <Card className="p-6 border-primary/20 hover:border-primary/40 transition-all cursor-pointer hover:glow-card">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{category.name}</h3>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Level</p>
                        <p className="text-2xl font-bold text-primary">{category.level}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-exp" />
                          EXP
                        </span>
                        <span className="text-muted-foreground">
                          {category.exp} / {expNeeded}
                        </span>
                      </div>
                      <Progress value={expProgress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Goals</span>
                      <span className="font-semibold">
                        {completedGoals} / {categoryGoals.length}
                      </span>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">{category.name} Goals</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <Label>Add New Goal</Label>
                    <Input
                      placeholder="Goal title"
                      value={newGoalTitle}
                      onChange={(e) => setNewGoalTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Goal description (optional)"
                      value={newGoalDesc}
                      onChange={(e) => setNewGoalDesc(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={addGoal} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal (+150 EXP)
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Goals List</Label>
                    {categoryGoals.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No goals yet. Add your first goal above!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {categoryGoals.map((goal) => (
                          <Card
                            key={goal.id}
                            className={`p-4 cursor-pointer transition-all ${
                              goal.completed
                                ? "bg-primary/10 border-primary/30"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleGoal(goal)}
                          >
                            <div className="flex items-start gap-3">
                              {goal.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 space-y-1">
                                <p
                                  className={`font-semibold ${
                                    goal.completed ? "line-through text-muted-foreground" : ""
                                  }`}
                                >
                                  {goal.title}
                                </p>
                                {goal.description && (
                                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                                )}
                                <p className="text-xs text-primary">+{goal.exp_reward} EXP</p>
                              </div>
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
                                      <DialogTitle>Edit Goal</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3 py-2">
                                      <Label>Title</Label>
                                      <Input defaultValue={goal.title} id={`gtitle-${goal.id}`} />
                                      <Label>Description</Label>
                                      <Textarea defaultValue={goal.description} id={`gdesc-${goal.id}`} rows={3} />
                                      <Label>EXP Reward</Label>
                                      <Input type="number" defaultValue={goal.exp_reward} id={`gexp-${goal.id}`} />
                                      <Button
                                        className="w-full"
                                        onClick={async () => {
                                          const title = (document.getElementById(`gtitle-${goal.id}`) as HTMLInputElement)?.value ?? goal.title;
                                          const desc = (document.getElementById(`gdesc-${goal.id}`) as HTMLTextAreaElement)?.value ?? goal.description;
                                          const expVal = parseInt((document.getElementById(`gexp-${goal.id}`) as HTMLInputElement)?.value || `${goal.exp_reward}`, 10);
                                          await editGoal(goal, { title, description: desc, exp_reward: isNaN(expVal) ? goal.exp_reward : expVal });
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
                                    deleteGoal(goal);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No categories yet. Start by creating your first status category!
          </p>
          <p className="text-sm text-muted-foreground">
            Try: Work, Skills, Fitness, Academics, Personality Development
          </p>
        </Card>
      )}
    </div>
  );
}
