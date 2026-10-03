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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      gigs: {
        Row: {
          addons: Json
          availability: string
          created_at: string
          description: string
          duration: string
          id: string
          included: string[]
          materials: string
          name: string
          not_included: string[]
          photos: string[]
          professional_id: string
          service_area: string
          starting_price: number
          warranty: string
        }
        Insert: {
          addons?: Json
          availability?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          included?: string[]
          materials?: string
          name: string
          not_included?: string[]
          photos?: string[]
          professional_id: string
          service_area?: string
          starting_price?: number
          warranty?: string
        }
        Update: {
          addons?: Json
          availability?: string
          created_at?: string
          description?: string
          duration?: string
          id?: string
          included?: string[]
          materials?: string
          name?: string
          not_included?: string[]
          photos?: string[]
          professional_id?: string
          service_area?: string
          starting_price?: number
          warranty?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          city: string | null
          is_professional: boolean | null
          notifications_enabled: boolean | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          city?: string | null
          is_professional?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          city?: string | null
          is_professional?: boolean | null
          notifications_enabled?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          bio: string
          business: string
          city: string
          created_at: string
          experience: string
          id: string
          name: string
          projects_count: number
          rating: number
          reviews: number
          slug: string
          trade: string
          user_id: string | null
        }
        Insert: {
          bio?: string
          business: string
          city?: string
          created_at?: string
          experience?: string
          id?: string
          name: string
          projects_count?: number
          rating?: number
          reviews?: number
          slug: string
          trade?: string
          user_id?: string | null
        }
        Update: {
          bio?: string
          business?: string
          city?: string
          created_at?: string
          experience?: string
          id?: string
          name?: string
          projects_count?: number
          rating?: number
          reviews?: number
          slug?: string
          trade?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: string
          created_at: string
          customer_id: string
          gig_id: string | null
          id: string
          intent: string
          location: string
          price: number | null
          professional_id: string | null
          source: string
          status: string
          summary: string
          timing: string
          title: string
        }
        Insert: {
          budget?: string
          created_at?: string
          customer_id?: string
          gig_id?: string | null
          id?: string
          intent?: string
          location?: string
          price?: number | null
          professional_id?: string | null
          source?: string
          status?: string
          summary?: string
          timing?: string
          title: string
        }
        Update: {
          budget?: string
          created_at?: string
          customer_id?: string
          gig_id?: string | null
          id?: string
          intent?: string
          location?: string
          price?: number | null
          professional_id?: string | null
          source?: string
          status?: string
          summary?: string
          timing?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          duration: string
          id: string
          labour: number
          materials: string
          materials_cost: number
          other: number
          platform_fee: number
          professional_id: string
          project_id: string
          scope: string
          status: string
          submitted_at: string | null
          tax: number
          total: number | null
          transport: number
          warranty: string
          workers: number
        }
        Insert: {
          created_at?: string
          duration?: string
          id?: string
          labour?: number
          materials?: string
          materials_cost?: number
          other?: number
          platform_fee?: number
          professional_id: string
          project_id: string
          scope?: string
          status?: string
          submitted_at?: string | null
          tax?: number
          total?: number | null
          transport?: number
          warranty?: string
          workers?: number
        }
        Update: {
          created_at?: string
          duration?: string
          id?: string
          labour?: number
          materials?: string
          materials_cost?: number
          other?: number
          platform_fee?: number
          professional_id?: string
          project_id?: string
          scope?: string
          status?: string
          submitted_at?: string | null
          tax?: number
          total?: number | null
          transport?: number
          warranty?: string
          workers?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote: { Args: { _quote_id: string }; Returns: undefined }
      owns_professional: { Args: { _pid: string }; Returns: boolean }
      owns_project: { Args: { _id: string }; Returns: boolean }
      pro_on_project: { Args: { _id: string }; Returns: boolean }
      submit_quote: {
        Args: {
          _duration: string
          _labour: number
          _materials: string
          _materials_cost: number
          _other: number
          _platform_fee: number
          _quote_id: string
          _scope: string
          _tax: number
          _transport: number
          _warranty: string
          _workers: number
        }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
