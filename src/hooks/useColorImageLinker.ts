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
                // Buscar todas variações com cor
                const { data: variations, error: fetchError } = await supabase
                    .from("product_variations")
                    .select("id, color")
                    .eq("product_id", productId)
                    .not("color", "is", null);

                if (fetchError) throw fetchError;

                // Atualizar cada variação baseado na cor
                const updates = (variations as VariationRow[])
                    ?.filter((v) => v.color)
                    .map((v) => {
                        const colorKey = v.color!.toLowerCase();
                        const imageUrl = map[colorKey] ?? null;
                        return supabase
                            .from("product_variations")
                            .update({ image_url: imageUrl })
                            .eq("id", v.id);
                    });

                if (updates && updates.length > 0) {
                    const results = await Promise.all(updates);
                    const errors = results.filter((r) => r.error);
                    if (errors.length > 0) {
                        console.error("❌ Erros ao salvar:", errors);
                        throw new Error(`Falha ao salvar ${errors.length} variações`);
                    }
                }

                toast({
                    title: "✅ Imagens vinculadas!",
                    description: `Imagens de ${Object.keys(map).length} cores atualizadas com sucesso.`,
                });

                return true;
            } catch (error) {
                console.error("❌ Erro ao salvar mapa cor-imagem:", error);
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
