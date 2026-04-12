import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  Facebook,
  Instagram,
  MessageCircle,
  Package,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/common/Seo";

const highlights = [
  "Cajas y empaques personalizados en papel y cartón.",
  "Soluciones para negocios que buscan presentación y funcionalidad.",
  "Presencia empresarial en Neiva, Huila.",
];

const solutions = [
  {
    icon: <Box className="h-6 w-6" />,
    title: "Cajas personalizadas",
    description:
      "Desarrollamos empaques en papel y cartón adaptados a la presentación, protección y estilo de cada producto.",
  },
  {
    icon: <UtensilsCrossed className="h-6 w-6" />,
    title: "Empaques para alimentos",
    description:
      "Opciones funcionales para negocios que necesitan empaques prácticos, visuales y alineados con su marca.",
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    title: "Empaques para retail",
    description:
      "Soluciones orientadas a joyería, belleza y otras líneas comerciales que requieren una mejor presentación.",
  },
];

const categories = [
  "Empaques en papel y cartón",
  "Cajas para productos",
  "Presentación para alimentos",
  "Soluciones gráficas comerciales",
];

const processSteps = [
  {
    number: "01",
    title: "Cuéntanos qué necesitas",
    description:
      "Recibimos la idea, el tipo de producto y el uso esperado del empaque o pieza gráfica.",
  },
  {
    number: "02",
    title: "Definimos formato y propuesta",
    description:
      "Aterrizamos materiales, dimensiones, personalización y orientación visual según la necesidad.",
  },
  {
    number: "03",
    title: "Producción y entrega",
    description:
      "Desarrollamos la solución acordada para que tu negocio tenga una presentación más sólida y profesional.",
  },
];

