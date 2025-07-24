import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ColorPicker } from "@/components/ui/color-picker";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  value: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  hex_color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, {
    message: "Cor hexadecimal inválida.",
  }),
  grade_sizes: z.string(),
  grade_pairs: z.string(),
});

const VariationGroups = () => {
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [editingVariation, setEditingVariation] = useState<{
    value: string;
    hex_color: string;
    grade_sizes: string;
    grade_pairs: string;
  }>({
    value: "",
    hex_color: "",
    grade_sizes: "",
    grade_pairs: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [variationToDelete, setVariationToDelete] = useState<string | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      hex_color: "#FFFFFF",
      grade_sizes: "",
      grade_pairs: "",
    },
  });

  const fetchVariations = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("variation_groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setVariations([]);
        return;
      }

      setVariations(data || []);
    } catch (err) {
      setError("Erro ao buscar variações");
      setVariations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariations();
  }, []);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase.from("variation_groups").insert([data]);

      if (error) {
        toast({
          title: "Erro ao criar variação",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Variação criada!",
        description: "Variação criada com sucesso.",
      });

      form.reset();
      fetchVariations();
    } catch (error) {
      toast({
        title: "Erro ao criar variação",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (variation: any) => {
    setEditingVariation({
      value: variation.value,
      hex_color: variation.hex_color,
      grade_sizes: variation.grade_sizes,
      grade_pairs: variation.grade_pairs,
    });
    form.setValue("value", variation.value);
    form.setValue("hex_color", variation.hex_color);
    form.setValue("grade_sizes", variation.grade_sizes);
    form.setValue("grade_pairs", variation.grade_pairs);
  };

  const handleCancelEdit = () => {
    setEditingVariation({
      value: "",
      hex_color: "",
      grade_sizes: "",
      grade_pairs: "",
    });
    form.reset();
  };

  const handleSaveVariation = async () => {
    try {
      const data = form.getValues();

      const { error } = await supabase
        .from("variation_groups")
        .update(data)
        .eq("value", editingVariation.value);

      if (error) {
        toast({
          title: "Erro ao salvar variação",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Variação salva!",
        description: "Variação salva com sucesso.",
      });

      setEditingVariation({
        value: "",
        hex_color: "",
        grade_sizes: "",
        grade_pairs: "",
      });
      form.reset();
      fetchVariations();
    } catch (error) {
      toast({
        title: "Erro ao salvar variação",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = (value: string) => {
    setVariationToDelete(value);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!variationToDelete) return;

    try {
      const { error } = await supabase
        .from("variation_groups")
        .delete()
        .eq("value", variationToDelete);

      if (error) {
        toast({
          title: "Erro ao excluir variação",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Variação excluída!",
        description: "Variação excluída com sucesso.",
      });

      setIsDialogOpen(false);
      setVariationToDelete(null);
      fetchVariations();
    } catch (error) {
      toast({
        title: "Erro ao excluir variação",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Grupos de Variação</CardTitle>
          <CardDescription>
            Adicione, edite e exclua grupos de variação para seus produtos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Variação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hex_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor (Hexadecimal)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="#FFFFFF"
                          className="w-32"
                          {...field}
                        />
                        <ColorPicker
                          value={field.value}
                          onColorChange={(color) => {
                            form.setValue("hex_color", color);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade_sizes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanhos da Grade (separados por vírgula)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: P, M, G"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade_pairs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pares por Tamanho (separados por vírgula)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 2, 4, 2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingVariation.value ? (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveVariation}>Salvar Edição</Button>
                </div>
              ) : (
                <Button type="submit">Criar Variação</Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Lista de Variações</CardTitle>
          <CardDescription>
            Visualize e gerencie as variações existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando variações...</div>
          ) : error ? (
            <div>Erro: {error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {variations.map((variation) => (
                <div
                  key={variation.value}
                  className="border rounded-md p-4 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-semibold">{variation.value}</div>
                    <Badge style={{ backgroundColor: variation.hex_color }}>
                      {variation.hex_color}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      Tamanhos: {variation.grade_sizes}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      Pares: {variation.grade_pairs}
                    </span>
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(variation)}
                    >
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação irá excluir a variação permanentemente.
                            Deseja continuar?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VariationGroups;
