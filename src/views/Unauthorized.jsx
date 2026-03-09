import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <ShieldX size={64} className="mx-auto text-red-500" />
        <h1 className="text-3xl font-bold">Acceso Denegado</h1>
        <p className="text-gray-500">
          No tienes permisos para acceder a esta página
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
