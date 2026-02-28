import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStoreResolver } from "@/hooks/useStoreResolver";

export interface CatalogSettingsData {
  store_id?: string;
  template_name?: string;
  show_prices?: boolean;
  show_stock?: boolean;
  allow_categories_filter?: boolean;
  allow_price_filter?: boolean;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
  mobile_columns?: number;
  catalog_mode?: string;
  catalog_url_slug?: string;
  checkout_type?: string;
  payment_methods?: any;
  business_hours?: any;
  shipping_options?: any;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  whatsapp_integration_active?: boolean;
  font_family?: string;
  layout_spacing?: number;
  border_radius?: number;
  retail_catalog_active?: boolean;
  wholesale_catalog_active?: boolean;
  watermark_enabled?: boolean;
  watermark_type?: string;
  watermark_text?: string;
  watermark_logo_url?: string;
  watermark_position?: string;
  watermark_opacity?: number;
  watermark_size?: number;
  watermark_color?: string;
  privacy_policy_content?: string;
  terms_of_use_content?: string;
  returns_policy_content?: string;
  delivery_policy_content?: string;
  about_us_content?: string;
  linkedin_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  footer_enabled?: boolean;
  footer_custom_text?: string;
  footer_copyright_text?: string;
  business_hours_display_type?: "summary" | "detailed";
  conversion_mode?: "simple" | "optimized"; // Modo de conversão do catálogo
  // Novos campos para sistema de templates avançado
  logo_color_palette?: any; // ColorPalette em JSON
  auto_extract_colors?: boolean;
  button_style?: "flat" | "modern" | "rounded";
  footer_style?: "dark" | "light" | "gradient";
  footer_bg_color?: string;
  footer_text_color?: string;
  header_badges_enabled?: boolean;
  // Badges individuais do header
  header_badge_fast_delivery?: boolean;
  header_badge_fast_delivery_text?: string;
  header_badge_free_shipping?: boolean;
  header_badge_free_shipping_text?: string;
  header_free_shipping_threshold?: number;
  header_badge_secure_checkout?: boolean;
  header_badge_secure_checkout_text?: string;
  header_badge_custom_1?: boolean;
  header_badge_custom_1_text?: string;
  header_badge_custom_1_icon?: string;
  // Configurações da Página do Produto
  product_show_urgency_badges?: boolean;
  product_show_low_stock_badge?: boolean;
  product_low_stock_threshold?: number;
  product_show_best_seller_badge?: boolean;
  product_show_sales_count?: boolean;
  product_show_views_count?: boolean;
  product_show_free_shipping_badge?: boolean;
  product_show_fast_delivery_badge?: boolean;
  product_show_social_proof_carousel?: boolean;
  product_social_proof_autorotate?: boolean;
  product_social_proof_interval?: number;
  product_show_ratings?: boolean;
  product_show_rating_distribution?: boolean;
  product_show_trust_section?: boolean;
  product_trust_free_shipping?: boolean;
  product_trust_money_back?: boolean;
  product_trust_fast_delivery?: boolean;
  product_trust_secure_payment?: boolean;
  product_trust_delivery_days?: string;
  product_trust_return_days?: number;
  product_show_videos?: boolean;
  product_show_testimonials?: boolean;
  product_testimonials_max_display?: number;
  product_show_size_chart?: boolean;
  product_size_chart_default_open?: boolean;
  product_show_care_section?: boolean;
  product_care_section_default_open?: boolean;
  product_videos_default_open?: boolean;
  product_testimonials_default_open?: boolean;
  // Pixels e Tracking
  meta_pixel_id?: string;
  meta_pixel_enabled?: boolean;
  meta_pixel_access_token?: string;
  meta_pixel_verified?: boolean;
  meta_pixel_verified_at?: string;
  ga4_measurement_id?: string;
  ga4_enabled?: boolean;
  ga4_api_secret?: string;
  google_ads_id?: string;
  google_ads_enabled?: boolean;
  google_ads_conversion_label?: string;
  tiktok_pixel_id?: string;
  tiktok_pixel_enabled?: boolean;
  tracking_pageview?: boolean;
  tracking_view_content?: boolean;
  tracking_add_to_cart?: boolean;
  tracking_initiate_checkout?: boolean;
  tracking_add_payment_info?: boolean;
  tracking_purchase?: boolean;
  tracking_search?: boolean;
  tracking_view_category?: boolean;
  tracking_advanced_matching?: boolean;
  tracking_auto_events?: boolean;
  tracking_debug_mode?: boolean;
  custom_events_config?: any;
  // Configurações do Checkout
  checkout_require_address?: boolean; // Se true, solicita endereço no checkout
  checkout_whatsapp_only?: boolean; // Se true, finaliza direto no WhatsApp (sem etapa de pagamento online)
  // Domínios Customizados
  subdomain_enabled?: boolean;
  subdomain?: string;
  custom_domain?: string;
  custom_domain_enabled?: boolean;
  custom_domain_verified?: boolean;
  custom_domain_verification_token?: string;
  custom_domain_verified_at?: string;
  domain_mode?: "slug" | "subdomain" | "custom_domain";
  ssl_cert_status?: "pending" | "active" | "failed";
  // Propriedades adicionais para compatibilidade com templates
  colors?: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
  };
  global?: {
    borderRadius: number;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  productCard?: {
    showQuickView: boolean;
    showAddToCart: boolean;
    productCardStyle: string;
  };
}

