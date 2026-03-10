import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { LayoutGrid, Plus, Minus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useStoreGrades, StoreGrade } from '@/hooks/useStoreGrades';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const commonSizes = [
    "17/18", "19/20", "21/22", "23/24", "25/26", "26/27", "28/29", "30/31", "32/33",
    "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45",
    "PP", "P", "M", "G", "GG", "XG", "XXG"
];

const StoreGrades: React.FC = () => {
    const { grades, loading, fetchGrades, deleteGrade } = useStoreGrades();
    const { toast } = useToast();
    const { profile } = useAuth();

    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<StoreGrade | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return grades;
        return grades.filter(g => g.name.toLowerCase().includes(q));
    }, [grades, search]);

    const handleDelete = async (grade: StoreGrade) => {
        const confirmed = window.confirm(`Deseja realmente excluir a grade "${grade.name}"?`);
        if (!confirmed) return;
        const { error } = await deleteGrade(grade.id);
        if (error) {
            toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a grade.', variant: 'destructive' });
        } else {
            toast({ title: 'Grade excluída', description: `A grade "${grade.name}" foi removida.` });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 bg-white rounded-lg border">
                <div className="flex items-center gap-4">
                    <LayoutGrid className="w-8 h-8 text-blue-600" />
                    <div>
                        <h2 className="text-lg font-semibold">Grades de Tamanho</h2>
                        <p className="text-gray-600">Gerencie modelos de grades para aplicar rapidamente aos seus produtos</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar grades..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 w-[260px]"
                        />
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Grade
                    </Button>
                </div>
            </div>

            <Card className="card-modern">
                <CardHeader>
                    <CardTitle>Grades Cadastradas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">Nenhuma grade encontrada. Adicione uma nova grade para começar.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filtered.map((grade) => {
                                const totalPairs = grade.default_quantities.reduce((a, b) => a + b, 0);

                                return (
                                    <div key={grade.id} className="p-4 rounded-lg border bg-white hover:shadow-sm transition flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{grade.name}</h3>
                                                <p className="text-sm text-gray-500">{totalPairs} pares totais</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => setEditing(grade)}>
                                                    <Pencil className="h-4 w-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(grade)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded p-2 flex flex-wrap gap-2 text-sm">
                                            {grade.sizes.map((size, idx) => (
                                                <div key={idx} className="flex items-center gap-1 bg-white border px-2 py-1 rounded">
                                                    <span className="font-medium text-gray-700">{size}</span>
                                                    <span className="text-gray-400 text-xs">x{grade.default_quantities[idx]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Nova Grade</DialogTitle>
                    </DialogHeader>
                    {profile?.store_id && (
                        <GradeEditForm
                            storeId={profile.store_id}
                            onClose={() => setIsCreateOpen(false)}
                            onSaved={() => {
                                setIsCreateOpen(false);
                                fetchGrades();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(o) => (!o ? setEditing(null) : undefined)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Grade</DialogTitle>
                    </DialogHeader>
                    {editing && profile?.store_id && (
                        <GradeEditForm
                            storeId={profile.store_id}
                            initialData={editing}
                            onClose={() => setEditing(null)}
                            onSaved={() => {
                                setEditing(null);
                                fetchGrades();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface SizePairConfig {
    size: string;
    pairs: number;
}

interface GradeEditFormProps {
    storeId: string;
    initialData?: StoreGrade;
    onClose: () => void;
    onSaved: () => void;
}

const GradeEditForm: React.FC<GradeEditFormProps> = ({ storeId, initialData, onClose, onSaved }) => {
    const { createGrade, updateGrade } = useStoreGrades();
    const { toast } = useToast();

    const [name, setName] = useState(initialData?.name || '');

    const defaultConfigs = initialData ?
        initialData.sizes.map((size, index) => ({ size, pairs: initialData.default_quantities[index] })) :
        [];

    const [sizePairConfigs, setSizePairConfigs] = useState<SizePairConfig[]>(defaultConfigs);
    const [saving, setSaving] = useState(false);

    const addSizePair = () => {
        const availableSizes = commonSizes.filter(
            (size) => !sizePairConfigs.some((config) => config.size === size)
        );

        if (availableSizes.length > 0) {
            setSizePairConfigs((prev) => [
                ...prev,
                { size: availableSizes[0], pairs: 1 },
            ]);
        } else {
            setSizePairConfigs((prev) => [
                ...prev,
                { size: "Novo", pairs: 1 }, // Fallback if all standard exhausted
            ]);
        }
    };

    const removeSizePair = (index: number) => {
        setSizePairConfigs((prev) => prev.filter((_, i) => i !== index));
    };

    const updateSizePair = (index: number, field: keyof SizePairConfig, value: string | number) => {
        setSizePairConfigs((prev) =>
            prev.map((config, i) =>
                i === index ? { ...config, [field]: value } : config
            )
        );
    };

    const adjustPairs = (index: number, delta: number) => {
        setSizePairConfigs((prev) =>
            prev.map((config, i) =>
                i === index
                    ? { ...config, pairs: Math.max(0, config.pairs + delta) }
                    : config
            )
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast({ title: 'Aviso', description: 'Informe o nome da grade.', variant: 'destructive' });
            return;
        }
        if (sizePairConfigs.length === 0) {
            toast({ title: 'Aviso', description: 'Adicione pelo menos um tamanho.', variant: 'destructive' });
            return;
        }

        setSaving(true);
        let error;

        const sizes = sizePairConfigs.map(c => c.size);
        const default_quantities = sizePairConfigs.map(c => c.pairs);

        if (initialData) {
            const result = await updateGrade(initialData.id, {
                name: name.trim(),
                sizes,
                default_quantities
            });
            error = result.error;
        } else {
            const result = await createGrade({
                store_id: storeId,
                name: name.trim(),
                sizes,
                default_quantities,
                is_active: true,
            });
            error = result.error;
        }

        setSaving(false);

        if (error) {
            toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
        } else {
            toast({ title: 'Grade salva', description: `A grade "${name}" foi salva com sucesso.` });
            onSaved();
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 mt-4">
            <div className="space-y-2">
                <Label>Nome da Grade</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Grade Feminina Verão"
                    autoFocus
                    required
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Tamanhos e Pares</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSizePair}>
                        <Plus className="w-4 h-4 mr-1" /> Adicionar Tamanho
                    </Button>
                </div>

                {sizePairConfigs.length === 0 && (
                    <div className="text-center py-6 bg-gray-50 border border-dashed rounded-lg text-gray-500">
                        Nenhum tamanho configurado. Adicione acima.
                    </div>
                )}

                <div className="space-y-3">
                    {sizePairConfigs.map((config, index) => (
                        <div key={index} className="flex flex-wrap items-center gap-4 p-3 border rounded-lg bg-gray-50">
                            <div className="flex-1 min-w-[120px]">
                                <Label className="text-xs mb-1 block">Tamanho</Label>
                                <select
                                    value={config.size}
                                    onChange={(e) => updateSizePair(index, "size", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-white text-sm"
                                >
                                    {!commonSizes.includes(config.size) && (
                                        <option value={config.size}>{config.size}</option>
                                    )}
                                    {commonSizes.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-[2] min-w-[150px]">
                                <Label className="text-xs mb-1 block">Pares Padrão</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => adjustPairs(index, -1)}
                                        disabled={config.pairs <= 0}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input
                                        type="number"
                                        value={config.pairs}
                                        onChange={(e) => updateSizePair(index, "pairs", parseInt(e.target.value) || 0)}
                                        className="w-20 text-center text-sm"
                                        min="0"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => adjustPairs(index, 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSizePair(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : 'Salvar'}
                </Button>
            </div>
        </form>
    );
};

export default StoreGrades;
