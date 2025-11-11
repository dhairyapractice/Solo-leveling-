import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Swords } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome Back, Hunter!",
        description: "Your journey continues...",
      });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 space-y-6 border-primary/20 glow-card">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <Swords className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold glow-text">Hunter Login</h1>
          <p className="text-muted-foreground">Enter the System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="hunter@system.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Enter System"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            New hunter?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
