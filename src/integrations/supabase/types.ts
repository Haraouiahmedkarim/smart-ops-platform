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
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          equipment_id: string | null
          id: string
          is_read: boolean
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          installation_date: string | null
          last_maintenance: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance: string | null
          operating_hours: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          installation_date?: string | null
          last_maintenance?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance?: string | null
          operating_hours?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          installation_date?: string | null
          last_maintenance?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance?: string | null
          operating_hours?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          duration_hours: number | null
          equipment_id: string
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes: string | null
          parts_used: string[] | null
          performed_by: string
          work_order_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          duration_hours?: number | null
          equipment_id: string
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          parts_used?: string[] | null
          performed_by: string
          work_order_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          duration_hours?: number | null
          equipment_id?: string
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          parts_used?: string[] | null
          performed_by?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sensor_data: {
        Row: {
          equipment_id: string
          id: string
          sensor_type: string
          timestamp: string
          unit: string | null
          value: number
        }
        Insert: {
          equipment_id: string
          id?: string
          sensor_type: string
          timestamp?: string
          unit?: string | null
          value: number
        }
        Update: {
          equipment_id?: string
          id?: string
          sensor_type?: string
          timestamp?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_data_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          compatible_equipment: string[] | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          minimum_quantity: number
          name: string
          part_number: string | null
          quantity: number
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          compatible_equipment?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number
          name: string
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          compatible_equipment?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          minimum_quantity?: number
          name?: string
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          equipment_id: string
          estimated_hours: number | null
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes: string | null
          priority: Database["public"]["Enums"]["work_order_priority"]
          scheduled_date: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          equipment_id: string
          estimated_hours?: number | null
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          equipment_id?: string
          estimated_hours?: number | null
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          notes?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"]
          scheduled_date?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "error" | "critical"
      app_role: "admin" | "technician" | "operator"
      equipment_status: "operational" | "maintenance" | "down" | "standby"
      maintenance_type:
        | "predictive"
        | "preventive"
        | "corrective"
        | "inspection"
      work_order_priority: "low" | "medium" | "high" | "critical"
      work_order_status: "pending" | "in_progress" | "completed" | "cancelled"
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
    Enums: {
      alert_severity: ["info", "warning", "error", "critical"],
      app_role: ["admin", "technician", "operator"],
      equipment_status: ["operational", "maintenance", "down", "standby"],
      maintenance_type: [
        "predictive",
        "preventive",
        "corrective",
        "inspection",
      ],
      work_order_priority: ["low", "medium", "high", "critical"],
      work_order_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
