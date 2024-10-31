import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle, CoinsIcon, Package, ShoppingCart } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
// import { useSocketStore } from "@/components/Context/ContextConection";
const API_URL = import.meta.env.VITE_API_URL;

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocket } from "@/components/Context/SocketContext";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
  sucursal: { nombre: string };
}

interface Solicitud {
  id: number;
  productoId: number;
  precioSolicitado: number;
  solicitadoPorId: number;
  estado: EstadoPrecio;
  aprobadoPorId: number | null;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
  producto: Producto;
  solicitadoPor: Usuario;
}

enum EstadoSolicitudTransferencia {
  PENDIENTE,
  APROBADO,
  RECHAZADO,
}

interface Producto {
  nombre: string;
}

interface SucursalDestino {
  nombre: string;
}

interface SucursalOrigen {
  nombre: string;
}

enum Rol {
  ADMIN,
  MANAGER,
  VENDEDOR,
  SUPER_ADMIN,
}

interface UsuarioSolicitante {
  rol: Rol;
  nombre: string;
}

export interface SolicitudTransferencia {
  id: number;
  productoId: number;
  producto: Producto;
  sucursalDestino: SucursalDestino;
  sucursalOrigen: SucursalOrigen;
  usuarioSolicitante: UsuarioSolicitante;
  cantidad: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  usuarioSolicitanteId: number | null;
  estado: EstadoSolicitudTransferencia;
  fechaSolicitud: string;
  fechaAprobacion: string | null;
  administradorId: number | null;
}

enum EstadoPrecio {
  APROBADO = "APROBADO",
  PENDIENTE = "PENDIENTE",
  RECHAZADO = "RECHAZADO",
}

