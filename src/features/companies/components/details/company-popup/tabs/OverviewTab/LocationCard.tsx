// AIDEV-NOTE: Card de informações de localização da empresa com funcionalidade de edição

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Edit2 } from "lucide-react";
import { useCompanyLocation, useCompanyLocationEdit } from "../../hooks/index";
import { hasLocationInfo } from "../../utils";
import { Company } from "../../types";
import { Button } from "@/components/ui/button";
import LocationEditor from "./LocationEditor";

interface LocationCardProps {
  company: Company | null;
}

/**
 * Componente que exibe as informações de localização da empresa com opção de edição
 */
const LocationCard = ({ company }: LocationCardProps) => {
  const { data: location, isLoading } = useCompanyLocation(company?.id);
  const {
    locationData,
    setLocationData,
    isEditing,
    setIsEditing,
    isSaving,
    handleSave,
    handleCancel
  } = useCompanyLocationEdit(company?.id, location);

  if (!company) return null;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Localização</CardTitle>
        {!isEditing && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : isEditing ? (
          <LocationEditor
            locationData={locationData}
            setLocationData={setLocationData}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : hasLocationInfo(location) ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                {location?.street && (
                  <p className="text-sm">
                    {location.street}
                    {location.number ? `, ${location.number}` : ""}
                  </p>
                )}
                
                {location?.complement && (
                  <p className="text-sm text-muted-foreground">
                    {location.complement}
                  </p>
                )}
                
                {location?.neighborhood && (
                  <p className="text-sm">{location.neighborhood}</p>
                )}
                
                {(location?.city || location?.state) && (
                  <p className="text-sm">
                    {location.city ? location.city : ""}
                    {location.city && location.state ? " - " : ""}
                    {location.state ? location.state : ""}
                  </p>
                )}
                
                {location?.zip_code && (
                  <p className="text-sm">{location.zip_code}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma informação de localização disponível
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationCard;