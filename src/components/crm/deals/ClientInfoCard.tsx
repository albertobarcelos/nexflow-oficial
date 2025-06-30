import ReactToyFace from "react-toy-face";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail } from "lucide-react";
import type { MockDeal } from "./DealViewDialog";

// Client Info Card Component
export function ClientInfoCard({ deal }: { deal: MockDeal }) {
    // Deterministic toyNumber based on deal.id
    const toyNumber = 1 + ((Array.from(deal.id) as string[]).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 18);
    const avatarUrl = ``;
    return (
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold p-0">
                            <ReactToyFace size={32} toyNumber={toyNumber} rounded={8} />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-slate-800 ">{deal.title}</h3>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate font-medium">João Silva</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">+55 11 99999-9999</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Mail className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">joao@empresa.com</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}