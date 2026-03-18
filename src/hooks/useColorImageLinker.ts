import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ColorImageMap {
    [color: string]: string | null; // color → image_url (null = sem imagem)
}

interface VariationRow {
    id: string;
    color: string | null;
    image_url: string | null;
}

export const useColorImageLinker = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    /**
     * Carrega o mapa cor → image_url de todas variações de um produto.
     * Retorna apenas cores únicas com sua imagem associada.
     */
    const loadColorImageMap = useCallback(
        async (productId: string): Promise<ColorImageMap> => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("product_variations")
                    .select("id, color, image_url")
                    .eq("product_id", productId)
                    .not("color", "is", null);

                if (error) throw error;

                const map: ColorImageMap = {};
                (data as VariationRow[])?.forEach((v) => {
                    if (v.color) {
                        const colorKey = v.color.toLowerCase();
                        // Pega a primeira image_url não-null para cada cor
                        if (!map[colorKey] && v.image_url) {
                            map[colorKey] = v.image_url;
                        } else if (!(colorKey in map)) {
                            map[colorKey] = null;
                        }
                    }
                });

                return map;
            } catch (error) {
                console.error("❌ Erro ao carregar mapa cor-imagem:", error);
                toast({
                    title: "Erro",
                    description: "Falha ao carregar imagens das variações.",
                    variant: "destructive",
                });
                return {};
            } finally {
                setIsLoading(false);
            }
        },
        [toast]
    );

    /**
     * Salva o mapa cor → image_url para todas variações do produto.
     * Atualiza em batch: todas variações da mesma cor recebem a mesma image_url.
     */
    const saveColorImageMap = useCallback(
        async (productId: string, map: ColorImageMap): Promise<boolean> => {
            setIsSaving(true);
            try {
                const colorEntries = Object.entries(map);
                
                if (colorEntries.length === 0) {
                  return true;
                }

                console.log(`🚀 Iniciando salvamento de vinculações para ${colorEntries.length} cores...`);

                // Atualizar variações em batch por cor (uma query por cor ao invés de uma por variação)
                const updatePromises = colorEntries.map(([color, imageUrl]) => {
                    return supabase
                        .from("product_variations")
                        .update({ image_url: imageUrl })
                        .eq("product_id", productId)
                        .ilike("color", color);
                });

                const results = await Promise.all(updatePromises);
                const errors = results.filter((r) => r.error);

                if (errors.length > 0) {
                    console.error("❌ Erros detalhados ao salvar mapa cor-imagem:");
                    errors.forEach((res, index) => {
                        const err = res.error;
                        console.error(`Erro ${index + 1}:`, {
                            code: err?.code,
                            message: err?.message,
                            details: err?.details,
                            hint: err?.hint,
                            // Incluir contexto se possível
                        });
                    });
                    throw new Error(`Falha ao salvar vinculações para ${errors.length} cores.`);
                }

                toast({
                    title: "✅ Imagens vinculadas!",
                    description: `Imagens de ${colorEntries.length} cores atualizadas com sucesso.`,
                });

                return true;
            } catch (error: any) {
                console.error("❌ Erro fatal ao salvar mapa cor-imagem:", error);
                
                // Se o erro veio do Supabase mas não passou pelo filter de errors acima
                if (error.code || error.message) {
                  console.error("Detalhes do erro:", {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                  });
                }

                toast({
                    title: "Erro ao salvar",
                    description:
                        error instanceof Error
                            ? error.message
                            : "Falha ao salvar vinculações.",
                    variant: "destructive",
                });
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [toast]
    );

    /**
     * Remove a imagem de todas variações de uma cor específica.
     */
    const clearColorImage = useCallback(
        async (productId: string, color: string): Promise<boolean> => {
            try {
                const { error } = await supabase
                    .from("product_variations")
                    .update({ image_url: null })
                    .eq("product_id", productId)
                    .ilike("color", color);

                if (error) throw error;
                return true;
            } catch (error) {
                console.error("❌ Erro ao limpar imagem da cor:", error);
                return false;
            }
        },
        []
    );

    return {
        isLoading,
        isSaving,
        loadColorImageMap,
        saveColorImageMap,
        clearColorImage,
    };
};
