export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      catalogs: {
        Row: {
          created_at: string
          custom_settings: Json | null
          id: string
          is_active: boolean
          store_id: string
          template_name: string | null
          type: Database["public"]["Enums"]["catalog_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_settings?: Json | null
          id?: string
          is_active?: boolean
          store_id: string
          template_name?: string | null
          type: Database["public"]["Enums"]["catalog_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_settings?: Json | null
          id?: string
          is_active?: boolean
          store_id?: string
          template_name?: string | null
          type?: Database["public"]["Enums"]["catalog_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          created_at: string
          current_usage: number
          feature_type: Database["public"]["Enums"]["feature_type"]
          id: string
          period_end: string
          period_start: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_usage?: number
          feature_type: Database["public"]["Enums"]["feature_type"]
          id?: string
          period_end?: string
          period_start?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_usage?: number
          feature_type?: Database["public"]["Enums"]["feature_type"]
          id?: string
          period_end?: string
          period_start?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_webhooks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          updated_at: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          carrier: string | null
          content_declaration_printed_at: string | null
          content_declaration_printed_by: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: Json | null
          delivery_status: string | null
          estimated_delivery_date: string | null
          id: string
          items: Json
          label_generated_at: string | null
          label_generated_by: string | null
          notes: string | null
          order_type: Database["public"]["Enums"]["catalog_type"]
          payment_method: string | null
          picking_list_printed_at: string | null
          picking_list_printed_by: string | null
          receipt_printed_at: string | null
          receipt_printed_by: string | null
          reservation_expires_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          stock_reserved: boolean
          store_id: string
          total_amount: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          content_declaration_printed_at?: string | null
          content_declaration_printed_by?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_status?: string | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json
          label_generated_at?: string | null
          label_generated_by?: string | null
          notes?: string | null
          order_type?: Database["public"]["Enums"]["catalog_type"]
          payment_method?: string | null
          picking_list_printed_at?: string | null
          picking_list_printed_by?: string | null
          receipt_printed_at?: string | null
          receipt_printed_by?: string | null
          reservation_expires_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_reserved?: boolean
          store_id: string
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          content_declaration_printed_at?: string | null
          content_declaration_printed_by?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: Json | null
          delivery_status?: string | null
          estimated_delivery_date?: string | null
          id?: string
          items?: Json
          label_generated_at?: string | null
          label_generated_by?: string | null
          notes?: string | null
          order_type?: Database["public"]["Enums"]["catalog_type"]
          payment_method?: string | null
          picking_list_printed_at?: string | null
          picking_list_printed_by?: string | null
          receipt_printed_at?: string | null
          receipt_printed_by?: string | null
          reservation_expires_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stock_reserved?: boolean
          store_id?: string
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_content_declaration_printed_by_fkey"
            columns: ["content_declaration_printed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_label_generated_by_fkey"
            columns: ["label_generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_picking_list_printed_by_fkey"
            columns: ["picking_list_printed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_receipt_printed_by_fkey"
            columns: ["receipt_printed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          due_date: string | null
          id: string
          mercadopago_collection_id: string | null
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          mercadopago_response: Json | null
          mercadopago_status: string | null
          notes: string | null
          order_id: string
          payment_method: string
          reference_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          mercadopago_collection_id?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_response?: Json | null
          mercadopago_status?: string | null
          notes?: string | null
          order_id: string
          payment_method: string
          reference_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          mercadopago_collection_id?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          mercadopago_response?: Json | null
          mercadopago_status?: string | null
          notes?: string | null
          order_id?: string
          payment_method?: string
          reference_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_benefits: {
        Row: {
          benefit_id: string
          created_at: string
          id: string
          is_enabled: boolean
          limit_value: string | null
          plan_id: string
        }
        Insert: {
          benefit_id: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          limit_value?: string | null
          plan_id: string
        }
        Update: {
          benefit_id?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          limit_value?: string | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "system_benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_benefits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          feature_type: Database["public"]["Enums"]["feature_type"]
          feature_value: string | null
          id: string
          is_enabled: boolean
          plan_id: string
        }
        Insert: {
          created_at?: string
          feature_type: Database["public"]["Enums"]["feature_type"]
          feature_value?: string | null
          id?: string
          is_enabled?: boolean
          plan_id: string
        }
        Update: {
          created_at?: string
          feature_type?: Database["public"]["Enums"]["feature_type"]
          feature_value?: string | null
          id?: string
          is_enabled?: boolean
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_payments: {
        Row: {
          amount: number
          created_at: string
          gateway: string
          gateway_payment_id: string | null
          gateway_response: Json | null
          id: string
          plan_id: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          gateway: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          plan_id: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          gateway?: string
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          id?: string
          plan_id?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_order: number
          image_url: string
          is_primary: boolean
          product_id: string
          variation_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url: string
          is_primary?: boolean
          product_id: string
          variation_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_order?: number
          image_url?: string
          is_primary?: boolean
          product_id?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          price_adjustment: number | null
          product_id: string
          size: string | null
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_adjustment?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          price_adjustment?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_negative_stock: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean | null
          keywords: string | null
          meta_description: string | null
          meta_title: string | null
          min_wholesale_qty: number | null
          name: string
          reserved_stock: number
          retail_price: number
          seo_slug: string | null
          stock: number
          stock_alert_threshold: number | null
          store_id: string
          updated_at: string
          wholesale_price: number | null
        }
        Insert: {
          allow_negative_stock?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          min_wholesale_qty?: number | null
          name: string
          reserved_stock?: number
          retail_price?: number
          seo_slug?: string | null
          stock?: number
          stock_alert_threshold?: number | null
          store_id: string
          updated_at?: string
          wholesale_price?: number | null
        }
        Update: {
          allow_negative_stock?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          keywords?: string | null
          meta_description?: string | null
          meta_title?: string | null
          min_wholesale_qty?: number | null
          name?: string
          reserved_stock?: number
          retail_price?: number
          seo_slug?: string | null
          stock?: number
          stock_alert_threshold?: number | null
          store_id?: string
          updated_at?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_store_id"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          order_id: string | null
          previous_stock: number
          product_id: string
          quantity: number
          store_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          movement_type: string
          new_stock: number
          notes?: string | null
          order_id?: string | null
          previous_stock: number
          product_id: string
          quantity: number
          store_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          order_id?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          allow_categories_filter: boolean | null
          allow_price_filter: boolean | null
          business_hours: Json | null
          business_type: string | null
          catalog_mode: string | null
          catalog_url_slug: string | null
          checkout_type: string | null
          created_at: string
          custom_domain: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          payment_methods: Json | null
          retail_catalog_active: boolean | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          shipping_options: Json | null
          show_prices: boolean | null
          show_stock: boolean | null
          store_id: string
          template_name: string | null
          twitter_url: string | null
          updated_at: string
          watermark_color: string | null
          watermark_enabled: boolean | null
          watermark_logo_url: string | null
          watermark_opacity: number | null
          watermark_position: string | null
          watermark_size: number | null
          watermark_text: string | null
          watermark_type: string | null
          whatsapp_integration_active: boolean | null
          whatsapp_number: string | null
          wholesale_catalog_active: boolean | null
        }
        Insert: {
          allow_categories_filter?: boolean | null
          allow_price_filter?: boolean | null
          business_hours?: Json | null
          business_type?: string | null
          catalog_mode?: string | null
          catalog_url_slug?: string | null
          checkout_type?: string | null
          created_at?: string
          custom_domain?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          payment_methods?: Json | null
          retail_catalog_active?: boolean | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          shipping_options?: Json | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          store_id: string
          template_name?: string | null
          twitter_url?: string | null
          updated_at?: string
          watermark_color?: string | null
          watermark_enabled?: boolean | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_size?: number | null
          watermark_text?: string | null
          watermark_type?: string | null
          whatsapp_integration_active?: boolean | null
          whatsapp_number?: string | null
          wholesale_catalog_active?: boolean | null
        }
        Update: {
          allow_categories_filter?: boolean | null
          allow_price_filter?: boolean | null
          business_hours?: Json | null
          business_type?: string | null
          catalog_mode?: string | null
          catalog_url_slug?: string | null
          checkout_type?: string | null
          created_at?: string
          custom_domain?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          payment_methods?: Json | null
          retail_catalog_active?: boolean | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          shipping_options?: Json | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          store_id?: string
          template_name?: string | null
          twitter_url?: string | null
          updated_at?: string
          watermark_color?: string | null
          watermark_enabled?: boolean | null
          watermark_logo_url?: string | null
          watermark_opacity?: number | null
          watermark_position?: string | null
          watermark_size?: number | null
          watermark_text?: string | null
          watermark_type?: string | null
          whatsapp_integration_active?: boolean | null
          whatsapp_number?: string | null
          wholesale_catalog_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          ends_at: string | null
          id: string
          mercadopago_subscription_id: string | null
          plan_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          plan_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          mercadopago_subscription_id?: string | null
          plan_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          store_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          monthly_fee: number | null
          name: string
          owner_id: string
          phone: string | null
          plan_type: string
          updated_at: string
          url_slug: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          monthly_fee?: number | null
          name: string
          owner_id: string
          phone?: string | null
          plan_type?: string
          updated_at?: string
          url_slug?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          monthly_fee?: number | null
          name?: string
          owner_id?: string
          phone?: string | null
          plan_type?: string
          updated_at?: string
          url_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          trial_days: number | null
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_monthly: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number | null
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number | null
          type?: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      system_benefits: {
        Row: {
          benefit_key: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          benefit_key: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          benefit_key?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_integrations: {
        Row: {
          connection_status: string | null
          created_at: string
          evolution_api_token: string | null
          evolution_api_url: string | null
          id: string
          instance_name: string
          last_connected_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name: string
          last_connected_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string
          evolution_api_token?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_store_slug: {
        Args: { store_name: string; store_id: string }
        Returns: string
      }
      get_available_stock: {
        Args: { product_uuid: string }
        Returns: number
      }
      get_benefit_limit: {
        Args: { _store_id: string; _benefit_key: string }
        Returns: string
      }
      get_feature_limit: {
        Args: {
          _store_id: string
          _feature_type: Database["public"]["Enums"]["feature_type"]
        }
        Returns: string
      }
      get_user_store_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_benefit_access: {
        Args: { _store_id: string; _benefit_key: string }
        Returns: boolean
      }
      has_feature_access: {
        Args: {
          _store_id: string
          _feature_type: Database["public"]["Enums"]["feature_type"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_store_owner: {
        Args: { _user_id: string; _store_id: string }
        Returns: boolean
      }
      is_superadmin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      release_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_payment_from_mercadopago: {
        Args: {
          _order_id: string
          _mp_payment_id: string
          _mp_status: string
          _mp_response?: Json
        }
        Returns: string
      }
    }
    Enums: {
      catalog_type: "retail" | "wholesale"
      feature_type:
        | "max_products"
        | "max_images_per_product"
        | "max_team_members"
        | "whatsapp_integration"
        | "payment_pix"
        | "payment_credit_card"
        | "custom_domain"
        | "api_access"
        | "ai_agent"
        | "discount_coupons"
        | "abandoned_cart_recovery"
        | "multi_variations"
        | "shipping_calculator"
        | "dedicated_support"
        | "team_management"
        | "pickup_points"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipping"
        | "delivered"
        | "cancelled"
      subscription_plan_type: "basic" | "premium" | "enterprise"
      subscription_status:
        | "active"
        | "inactive"
        | "canceled"
        | "past_due"
        | "trialing"
      user_role: "superadmin" | "store_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      catalog_type: ["retail", "wholesale"],
      feature_type: [
        "max_products",
        "max_images_per_product",
        "max_team_members",
        "whatsapp_integration",
        "payment_pix",
        "payment_credit_card",
        "custom_domain",
        "api_access",
        "ai_agent",
        "discount_coupons",
        "abandoned_cart_recovery",
        "multi_variations",
        "shipping_calculator",
        "dedicated_support",
        "team_management",
        "pickup_points",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipping",
        "delivered",
        "cancelled",
      ],
      subscription_plan_type: ["basic", "premium", "enterprise"],
      subscription_status: [
        "active",
        "inactive",
        "canceled",
        "past_due",
        "trialing",
      ],
      user_role: ["superadmin", "store_admin"],
    },
  },
} as const
