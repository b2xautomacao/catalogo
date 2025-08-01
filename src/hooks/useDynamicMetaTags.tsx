import { useEffect } from "react";
import { useCatalog } from "./useCatalog";
import { useCatalogSettings } from "./useCatalogSettings";

interface UseDynamicMetaTagsProps {
  storeIdentifier?: string;
  catalogType?: "retail" | "wholesale";
  customTitle?: string;
  customDescription?: string;
  customImage?: string;
}

export const useDynamicMetaTags = ({
  storeIdentifier,
  catalogType = "retail",
  customTitle,
  customDescription,
  customImage,
}: UseDynamicMetaTagsProps) => {
  const { store } = useCatalog(storeIdentifier, catalogType);
  const { settings } = useCatalogSettings(storeIdentifier);

  useEffect(() => {
    if (!store) return;

    // Função para atualizar meta tags
    const updateMetaTags = () => {
      // Título da página
      const title =
        customTitle ||
        settings?.seo_title ||
        store.name ||
        "B2X - Catálogos Online";
      document.title = title;

      // Meta description
      const description =
        customDescription ||
        settings?.seo_description ||
        store.description ||
        `Catálogo online de ${store.name}`;

      updateMetaTag("description", description);
      updateMetaTag("og:description", description);

      // Meta title para Open Graph
      updateMetaTag("og:title", title);

      // Imagem da empresa (logo)
      const imageUrl = customImage || store.logo_url || "/b2x-logo.png"; // Fallback

      updateMetaTag("og:image", imageUrl);
      updateMetaTag("twitter:image", imageUrl);

      // URL do site
      const currentUrl = window.location.href;
      updateMetaTag("og:url", currentUrl);

      // Tipo de conteúdo
      updateMetaTag("og:type", "website");

      // Twitter card
      updateMetaTag("twitter:card", "summary_large_image");

      // Site do Twitter (se configurado)
      if (settings?.twitter_url) {
        updateMetaTag("twitter:site", settings.twitter_url);
      }

      // Keywords SEO
      if (settings?.seo_keywords) {
        updateMetaTag("keywords", settings.seo_keywords);
      }

      // Autor
      updateMetaTag("author", store.name);

      console.log("🏷️ Meta tags atualizadas para:", store.name);
    };

    // Função auxiliar para atualizar meta tags
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(
        `meta[name="${name}"]`
      ) as HTMLMetaElement;

      if (!meta) {
        meta = document.querySelector(
          `meta[property="${name}"]`
        ) as HTMLMetaElement;
      }

      if (meta) {
        meta.setAttribute("content", content);
      } else {
        // Criar nova meta tag se não existir
        meta = document.createElement("meta");
        if (name.startsWith("og:") || name.startsWith("twitter:")) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    // Atualizar meta tags quando os dados da loja estiverem disponíveis
    updateMetaTags();
  }, [store, settings, customTitle, customDescription, customImage]);

  return {
    store,
    settings,
    isLoaded: !!store,
  };
};
