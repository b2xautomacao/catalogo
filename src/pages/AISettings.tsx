import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Settings as SettingsIcon } from "lucide-react";
import AIProviderSettings from "@/components/settings/AIProviderSettings";

const AISettings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Configurações de IA
          </h1>
          <p className="text-gray-600">
            Configure provedores de inteligência artificial para o sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">IA Global</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-purple-600" />
            Provedores de IA
          </CardTitle>
          <CardDescription>
            Configure OpenAI, Google Gemini, Anthropic Claude e APIs
            customizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIProviderSettings />
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
