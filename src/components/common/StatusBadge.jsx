const statusConfig = {
  PENDIENTE: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  EN_PROCESO: {
    label: "En Proceso",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  TERMINADO: {
    label: "Terminado",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELADO: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