const Landing = () => {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Prograficos S.A.S.",
      alternateName: "Prograficos",
      description:
        "Empresa de soluciones gráficas y empaques en papel y cartón en Neiva, Huila.",
      logo: new URL("/logo_pr.png", window.location.origin).href,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Neiva",
        addressRegion: "Huila",
        addressCountry: "CO",
      },
      areaServed: {
        "@type": "Place",
        name: "Neiva, Huila y Colombia",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Prograficos S.A.S.",
      url: window.location.origin,
      inLanguage: "es-CO",
    },
  ];

  return (
    <>
      <Seo
        title="Prograficos S.A.S. | Cajas, empaques y soluciones gráficas"
        description="Landing corporativa de Prograficos S.A.S. enfocada en cajas, empaques personalizados y soluciones gráficas en papel y cartón en Neiva, Huila."
        keywords="Prograficos, Prograficos SAS, empaques personalizados, cajas en carton, cajas personalizadas, soluciones graficas, Neiva, Huila, empaques en papel"
        structuredData={structuredData}
      />

      <main className="min-h-screen overflow-hidden bg-[#eef3eb] text-slate-900">
        <section className="relative isolate">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,207,69,0.30),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(19,82,154,0.24),_transparent_30%),linear-gradient(180deg,_#f6f8f2_0%,_#eef3eb_100%)]" />
          <div className="absolute left-[-10rem] top-24 h-72 w-72 rounded-full bg-[#a8cf45]/20 blur-3xl" />
          <div className="absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-[#13529a]/15 blur-3xl" />

          <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-16 pt-6 lg:px-10">
            <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 py-3 shadow-[0_12px_50px_rgba(15,63,119,0.08)] backdrop-blur">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo_login.svg"
                  alt="Prograficos"
                  className="h-9 w-auto md:h-10"
                />
              </Link>

              <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
                <a href="#empresa" className="transition hover:text-[#13529a]">
                  Empresa
                </a>
                <a
                  href="#soluciones"
                  className="transition hover:text-[#13529a]"
                >
                  Soluciones
                </a>
                <a href="#proceso" className="transition hover:text-[#13529a]">
                  Proceso
                </a>
                <a href="#contacto" className="transition hover:text-[#13529a]">
                  Contacto
                </a>
              </nav>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#13529a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f3f77]"
              >
                Ingresar
              </Link>
            </header>

            <div className="grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#a8cf45]/50 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <Building2 className="h-4 w-4 text-[#13529a]" />
                  Neiva, Huila
                </div>

                <h1 className="mt-6 max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-slate-950 md:text-6xl">
                  Cajas y empaques personalizados en papel y cartón para tu
                  negocio
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                  En Prograficos S.A.S. desarrollamos soluciones gráficas y de
                  empaque para marcas que buscan presentación, personalización y
                  funcionalidad en sus productos.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <a
                    href="#contacto"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#a8cf45] px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-[#98bf39]"
                  >
                    Solicitar cotización
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href="#soluciones"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/85 px-6 py-3 text-base font-semibold text-slate-900 transition hover:border-[#13529a] hover:text-[#13529a]"
                  >
                    Ver soluciones
                  </a>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {highlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-white/70 bg-white/80 p-4 text-sm leading-6 text-slate-700 shadow-[0_16px_50px_rgba(19,82,154,0.08)] backdrop-blur"
                    >
                      <CheckCircle2 className="mb-3 h-5 w-5 text-[#13529a]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-8 top-10 hidden h-36 w-36 rounded-full border border-[#a8cf45]/50 bg-white/60 blur-[1px] md:block" />
                <div className="relative rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_30px_120px_rgba(15,63,119,0.35)]">
                  <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(19,82,154,0.96),_rgba(9,28,52,0.98))] p-8">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/75">
                        Prograficos
                      </span>
                      <img
                        src="/logo_pr.png"
                        alt="Icono Prograficos"
                        className="h-14 w-14 rounded-2xl bg-white/10 p-2"
                      />
                    </div>

                    <div className="mt-10 space-y-4">
                      <p className="text-sm uppercase tracking-[0.3em] text-[#a8cf45]">
                        Empaques y piezas gráficas
                      </p>
                      <h2 className="text-3xl font-semibold leading-tight">
                        Una presencia digital clara para mostrar lo que hace tu
                        empresa
                      </h2>
                      <p className="max-w-md text-sm leading-7 text-white/78">
                        Cajas, empaques y soluciones visuales pensadas para
                        marcas que necesitan presentación profesional y una
                        mejor imagen comercial.
                      </p>
                    </div>

                    <div className="mt-10 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/65">Línea principal</p>
                        <p className="mt-2 text-xl font-semibold">
                          Papel y cartón
                        </p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/8 p-4">
                        <p className="text-sm text-white/65">Aplicación</p>
                        <p className="mt-2 text-xl font-semibold">
                          Empaque personalizado
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="empresa"
          className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10"
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#13529a]">
                Empresa
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Una marca enfocada en empaques, presentación y soluciones
                gráficas
              </h2>
            </div>

            <div className=" text-lg  text-slate-700">
              <p>
                Prograficos S.A.S. proyecta una propuesta orientada a empaques
                en papel y cartón, cajas personalizadas y piezas gráficas para
                distintos usos comerciales.
              </p>
            </div>
          </div>
        </section>

        <section id="soluciones" className="bg-white/70 py-20">
          <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#13529a]">
                Soluciones
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Presentamos lo que la marca puede comunicar mejor desde su sitio
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {solutions.map(({ icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-[2rem] border border-slate-200/70 bg-white p-7 shadow-[0_18px_60px_rgba(15,63,119,0.08)]"
                >
                  <div className="inline-flex rounded-2xl bg-[#13529a]/10 p-3 text-[#13529a]">
                    {icon}
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-slate-700">
                    {description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-12 rounded-[2rem] border border-slate-200/70 bg-[#f9fbf7] p-8">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-[#13529a]" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#13529a]">
                  Líneas de trabajo
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-6 lg:px-10">
          <div className="mx-auto w-full max-w-7xl rounded-[2.2rem] border border-[#13529a]/15 bg-[linear-gradient(135deg,_rgba(19,82,154,0.08),_rgba(168,207,69,0.12))] p-8 shadow-[0_18px_60px_rgba(15,63,119,0.08)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#13529a]">
                  Proximamente
                </p>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  Muy pronto lanzaremos nuestro portal de cliente para gestionar
                  tus productos con nosotros.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
                  Este nuevo espacio estara pensado para dar mas visibilidad al
                  estado de tus solicitudes, organizar referencias de productos
                  y fortalecer la relacion comercial de forma mas agil.
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a8cf45]">
                  Lo que viene
                </p>
                <div className="mt-5 space-y-3 text-slate-700">
                  <p className="rounded-2xl bg-[#f5f9ef] px-4 py-3">
                    Consulta de productos y referencias activas.
                  </p>
                  <p className="rounded-2xl bg-[#f5f9ef] px-4 py-3">
                    Seguimiento mas claro de la gestion con Prograficos.
                  </p>
                  <p className="rounded-2xl bg-[#f5f9ef] px-4 py-3">
                    Un canal digital mas comodo para tus solicitudes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="proceso"
          className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#13529a]">
              Proceso
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Una forma simple de explicar cómo inicia un proyecto
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {processSteps.map((step) => (
              <article
                key={step.number}
                className="rounded-[2rem] border border-slate-200 bg-[#f9fbf7] p-7"
              >
                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-[#a8cf45]">
                  {step.number}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="contacto" className="px-6 pb-20 lg:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-[2.2rem] bg-[linear-gradient(135deg,_#0e213b,_#13529a_68%,_#1e70bc)] px-8 py-10 text-white shadow-[0_30px_90px_rgba(15,63,119,0.28)] md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#a8cf45]">
                Contacto comercial
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                ¿Buscas cajas o empaques personalizados para tu negocio?
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:prograficos@hotmail.com"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/16"
              >
                Escribir por correo
              </a>

              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-[#a8cf45] px-6 py-3 font-semibold text-slate-950 transition hover:bg-[#98bf39]"
              >
                Entrar al sistema
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200/80 bg-white/60 px-6 py-8 text-center text-sm text-slate-600 lg:px-10">
          <div className="mb-4 flex items-center justify-center gap-3">
            <a
              href="https://www.facebook.com/prograficosN"
              aria-label="Facebook Prograficos"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#13529a] transition hover:border-[#13529a] hover:bg-[#13529a] hover:text-white"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/prograficos_neiva/"
              aria-label="Instagram Prograficos"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#13529a] transition hover:border-[#13529a] hover:bg-[#13529a] hover:text-white"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://wa.me/573152791153"
              aria-label="WhatsApp Prograficos"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[#13529a] transition hover:border-[#13529a] hover:bg-[#13529a] hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} Prograficos S.A.S. Todos los derechos
            reservados.
          </p>
        </footer>
      </main>
    </>
  );
};

export default Landing;
