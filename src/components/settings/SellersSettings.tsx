import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStores } from "@/hooks/useStores";
import { useCatalogSettings } from "@/hooks/useCatalogSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  UserPlus,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

const RESERVED_SLUGS = ["produto", "catalog", "track", "auth", "c"];
const SLUG_REGEX = /^[a-z0-9-]+$/;

function validateSlug(slug: string): { valid: boolean; error?: string } {
  const s = slug.toLowerCase().trim();
  if (!s) return { valid: false, error: "Slug é obrigatório" };
  if (s.length < 2) return { valid: false, error: "Slug deve ter pelo menos 2 caracteres" };
  if (!SLUG_REGEX.test(s)) return { valid: false, error: "Apenas letras minúsculas, números e hífen" };
  if (RESERVED_SLUGS.includes(s)) return { valid: false, error: "Este slug está reservado" };
  return { valid: true };
}

function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

interface Seller {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  whatsapp_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SellersSettings: React.FC = () => {
  const { currentStore } = useStores();
  const { settings } = useCatalogSettings();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    whatsapp_phone: "",
    is_active: true,
  });

  const storeSlug = settings?.subdomain || currentStore?.url_slug || "loja";
  const baseUrl = settings?.subdomain
    ? `https://${settings.subdomain}.aoseudispor.com.br`
    : `https://app.aoseudispor.com.br/catalog/${currentStore?.url_slug || "loja"}`;

  const getSellerLink = (slug: string) => `${baseUrl}/${slug}`;

  const fetchSellers = useCallback(async () => {
    if (!currentStore?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("store_id", currentStore.id)
        .order("name");
      if (error) throw error;
      setSellers((data as Seller[]) || []);
    } catch (err) {
      console.error("Erro ao buscar vendedores:", err);
      toast.error("Erro ao carregar vendedores");
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      whatsapp_phone: "",
      is_active: true,
    });
    setEditingSeller(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name,
      slug: seller.slug,
      whatsapp_phone: seller.whatsapp_phone,
      is_active: seller.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentStore?.id) {
      toast.error("Loja não encontrada");
      return;
    }
    const slugValidation = validateSlug(formData.slug);
    if (!slugValidation.valid) {
      toast.error(slugValidation.error);
      return;
    }
    const phoneDigits = formData.whatsapp_phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast.error("Informe um número de WhatsApp válido");
      return;
    }
    const slug = formData.slug.toLowerCase().trim();
    const phoneFormatted = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;

    setSaving(true);
    try {
      if (editingSeller) {
        const { error } = await supabase
          .from("sellers")
          .update({
            name: formData.name.trim(),
            slug,
            whatsapp_phone: phoneFormatted,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingSeller.id);
        if (error) throw error;
        toast.success("Vendedor atualizado com sucesso");
      } else {
        const { error } = await supabase.from("sellers").insert({
          store_id: currentStore.id,
          name: formData.name.trim(),
          slug,
          whatsapp_phone: phoneFormatted,
          is_active: formData.is_active,
        });
        if (error) throw error;
        toast.success("Vendedor cadastrado com sucesso");
      }
      setDialogOpen(false);
      resetForm();
      fetchSellers();
    } catch (err: any) {
      if (err?.code === "23505") {
        toast.error("Já existe um vendedor com este slug");
      } else {
        toast.error(err?.message || "Erro ao salvar vendedor");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (seller: Seller) => {
    try {
      const { error } = await supabase
        .from("sellers")
        .update({ is_active: !seller.is_active, updated_at: new Date().toISOString() })
        .eq("id", seller.id);
      if (error) throw error;
      toast.success(seller.is_active ? "Vendedor desativado" : "Vendedor ativado");
      fetchSellers();
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (seller: Seller) => {
    if (!confirm(`Excluir o vendedor ${seller.name}? O link deixará de funcionar.`)) return;
    try {
      const { error } = await supabase.from("sellers").delete().eq("id", seller.id);
      if (error) throw error;
      toast.success("Vendedor excluído");
      fetchSellers();
      if (editingSeller?.id === seller.id) {
        setDialogOpen(false);
        resetForm();
      }
    } catch (err) {
      toast.error("Erro ao excluir vendedor");
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(getSellerLink(slug));
    toast.success("Link copiado!");
  };

  if (!currentStore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Carregando loja...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Vendedores
          </CardTitle>
          <CardDescription>
            Cadastre vendedores com links exclusivos. Os pedidos feitos pelo link de cada vendedor
            serão enviados ao WhatsApp dele.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenCreate} className="mb-4">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo vendedor
          </Button>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando...
            </div>
          ) : sellers.length === 0 ? (
            <p className="text-muted-foreground py-6">
              Nenhum vendedor cadastrado. Clique em &quot;Novo vendedor&quot; para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <code className="text-sm">{s.slug}</code>
                    </TableCell>
                    <TableCell>{formatPhoneForDisplay(s.whatsapp_phone.replace(/^55/, ""))}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(s.slug)}
                        className="gap-1"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.is_active}
                        onCheckedChange={() => handleToggleActive(s)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Exemplo de link</p>
            <p>
              <Link2 className="inline h-4 w-4 mr-1" />
              {baseUrl}/<strong>slug-do-vendedor</strong>
            </p>
            <p className="mt-2">
              Subdomínio: {storeSlug}.aoseudispor.com.br ou /catalog/{currentStore.url_slug}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeller ? "Editar vendedor" : "Novo vendedor"}</DialogTitle>
            <DialogDescription>
              O link do catálogo será: {baseUrl}/<strong>{formData.slug || "slug"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="seller-name">Nome</Label>
              <Input
                id="seller-name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Daniel Silva"
              />
            </div>
            <div>
              <Label htmlFor="seller-slug">Slug (URL)</Label>
              <Input
                id="seller-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))
                }
                placeholder="Ex: daniel"
                disabled={!!editingSeller}
              />
              {editingSeller && (
                <p className="text-xs text-muted-foreground mt-1">O slug não pode ser alterado após a criação</p>
              )}
            </div>
            <div>
              <Label htmlFor="seller-phone">WhatsApp</Label>
              <Input
                id="seller-phone"
                value={formData.whatsapp_phone}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    whatsapp_phone: e.target.value.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2"),
                  }))
                }
                placeholder="(11) 91234-5678"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="seller-active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
              />
              <Label htmlFor="seller-active">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSeller ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SellersSettings;
