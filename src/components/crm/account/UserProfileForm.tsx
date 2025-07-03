import ReactToyFace from "react-toy-face";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/profile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, RefreshCw, CheckCircle2 } from "lucide-react";

interface UserProfileFormProps {
    user: UserProfile;
    onSave: (data: { first_name?: string; last_name?: string; email?: string; avatar_file?: File | null; avatar_seed?: string; avatar_type?: string; custom_avatar_url?: string | null }) => Promise<void>;
    isLoading: boolean;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
    user,
    onSave,
    isLoading,
}) => {
    const [firstName, setFirstName] = useState(user.first_name || "");
    const [lastName, setLastName] = useState(user.last_name || "");
    const [email, setEmail] = useState(user.email ?? "");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        (user as any).custom_avatar_url ?? null
    );
    const [avatarSeed, setAvatarSeed] = useState<string>(
        (user as any).avatar_seed ?? "1|1"
    );
    const [avatarType, setAvatarType] = useState<string>(
        (user as any).avatar_type ?? "toy_face"
    );
    const [pickerOpen, setPickerOpen] = useState(false);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setEmail(user.email || "");
        setAvatarPreview((user as any).custom_avatar_url ?? null);
        setAvatarSeed((user as any).avatar_seed ?? "1|1");
        setAvatarType((user as any).avatar_type ?? "toy_face");
    }, [user]);

    const handleAvatarChange = (file: File | null, url: string | null) => {
        setAvatarFile(file);
        setUploadPreview(url);
        setAvatarType("custom");
        setAvatarPreview(url);
    };

    const handleToyFaceSelect = (seed: string) => {
        setAvatarSeed(seed);
        setAvatarType("toy_face");
        setAvatarFile(null);
        setAvatarPreview(null);
        setUploadPreview(null);
        setPickerOpen(false);
        onSave({ first_name: firstName, last_name: lastName, email, avatar_seed: seed, avatar_type: "toy_face", custom_avatar_url: null });
    };

    const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            handleAvatarChange(file, url);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({ first_name: firstName, last_name: lastName, email, avatar_file: avatarFile, avatar_seed: avatarSeed, avatar_type: avatarType, custom_avatar_url: avatarType === "custom" ? avatarPreview : null });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    // ToyFace preview logic
    const [previewSeed, setPreviewSeed] = useState<string>(avatarSeed || "1|1");
    useEffect(() => {
        if (pickerOpen) setPreviewSeed(avatarSeed || "1|1");
    }, [pickerOpen, avatarSeed]);
    const handleRandomToyFace = () => {
        const totalNumber = Math.floor(Math.random() * 36) + 1;
        const group = totalNumber <= 18 ? 1 : 2;
        const toyNumber = totalNumber <= 18 ? totalNumber : totalNumber - 18;
        setPreviewSeed(`${toyNumber}|${group}`);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground">Dados do usuário</h2>
                <p className="text-sm text-muted-foreground">
                    Gerencie seu perfil com segurança.
                </p>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center space-x-4">
                    {avatarType === "custom" && avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-gray-50">
                            <ReactToyFace
                                size={96}
                                toyNumber={parseInt((avatarSeed + "").split("|")[0]) || 1}
                                group={parseInt((avatarSeed + "").split("|")[1]) || 1}
                                rounded={48}
                            />
                        </div>
                    )}
                    <Button type="button" className="bg-primary text-white" onClick={() => setPickerOpen(true)}>
                        Trocar avatar
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="first-name">Nome</Label>
                        <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="last-name">Sobrenome</Label>
                        <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                </div>

                <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full mt-4">
                    {isLoading ? "Salvando..." : "Salvar alterações"}
                </Button>
                {success && (
                    <div className="flex items-center justify-center mt-2 text-green-600 gap-2 animate-fade-in">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Perfil salvo com sucesso</span>
                    </div>
                )}
            </form>

            {/* Avatar Picker Dialog */}
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Escolha um avatar</DialogTitle>
                        <DialogDescription>
                            Escolha um ToyFace ou envie uma foto personalizada.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="toy">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="toy">Toy Face</TabsTrigger>
                            <TabsTrigger value="custom">Personalizado</TabsTrigger>
                        </TabsList>
                        <TabsContent value="toy" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div key={`preview-${previewSeed}`}>
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center bg-gray-50">
                                        <ReactToyFace
                                            size={96}
                                            toyNumber={parseInt((previewSeed + "").split("|")[0]) || 1}
                                            group={parseInt((previewSeed + "").split("|")[1]) || 1}
                                            rounded={48}
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRandomToyFace}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button className="w-full" onClick={() => handleToyFaceSelect(previewSeed)}>
                                Usar este ToyFace
                            </Button>
                        </TabsContent>
                        <TabsContent value="custom" className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                {uploadPreview ? (
                                    <img src={uploadPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg text-muted-foreground">
                                        <Upload className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="avatar-upload"
                                        onChange={handleCustomUpload}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => document.getElementById("avatar-upload")?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Fazer upload
                                    </Button>
                                </div>
                                {uploadPreview && (
                                    <Button className="w-full" onClick={() => {
                                        setPickerOpen(false);
                                        onSave({ first_name: firstName, last_name: lastName, email, avatar_file: avatarFile, avatar_type: "custom", custom_avatar_url: uploadPreview });
                                    }}>
                                        Usar esta foto
                                    </Button>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
};