export const useCatalogSettings = (storeIdentifier?: string) => {
  const { profile } = useAuth();
  const { resolveStoreId } = useStoreResolver();
  const [settings, setSettings] = useState<CatalogSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(null);

  // Resolver store ID uma vez
  useEffect(() => {
    const resolveStore = async () => {
      try {
        setError(null);
        const targetIdentifier = storeIdentifier || profile?.store_id;

        if (!targetIdentifier) {
          console.log(
            "useCatalogSettings: Nenhum identificador de loja disponível"
          );
          setSettings({});
          setResolvedStoreId(null);
          return;
        }

        console.log(
          "useCatalogSettings: Resolvendo store ID para:",
          targetIdentifier
        );
        const storeId = await resolveStoreId(targetIdentifier);

        if (!storeId) {
          console.error(
            "useCatalogSettings: Loja não encontrada para:",
            targetIdentifier
          );
          setError("Loja não encontrada");
          setSettings({});
          setResolvedStoreId(null);
          return;
        }

        console.log("useCatalogSettings: Store ID resolvido:", storeId);
        setResolvedStoreId(storeId);
      } catch (err) {
        console.error("useCatalogSettings: Erro ao resolver store ID:", err);
        setError("Erro ao carregar configurações da loja");
        setSettings({});
        setResolvedStoreId(null);
      }
    };

    resolveStore();
  }, [storeIdentifier, profile?.store_id, resolveStoreId]);

  const fetchSettings = async () => {
    if (!resolvedStoreId) {
      console.log("useCatalogSettings: Store ID não resolvido ainda");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "useCatalogSettings: Buscando configurações para store_id:",
        resolvedStoreId
      );

      const { data, error: fetchError } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", resolvedStoreId)
        .maybeSingle();

      if (fetchError) {
        console.error(
          "useCatalogSettings: Erro ao buscar configurações:",
          fetchError
        );
        setError("Erro ao carregar configurações");
        setSettings({});
        return;
      }

      if (data) {
        console.log("useCatalogSettings: Configurações carregadas");
        setSettings({
          store_id: data.store_id,
          template_name: data.template_name,
          show_prices: data.show_prices,
          show_stock: data.show_stock,
          allow_categories_filter: data.allow_categories_filter,
          allow_price_filter: data.allow_price_filter,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          seo_keywords: data.seo_keywords,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          accent_color: data.accent_color,
          background_color: data.background_color,
          text_color: data.text_color,
          border_color: data.border_color,
          mobile_columns: data.mobile_columns,
          catalog_mode: data.catalog_mode,
          catalog_url_slug: data.catalog_url_slug,
          checkout_type: data.checkout_type,
          payment_methods: data.payment_methods,
          business_hours: data.business_hours,
          shipping_options: data.shipping_options,
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          twitter_url: data.twitter_url,
          whatsapp_number: data.whatsapp_number,
          whatsapp_integration_active: data.whatsapp_integration_active,
          font_family: data.font_family,
          layout_spacing: data.layout_spacing,
          border_radius: data.border_radius,
          retail_catalog_active: data.retail_catalog_active,
          wholesale_catalog_active: data.wholesale_catalog_active,
          watermark_enabled: data.watermark_enabled,
          watermark_type: data.watermark_type,
          watermark_text: data.watermark_text,
          watermark_logo_url: data.watermark_logo_url,
          watermark_position: data.watermark_position,
          watermark_opacity: data.watermark_opacity,
          watermark_size: data.watermark_size,
          watermark_color: data.watermark_color,
          privacy_policy_content: (data as any).privacy_policy_content,
          terms_of_use_content: (data as any).terms_of_use_content,
          returns_policy_content: (data as any).returns_policy_content,
          delivery_policy_content: (data as any).delivery_policy_content,
          about_us_content: (data as any).about_us_content,
          linkedin_url: (data as any).linkedin_url,
          youtube_url: (data as any).youtube_url,
          tiktok_url: (data as any).tiktok_url,
          footer_enabled: (data as any).footer_enabled,
          footer_custom_text: (data as any).footer_custom_text,
          footer_copyright_text: (data as any).footer_copyright_text,
          business_hours_display_type:
            (data as any).business_hours_display_type || "summary",
          conversion_mode: (data as any).conversion_mode,
          // Estilos de aparência
          button_style: (data as any).button_style,
          footer_style: (data as any).footer_style,
          footer_bg_color: (data as any).footer_bg_color,
          footer_text_color: (data as any).footer_text_color,
          logo_color_palette: (data as any).logo_color_palette,
          auto_extract_colors: (data as any).auto_extract_colors,
          // Badges do header
          header_badges_enabled: (data as any).header_badges_enabled,
          header_badge_fast_delivery: (data as any).header_badge_fast_delivery,
          header_badge_fast_delivery_text: (data as any).header_badge_fast_delivery_text,
          header_badge_free_shipping: (data as any).header_badge_free_shipping,
          header_badge_free_shipping_text: (data as any).header_badge_free_shipping_text,
          header_free_shipping_threshold: (data as any).header_free_shipping_threshold,
          header_badge_secure_checkout: (data as any).header_badge_secure_checkout,
          header_badge_secure_checkout_text: (data as any).header_badge_secure_checkout_text,
          header_badge_custom_1: (data as any).header_badge_custom_1,
          header_badge_custom_1_text: (data as any).header_badge_custom_1_text,
          header_badge_custom_1_icon: (data as any).header_badge_custom_1_icon,
          // Configurações da Página do Produto
          product_show_urgency_badges: (data as any).product_show_urgency_badges,
          product_show_low_stock_badge: (data as any).product_show_low_stock_badge,
          product_low_stock_threshold: (data as any).product_low_stock_threshold,
          product_show_best_seller_badge: (data as any).product_show_best_seller_badge,
          product_show_sales_count: (data as any).product_show_sales_count,
          product_show_views_count: (data as any).product_show_views_count,
          product_show_free_shipping_badge: (data as any).product_show_free_shipping_badge,
          product_show_fast_delivery_badge: (data as any).product_show_fast_delivery_badge,
          product_show_social_proof_carousel: (data as any).product_show_social_proof_carousel,
          product_social_proof_autorotate: (data as any).product_social_proof_autorotate,
          product_social_proof_interval: (data as any).product_social_proof_interval,
          product_show_ratings: (data as any).product_show_ratings,
          product_show_rating_distribution: (data as any).product_show_rating_distribution,
          product_show_trust_section: (data as any).product_show_trust_section,
          product_trust_free_shipping: (data as any).product_trust_free_shipping,
          product_trust_money_back: (data as any).product_trust_money_back,
          product_trust_fast_delivery: (data as any).product_trust_fast_delivery,
          product_trust_secure_payment: (data as any).product_trust_secure_payment,
          product_trust_delivery_days: (data as any).product_trust_delivery_days,
          product_trust_return_days: (data as any).product_trust_return_days,
          product_show_videos: (data as any).product_show_videos,
          product_show_testimonials: (data as any).product_show_testimonials,
          product_testimonials_max_display: (data as any).product_testimonials_max_display,
          product_show_size_chart: (data as any).product_show_size_chart,
          product_size_chart_default_open: (data as any).product_size_chart_default_open,
          product_show_care_section: (data as any).product_show_care_section,
          product_care_section_default_open: (data as any).product_care_section_default_open,
          product_videos_default_open: (data as any).product_videos_default_open,
          product_testimonials_default_open: (data as any).product_testimonials_default_open,
          // Pixels e Tracking
          meta_pixel_id: (data as any).meta_pixel_id,
          meta_pixel_enabled: (data as any).meta_pixel_enabled,
          meta_pixel_access_token: (data as any).meta_pixel_access_token,
          meta_pixel_verified: (data as any).meta_pixel_verified,
          meta_pixel_verified_at: (data as any).meta_pixel_verified_at,
          ga4_measurement_id: (data as any).ga4_measurement_id,
          ga4_enabled: (data as any).ga4_enabled,
          ga4_api_secret: (data as any).ga4_api_secret,
          google_ads_id: (data as any).google_ads_id,
          google_ads_enabled: (data as any).google_ads_enabled,
          google_ads_conversion_label: (data as any).google_ads_conversion_label,
          tiktok_pixel_id: (data as any).tiktok_pixel_id,
          tiktok_pixel_enabled: (data as any).tiktok_pixel_enabled,
          tracking_pageview: (data as any).tracking_pageview,
          tracking_view_content: (data as any).tracking_view_content,
          tracking_add_to_cart: (data as any).tracking_add_to_cart,
          tracking_initiate_checkout: (data as any).tracking_initiate_checkout,
          tracking_add_payment_info: (data as any).tracking_add_payment_info,
          tracking_purchase: (data as any).tracking_purchase,
          tracking_search: (data as any).tracking_search,
          tracking_view_category: (data as any).tracking_view_category,
          tracking_advanced_matching: (data as any).tracking_advanced_matching,
          tracking_auto_events: (data as any).tracking_auto_events,
          tracking_debug_mode: (data as any).tracking_debug_mode,
          custom_events_config: (data as any).custom_events_config,
          // Domínios
          subdomain_enabled: (data as any).subdomain_enabled,
          subdomain: (data as any).subdomain,
          custom_domain: (data as any).custom_domain,
          custom_domain_enabled: (data as any).custom_domain_enabled,
          custom_domain_verified: (data as any).custom_domain_verified,
          custom_domain_verification_token: (data as any).custom_domain_verification_token,
          custom_domain_verified_at: (data as any).custom_domain_verified_at,
          domain_mode: (data as any).domain_mode,
          ssl_cert_status: (data as any).ssl_cert_status,
          // Checkout
          checkout_require_address: (data as any).checkout_require_address,
          checkout_whatsapp_only: (data as any).checkout_whatsapp_only,
        });
      } else {
        console.log(
          "useCatalogSettings: Nenhuma configuração encontrada, usando padrões"
        );
        setSettings({});
      }
    } catch (error) {
      console.error("useCatalogSettings: Erro geral:", error);
      setError("Erro ao carregar configurações");
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolvedStoreId) {
      fetchSettings();
    } else if (resolvedStoreId === null && !loading) {
      setLoading(false);
    }
  }, [resolvedStoreId]);

  const updateSettings = async (updates: Partial<CatalogSettingsData>) => {
    if (!resolvedStoreId) {
      const errorMessage = "Store ID não disponível para atualização das configurações";
      console.error("❌ useCatalogSettings:", errorMessage);
      throw new Error(errorMessage);
    }

    try {
      console.log("🔄 useCatalogSettings: Atualizando configurações", {
        storeId: resolvedStoreId,
        updates
      });

      const updateData = {
        store_id: resolvedStoreId,
        ...updates,
      };

      console.log("🔄 useCatalogSettings: Dados para upsert:", updateData);

      const { data, error } = await supabase
        .from("store_settings")
        .upsert(
          updateData,
          {
            onConflict: "store_id",
          }
        )
        .select()
        .single();

      console.log("🔄 useCatalogSettings: Resultado do upsert:", { data, error });

      if (error) {
        console.error("❌ useCatalogSettings: Erro no upsert:", error);
        throw error;
      }

      console.log("✅ useCatalogSettings: Configurações atualizadas com sucesso");
      
      // Refetch para garantir que os dados estão sincronizados
      await fetchSettings();
      return { data, error: null };
    } catch (error) {
      console.error(
        "💥 useCatalogSettings: Erro ao atualizar configurações:",
        error
      );
      return { data: null, error };
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refetch: fetchSettings,
    storeId: resolvedStoreId,
  };
};
