import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useStoreColors, StoreColor } from '@/hooks/useStoreColors';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const StoreColors: React.FC = () => {
    const { colors, loading, fetchColors, deleteColor } = useStoreColors();
    const { toast } = useToast();
    const { profile } = useAuth();

    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<StoreColor | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return colors;
        return colors.filter(c =>
            c.name.toLowerCase().includes(q) || c.hex_color.toLowerCase().includes(q)
        );
    }, [colors, search]);

    const handleDelete = async (color: StoreColor) => {
        const confirmed = window.confirm(`Deseja realmente excluir a cor "${color.name}"?`);
        if (!confirmed) return;
        const { error } = await deleteColor(color.id);
        if (error) {
            toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a cor.', variant: 'destructive' });
        } else {
            toast({ title: 'Cor excluída', description: `A cor "${color.name}" foi removida.` });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 bg-white rounded-lg border">
                <div className="flex items-center gap-4">
                    <Palette className="w-8 h-8 text-pink-600" />
                    <div>
                        <h2 className="text-lg font-semibold">Paleta de Cores</h2>
                        <p className="text-gray-600">Gerencie as cores disponíveis para suas variações de produtos</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar cores..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-[260px]"
                        />
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Cor
                    </Button>
                </div>
            </div>

            <Card className="card-modern">
                <CardHeader>
                    <CardTitle>Cores Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhuma cor encontrada. Adicione uma nova cor para começar.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filtered.map((color) => (
                                <div key={color.id} className="p-4 flex items-center justify-between rounded-lg border bg-white hover:shadow-sm transition">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                                            style={{ backgroundColor: color.hex_color }}
                                        />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{color.name}</h3>
                                            <p className="text-xs text-gray-500 uppercase">{color.hex_color}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setEditing(color)}>
                                            <Pencil className="h-4 w-4 text-gray-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(color)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova Cor</DialogTitle>
                    </DialogHeader>
                    {profile?.store_id && (
                        <ColorEditForm
                            storeId={profile.store_id}
                            onClose={() => setIsCreateOpen(false)}
                            onSaved={() => {
                                setIsCreateOpen(false);
                                fetchColors();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(o) => (!o ? setEditing(null) : undefined)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Cor</DialogTitle>
                    </DialogHeader>
                    {editing && profile?.store_id && (
                        <ColorEditForm
                            storeId={profile.store_id}
                            initialData={editing}
                            onClose={() => setEditing(null)}
                            onSaved={() => {
                                setEditing(null);
                                fetchColors();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface ColorEditFormProps {
    storeId: string;
    initialData?: StoreColor;
    onClose: () => void;
    onSaved: () => void;
}

const ColorEditForm: React.FC<ColorEditFormProps> = ({ storeId, initialData, onClose, onSaved }) => {
    const { createColor, updateColor } = useStoreColors();
    const { toast } = useToast();

    const [name, setName] = useState(initialData?.name || '');
    const [hexColor, setHexColor] = useState(initialData?.hex_color || '#000000');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: 'Aviso', description: 'Informe o nome da cor.', variant: 'destructive' });
            return;
        }

        setSaving(true);
        let error;

        if (initialData) {
            const result = await updateColor(initialData.id, {
                name: name.trim(),
                hex_color: hexColor,
            });
            error = result.error;
        } else {
            const result = await createColor({
                store_id: storeId,
                name: name.trim(),
                hex_color: hexColor,
                is_active: true,
            });
            error = result.error;
        }

        setSaving(false);

        if (error) {
            toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
        } else {
            toast({ title: 'Cor salva', description: `A cor "${name}" foi salva com sucesso.` });
            onSaved();
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Cor</label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Azul Marinho"
                    autoFocus
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Cor Hexadecimal</label>
                <div className="flex gap-3 items-center">
                    <Input
                        type="color"
                        value={hexColor}
                        onChange={(e) => setHexColor(e.target.value)}
                        className="w-14 h-14 p-1 cursor-pointer"
                    />
                    <Input
                        value={hexColor}
                        onChange={(e) => setHexColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 uppercase"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        title="A cor deve ser um código hex válido (ex: #FF0000)"
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar'}
                </Button>
            </div>
        </form>
    );
};

export default StoreColors;
