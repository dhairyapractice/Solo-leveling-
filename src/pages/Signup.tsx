import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Swords } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // send back to app after verification
          data: { name }, // store name in user metadata as fallback
        },
      }
    );

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // If email confirmation is required, there may be no session yet.
    // Only insert profile when a session exists (auth.uid() is available for RLS).
    if (data.user) {
      if (data.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            user_id: data.user.id,
            name,
          });

        if (profileError) {
          toast({
            title: "Profile Creation Failed",
            description: profileError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome, Hunter!",
            description: "Your journey begins now. You have awakened as a Hunter.",
          });
          navigate("/");
        }
      } else {
        // No active session: prompt to verify email and login
        toast({
          title: "Verify Your Email",
          description: "We sent a confirmation link. After verifying, log in to continue.",
        });
        navigate("/login");
      }
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
          <h1 className="text-3xl font-bold glow-text">Hunter Registration</h1>
          <p className="text-muted-foreground">Awaken as a Hunter</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Hunter Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-input border-border"
            />
          </div>

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
              minLength={6}
              className="bg-input border-border"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Awakening..." : "Become a Hunter"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Already a hunter?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
