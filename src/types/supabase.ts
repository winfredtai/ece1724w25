export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      user_credits: {
        Row: {
          created_at: string;
          credits_balance: number;
          id: number;
          last_purchase_date: string | null;
          level: string;
          total_credits_purchased: number;
          total_credits_used: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          credits_balance?: number;
          id?: number;
          last_purchase_date?: string | null;
          level: string;
          total_credits_purchased?: number;
          total_credits_used?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          credits_balance?: number;
          id?: number;
          last_purchase_date?: string | null;
          level?: string;
          total_credits_purchased?: number;
          total_credits_used?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          created_at: string;
          id: number;
          task_id: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          task_id: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          task_id?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_favorites_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "video_generation_task_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          auto_renew: boolean;
          cancellation_date: string | null;
          created_at: string;
          credits_per_period: number;
          end_date: string;
          id: number;
          next_renewal_date: string;
          payment_method: string | null;
          plan_type: string;
          price_paid: number | null;
          start_date: string;
          status: string;
          subscription_interval: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_renew?: boolean;
          cancellation_date?: string | null;
          created_at?: string;
          credits_per_period: number;
          end_date: string;
          id?: number;
          next_renewal_date: string;
          payment_method?: string | null;
          plan_type: string;
          price_paid?: number | null;
          start_date: string;
          status: string;
          subscription_interval?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_renew?: boolean;
          cancellation_date?: string | null;
          created_at?: string;
          credits_per_period?: number;
          end_date?: string;
          id?: number;
          next_renewal_date?: string;
          payment_method?: string | null;
          plan_type?: string;
          price_paid?: number | null;
          start_date?: string;
          status?: string;
          subscription_interval?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      video_generation_task_definitions: {
        Row: {
          additional_params: Json | null;
          aspect_ratio: string | null;
          camera_type: string | null;
          camera_value: string | null;
          cfg: number | null;
          created_at: string;
          credits: number;
          end_img_path: string | null;
          high_quality: boolean;
          id: number;
          model: string;
          negative_prompt: string | null;
          prompt: string | null;
          start_img_path: string;
          task_type: string;
          user_id: string | null;
        };
        Insert: {
          additional_params?: Json | null;
          aspect_ratio?: string | null;
          camera_type?: string | null;
          camera_value?: string | null;
          cfg?: number | null;
          created_at?: string;
          credits: number;
          end_img_path?: string | null;
          high_quality: boolean;
          id?: number;
          model: string;
          negative_prompt?: string | null;
          prompt?: string | null;
          start_img_path: string;
          task_type: string;
          user_id?: string | null;
        };
        Update: {
          additional_params?: Json | null;
          aspect_ratio?: string | null;
          camera_type?: string | null;
          camera_value?: string | null;
          cfg?: number | null;
          created_at?: string;
          credits?: number;
          end_img_path?: string | null;
          high_quality?: boolean;
          id?: number;
          model?: string;
          negative_prompt?: string | null;
          prompt?: string | null;
          start_img_path?: string;
          task_type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      video_generation_task_statuses: {
        Row: {
          created_at: string;
          error_message: string | null;
          external_task_id: string | null;
          id: number;
          result_url: string | null;
          status: string;
          task_id: number;
          thumbnail_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error_message?: string | null;
          external_task_id?: string | null;
          id?: number;
          result_url?: string | null;
          status?: string;
          task_id: number;
          thumbnail_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error_message?: string | null;
          external_task_id?: string | null;
          id?: number;
          result_url?: string | null;
          status?: string;
          task_id?: number;
          thumbnail_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "video_generation_task_statuses_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "video_generation_task_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
