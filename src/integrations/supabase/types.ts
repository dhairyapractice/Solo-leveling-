export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string
          criteria_type: string | null
          criteria_value: number | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria_type?: string | null
          criteria_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria_type?: string | null
          criteria_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      boss_battles: {
        Row: {
          battle_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          difficulty: string
          gold: number
          id: string
          name: string
          status_category_id: string | null
          user_id: string
        }
        Insert: {
          battle_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty: string
          gold?: number
          id?: string
          name: string
          status_category_id?: string | null
          user_id: string
        }
        Update: {
          battle_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          gold?: number
          id?: string
          name?: string
          status_category_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boss_battles_status_category_id_fkey"
            columns: ["status_category_id"]
            isOneToOne: false
            referencedRelation: "status_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          exp_reward: number
          id: string
          title: string
          user_id: string
        }
        Insert: {
          category_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          exp_reward?: number
          id?: string
          title: string
          user_id: string
        }
        Update: {
          category_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          exp_reward?: number
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "status_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pfp_milestones: {
        Row: {
          created_at: string
          id: string
          level_threshold: number
          pfp_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_threshold: number
          pfp_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_threshold?: number
          pfp_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          current_pfp_url: string | null
          exp: number
          gold_earned: number
          gold_spent: number
          hp: number
          id: string
          level: number
          name: string
          pfp1_url: string | null
          pfp2_url: string | null
          pfp3_url: string | null
          progress_percentage: number
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_pfp_url?: string | null
          exp?: number
          gold_earned?: number
          gold_spent?: number
          hp?: number
          id?: string
          level?: number
          name: string
          pfp1_url?: string | null
          pfp2_url?: string | null
          pfp3_url?: string | null
          progress_percentage?: number
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_pfp_url?: string | null
          exp?: number
          gold_earned?: number
          gold_spent?: number
          hp?: number
          id?: string
          level?: number
          name?: string
          pfp1_url?: string | null
          pfp2_url?: string | null
          pfp3_url?: string | null
          progress_percentage?: number
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          difficulty: string
          exp_reward: number
          hp_reward: number
          id: string
          quest_type: string
          status_category_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty: string
          exp_reward: number
          hp_reward: number
          id?: string
          quest_type: string
          status_category_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          exp_reward?: number
          hp_reward?: number
          id?: string
          quest_type?: string
          status_category_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_status_category_id_fkey"
            columns: ["status_category_id"]
            isOneToOne: false
            referencedRelation: "status_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          item_type: string
          name: string
          price: number
          purchased: boolean
          purchased_at: string | null
          required_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          item_type: string
          name: string
          price: number
          purchased?: boolean
          purchased_at?: string | null
          required_level?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          item_type?: string
          name?: string
          price?: number
          purchased?: boolean
          purchased_at?: string | null
          required_level?: number
          user_id?: string
        }
        Relationships: []
      }
      status_categories: {
        Row: {
          color: string | null
          created_at: string
          exp: number
          icon: string | null
          id: string
          level: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          exp?: number
          icon?: string | null
          id?: string
          level?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          exp?: number
          icon?: string | null
          id?: string
          level?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