export default function Dashboard() {
  dayjs.extend(localizedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale("es");
  const formatearFecha = (fecha: string) => {
    let nueva_fecha = dayjs(fecha).format("DD MMMM YYYY, hh:mm:ss A");
    return nueva_fecha;
  };

  const sucursalId = useStore((state) => state.sucursalId);
  const userID = useStore((state) => state.userId);

  // Datos de ejemplo para los gráficos y tablas
  const salesData = [
    { name: "Lun", ventas: 4000 },
    { name: "Mar", ventas: 3000 },
    { name: "Mié", ventas: 2000 },
    { name: "Jue", ventas: 2780 },
    { name: "Vie", ventas: 1890 },
    { name: "Sáb", ventas: 2390 },
    { name: "Dom", ventas: 3490 },
  ];

  const topProducts = [
    { name: "Producto A", ventas: 120 },
    { name: "Producto B", ventas: 80 },
    { name: "Producto C", ventas: 70 },
    { name: "Producto D", ventas: 50 },
    { name: "Producto E", ventas: 30 },
  ];

  const lowStockProducts = [
    { name: "Producto X", stock: 5 },
    { name: "Producto Y", stock: 3 },
    { name: "Producto Z", stock: 2 },
  ];

  const recentTransactions = [
    { id: "001", product: "Producto A", amount: 50, date: "2023-06-15" },
    { id: "002", product: "Producto B", amount: 30, date: "2023-06-15" },
    { id: "003", product: "Producto C", amount: 70, date: "2023-06-14" },
  ];

  const [ventasMes, setVentasMes] = useState(0);
  const [ventasSemana, setVentasSemana] = useState(0);
  const [ventasDia, setVentasDia] = useState(0);

  const getInfo = async () => {
    try {
      // Realiza las tres peticiones en paralelo
      const [ventasMes, ventasDia, ventasSemana] = await Promise.all([
        axios.get(`${API_URL}/analytics/get-ventas/mes/${sucursalId}`),
        axios.get(`${API_URL}/analytics/get-ventas/dia/${sucursalId}`),
        axios.get(`${API_URL}/analytics/get-ventas/semana/${sucursalId}`),
      ]);

      // Accede a los datos de cada respuesta
      console.log("Ventas del mes:", ventasMes.data);
      console.log("Ventas del día:", ventasDia.data);
      console.log("Ventas de la semana:", ventasSemana.data);

      // Si necesitas combinar la información de alguna manera, puedes hacerlo aquí
      setVentasMes(ventasMes.data);
      setVentasSemana(ventasSemana.data);
      setVentasDia(ventasDia.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      // Maneja los errores aquí
      toast.error("Error al recuperar informacion de ventas del servidor");
    }
  };

  // Llamar a la función
  useEffect(() => {
    if (sucursalId) {
      getInfo();
    }
  }, [sucursalId]);

  //==============================================>
  // SOLICITUDES DE PRECIO
  const getSolicitudes = async () => {
    try {
      const response = await axios.get(`${API_URL}/price-request`);
      if (response.status === 200) {
        setSolicitudes(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes");
    }
  };

  //=======================================================>

  // SOLICITUDES DE TRANSFERENCIA PRODUCTO
  const getSolicitudesTransferencia = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/solicitud-transferencia-producto`
      );
      if (response.status === 200) {
        setSolicitudesTransferencia(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes de transferencia");
    }
  };

  useEffect(() => {
    // const getSolicitudes = async () => {
    //   try {
    //     const response = await axios.get(`${API_URL}/price-request`);
    //     if (response.status === 200) {
    //       setSolicitudes(response.data);
    //     }
    //   } catch (error) {
    //     console.log(error);
    //     toast.error("Error al conseguir solicitudes");
    //   }
    // };
    getSolicitudes();
  }, []);

  useEffect(() => {
    getSolicitudesTransferencia();
  }, []);

  const [openAcept, setOpenAcept] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const handleAceptRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/acept-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.success("Petición aceptada, precio concedido");
        setOpenAcept(false); // Close dialog upon success
        getSolicitudes();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  const handleRejectRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/reject-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.warning("Petición rechazada");
        setOpenAcept(false); // Close dialog upon success
        setOpenReject(false);
        getSolicitudes();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  const socket = useSocket();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  useEffect(() => {
    if (socket) {
      const handleSolicitud = (solicitudNueva: Solicitud) => {
        setSolicitudes((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };

      // Escucha el evento
      socket.on("recibirSolicitud", handleSolicitud);

      // Limpia el listener al desmontar
      return () => {
        socket.off("recibirSolicitud", handleSolicitud);
      };
    }
  }, [socket]);

  const [solicitudesTransferencia, setSolicitudesTransferencia] = useState<
    SolicitudTransferencia[]
  >([]);

  useEffect(() => {
    if (socket) {
      const handleSolicitud = (solicitudNueva: SolicitudTransferencia) => {
        setSolicitudesTransferencia((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };

      // Escucha el evento
      socket.on("recibirSolicitudTransferencia", handleSolicitud);

      // Limpia el listener al desmontar
      return () => {
        socket.off("recibirSolicitudTransferencia", handleSolicitud);
      };
    }
  }, [socket]);

  console.log("Las solicitudes son: ", solicitudes);
  console.log("Las solicitudes de transferencia: ", solicitudesTransferencia);

  const [openAceptarTransferencia, setOpenAceptarTransferencia] =
    useState(false);
  const [openRechazarTransferencia, setOpenRechazarTransferencia] =
    useState(false);

  // Funciones para manejar aceptar y rechazar en el card de transferencia
  const handleAceptarTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    console.log(
      `Aceptada la solicitud de transferencia con ID: ${idSolicitudTransferencia} y User ID: ${userID}`
    );

    try {
      // Realiza la llamada al backend usando axios
      const response = await axios.post(
        `${API_URL}/solicitud-transferencia-producto/aceptar`,
        {
          idSolicitudTransferencia,
          userID,
        }
      );

      console.log("Respuesta del servidor:", response.data);
      toast.success("Tranferencia completada");
      getSolicitudesTransferencia();
      // Puedes mostrar una notificación de éxito aquí
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
      // Puedes mostrar una notificación de error aquí
    } finally {
      setOpenAceptarTransferencia(false);
    }
  };

  const handleRejectTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    console.log(
      `Aceptada la solicitud de transferencia con ID: ${idSolicitudTransferencia} y User ID: ${userID}`
    );

    try {
      // Realiza la llamada al backend usando axios
      const response = await axios.delete(
        `${API_URL}/solicitud-transferencia-producto/rechazar/${idSolicitudTransferencia}/${userID}`
      );

      if (response.status === 200) {
        toast.warning("Solicitu de transferencia rechazada");
        getSolicitudesTransferencia();
      }

      // Puedes mostrar una notificación de éxito aquí
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
      // Puedes mostrar una notificación de error aquí
    }
  };

  // const handleRechazarTransferencia = (id: number) => {
  //   console.log(`Rechazada la solicitud de transferencia con ID: ${id}`);
  //   setOpenRechazarTransferencia(false);
  // };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard de Administrador</h1>

      {/* Resumen de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del mes{" "}
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-GT", {
                style: "currency",
                currency: "GTQ",
              }).format(ventasMes)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos de la semana
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-GT", {
                style: "currency",
                currency: "GTQ",
              }).format(ventasSemana)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del dia{" "}
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-GT", {
                style: "currency",
                currency: "GTQ",
              }).format(ventasDia)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MOSTRAR LAS SOLICITUDES DE PRECIO */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            Solicitud de Precio Especial
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {solicitudes && solicitudes.length > 0 ? (
            solicitudes.map((soli) => (
              <Card key={soli.id} className="m-4 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Solicitud de Precio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-cyan-500">
                    Estado: <strong>{soli.estado}</strong>
                  </p>
                  <p className="text-sm mt-1">
                    Producto: <strong>{soli.producto.nombre}</strong> -{" "}
                    {soli.producto.descripcion}
                  </p>
                  <p className="text-sm">
                    Solicitado por: <strong>{soli.solicitadoPor.nombre}</strong>
                    ({soli.solicitadoPor.rol}) de{" "}
                    <strong>{soli.solicitadoPor.sucursal.nombre}</strong>
                  </p>
                  <p className="text-sm">
                    Precio solicitado:{" "}
                    <strong>
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(soli.precioSolicitado)}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha de solicitud: {formatearFecha(soli.fechaSolicitud)}
                  </p>

                  {soli.fechaRespuesta && (
                    <p className="text-sm text-gray-500">
                      Fecha de respuesta:{" "}
                      {new Date(soli.fechaRespuesta).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setOpenAcept(true)}
                      variant={"default"}
                    >
                      Aceptar
                    </Button>

                    <Dialog open={openAcept} onOpenChange={setOpenAcept}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Aceptar solicitud de precio
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Al aceptar la solicitud se creará una instancia de
                            precio que solo se podrá usar una vez para este
                            producto.
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            className="w-full"
                            onClick={() => handleAceptRequest(soli.id)}
                          >
                            Aceptar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => setOpenReject(true)}
                      variant={"destructive"}
                    >
                      Rechazar
                    </Button>

                    <Dialog open={openReject} onOpenChange={setOpenReject}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Aceptar solicitud de precio
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Se le negará este precio a la sucursal
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={"destructive"}
                            className="w-full"
                            onClick={() => handleRejectRequest(soli.id)}
                          >
                            Si, continuar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No hay solicitudes de precio.
            </p>
          )}
        </CardContent>
      </Card>

      {/* MOSTRAS LAS SOLICITUDES DE TRANSFERENCIA */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            Solicitudes de Transferencia de Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {solicitudesTransferencia && solicitudesTransferencia.length > 0 ? (
            solicitudesTransferencia.map((soli) => (
              <Card key={soli.id} className="m-4 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Solicitud de Transferencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-cyan-500">
                    Estado: <strong>{soli.estado}</strong>
                  </p>
                  <p className="text-sm mt-1">
                    Producto: <strong>{soli.producto.nombre}</strong>
                  </p>
                  <p className="text-sm">
                    Solicitado por:{" "}
                    <strong>
                      {soli.usuarioSolicitante.nombre} (
                      {soli.usuarioSolicitante.rol})
                    </strong>
                  </p>
                  <p className="text-sm">
                    Cantidad solicitada: <strong>{soli.cantidad}</strong>
                  </p>
                  <p className="text-sm">
                    Sucursal Origen:{" "}
                    <strong>{soli.sucursalOrigen.nombre}</strong>
                  </p>
                  <p className="text-sm">
                    Sucursal Destino:{" "}
                    <strong>{soli.sucursalDestino.nombre}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha de solicitud: {formatearFecha(soli.fechaSolicitud)}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setOpenAceptarTransferencia(true)}
                      variant={"default"}
                    >
                      Aceptar
                    </Button>

                    <Dialog
                      open={openAceptarTransferencia}
                      onOpenChange={setOpenAceptarTransferencia}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Aceptar solicitud de Transferencia
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Se le descontará stock a la sucursal de origen y se
                            asignará a la sucursal de destino.
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            className="w-full"
                            onClick={() => handleAceptarTransferencia(soli.id)}
                          >
                            Sí, transferir producto
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => setOpenRechazarTransferencia(true)}
                      variant={"destructive"}
                    >
                      Rechazar
                    </Button>

                    <Dialog
                      open={openRechazarTransferencia}
                      onOpenChange={setOpenRechazarTransferencia}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Rechazar transferencia de producto
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Se negará esta transferencia.
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={"destructive"}
                            className="w-full"
                            onClick={() => handleRejectTransferencia(soli.id)}
                          >
                            Sí, negar y continuar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500">
              No hay solicitudes de transferencia.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de ventas */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Ventas de la Semana</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ventas" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Productos e inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.ventas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Inventario Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Actividades recientes y Calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Transacciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.id}</TableCell>
                    <TableCell>{transaction.product}</TableCell>
                    <TableCell>Q{transaction.amount}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>
            <ShoppingCart className="mr-2 h-4 w-4" /> Nueva Venta
          </Button>
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" /> Agregar Producto
          </Button>
          <Button variant="outline">
            <AlertCircle className="mr-2 h-4 w-4" /> Reportar Problema
          </Button>
        </CardContent>
      </Card>

      {/* Notificaciones y alertas */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Notificaciones y Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center text-yellow-600">
              <AlertCircle className="mr-2 h-4 w-4" />
              Inventario bajo para Producto X
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Configuraciones y gestión de la tienda */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Configuraciones y Gestión</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button variant="outline">Gestión de Empleados</Button>
          <Button variant="outline">Configuración de Productos</Button>
        </CardContent>
      </Card>
    </div>
  );
}
