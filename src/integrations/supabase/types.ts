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
      custos: {
        Row: {
          area_peca: number | null
          created_at: string
          energia: number
          id: string
          manutencao: number
          mao_de_obra: number
          margem: number
          outros_fixos: number
          produto_id: string | null
          qtd_pecas: number
          traco_id: string
          user_id: string
        }
        Insert: {
          area_peca?: number | null
          created_at?: string
          energia?: number
          id?: string
          manutencao?: number
          mao_de_obra?: number
          margem?: number
          outros_fixos?: number
          produto_id?: string | null
          qtd_pecas?: number
          traco_id: string
          user_id: string
        }
        Update: {
          area_peca?: number | null
          created_at?: string
          energia?: number
          id?: string
          manutencao?: number
          mao_de_obra?: number
          margem?: number
          outros_fixos?: number
          produto_id?: string | null
          qtd_pecas?: number
          traco_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custos_traco_id_fkey"
            columns: ["traco_id"]
            isOneToOne: false
            referencedRelation: "tracos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          categoria: string
          codigo: string | null
          created_at: string
          custo_unitario: number
          fornecedor: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          unidade: string
          user_id: string
        }
        Insert: {
          categoria?: string
          codigo?: string | null
          created_at?: string
          custo_unitario?: number
          fornecedor?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          unidade?: string
          user_id: string
        }
        Update: {
          categoria?: string
          codigo?: string | null
          created_at?: string
          custo_unitario?: number
          fornecedor?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          unidade?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          altura: number | null
          codigo: string | null
          comprimento: number | null
          created_at: string
          familia: string
          id: string
          largura: number | null
          nome: string
          observacoes: string | null
          peso: number | null
          resistencia_alvo: number | null
          status: string
          traco_id: string | null
          user_id: string
        }
        Insert: {
          altura?: number | null
          codigo?: string | null
          comprimento?: number | null
          created_at?: string
          familia?: string
          id?: string
          largura?: number | null
          nome: string
          observacoes?: string | null
          peso?: number | null
          resistencia_alvo?: number | null
          status?: string
          traco_id?: string | null
          user_id: string
        }
        Update: {
          altura?: number | null
          codigo?: string | null
          comprimento?: number | null
          created_at?: string
          familia?: string
          id?: string
          largura?: number | null
          nome?: string
          observacoes?: string | null
          peso?: number | null
          resistencia_alvo?: number | null
          status?: string
          traco_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_traco_id_fkey"
            columns: ["traco_id"]
            isOneToOne: false
            referencedRelation: "tracos"
            referencedColumns: ["id"]
          },
        ]
      }
      testes: {
        Row: {
          absorcao: number | null
          created_at: string
          data_ensaio: string
          id: string
          idade_dias: number
          lote: string | null
          observacoes: string | null
          resistencia_obtida: number | null
          responsavel: string | null
          resultado: string
          traco_id: string
          user_id: string
        }
        Insert: {
          absorcao?: number | null
          created_at?: string
          data_ensaio?: string
          id?: string
          idade_dias?: number
          lote?: string | null
          observacoes?: string | null
          resistencia_obtida?: number | null
          responsavel?: string | null
          resultado?: string
          traco_id: string
          user_id: string
        }
        Update: {
          absorcao?: number | null
          created_at?: string
          data_ensaio?: string
          id?: string
          idade_dias?: number
          lote?: string | null
          observacoes?: string | null
          resistencia_obtida?: number | null
          responsavel?: string | null
          resultado?: string
          traco_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testes_traco_id_fkey"
            columns: ["traco_id"]
            isOneToOne: false
            referencedRelation: "tracos"
            referencedColumns: ["id"]
          },
        ]
      }
      traco_insumos: {
        Row: {
          custo_calculado: number
          id: string
          insumo_id: string
          quantidade: number
          traco_id: string
        }
        Insert: {
          custo_calculado?: number
          id?: string
          insumo_id: string
          quantidade?: number
          traco_id: string
        }
        Update: {
          custo_calculado?: number
          id?: string
          insumo_id?: string
          quantidade?: number
          traco_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traco_insumos_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traco_insumos_traco_id_fkey"
            columns: ["traco_id"]
            isOneToOne: false
            referencedRelation: "tracos"
            referencedColumns: ["id"]
          },
        ]
      }
      tracos: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          resistencia_alvo: number | null
          status: string
          tipo: string
          user_id: string
          versao: number
          volume_lote: number | null
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          resistencia_alvo?: number | null
          status?: string
          tipo?: string
          user_id: string
          versao?: number
          volume_lote?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          resistencia_alvo?: number | null
          status?: string
          tipo?: string
          user_id?: string
          versao?: number
          volume_lote?: number | null
        }
        Relationships: []
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
