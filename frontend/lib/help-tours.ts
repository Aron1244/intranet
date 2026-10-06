import { driver } from "driver.js";

export type HelpTourId = "dashboard" | "conversations" | "publications" | "documents" | "trash";

type TourStep = {
  selector: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
};

const DASHBOARD_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='dashboard-greeting']",
    title: "Tu resumen diario",
    description:
      "Aqui veras un saludo personalizado y los accesos rapidos a mensajes y publicaciones.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='dashboard-stats']",
    title: "Indicadores clave",
    description:
      "Vista rapida de publicaciones, conversaciones y estado de tu sesion.",
    side: "bottom",
    align: "center",
  },
  {
    selector: "[data-tour-id='dashboard-feed']",
    title: "Publicaciones de tu equipo",
    description:
      "Aqui apareceran las novedades de tus departamentos. Puedes reaccionar o comentar.",
    side: "right",
    align: "start",
  },
  {
    selector: "[data-tour-id='dashboard-chats']",
    title: "Conversaciones recientes",
    description:
      "Accede rapido a tus chats activos sin salir del resumen.",
    side: "left",
    align: "center",
  },
];

const CONVERSATIONS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='conversations-list']",
    title: "Lista de conversaciones",
    description:
      "Aqui ves todas tus conversaciones. Selecciona una para abrirla en el panel de la derecha.",
    side: "right",
    align: "start",
  },
  {
    selector: "[data-tour-id='conversations-messages']",
    title: "Mensajes",
    description:
      "Aqui se cargan y envian los mensajes de la conversacion seleccionada.",
    side: "left",
    align: "start",
  },
  {
    selector: "[data-tour-id='conversations-composer']",
    title: "Escribir mensaje",
    description:
      "Escribe y envia mensajes. Tambien puedes adjuntar archivos.",
    side: "top",
    align: "end",
  },
];

const PUBLICATIONS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='publications-form']",
    title: "Crear publicacion",
    description:
      "Desde aqui puedes crear una nueva publicacion visible para tu departamento o toda la empresa.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='publications-list']",
    title: "Listado de publicaciones",
    description:
      "Aqui veras todas las publicaciones. Puedes editarlas o eliminarlas si tienes permisos.",
    side: "top",
    align: "start",
  },
];

const DOCUMENTS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='documents-search']",
    title: "Buscar documentos",
    description:
      "Filtra por nombre, tipo u origen para encontrar un documento especifico.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='documents-filters']",
    title: "Filtros rapidos",
    description:
      "Cambia entre Todos, Chat, Departamento u Otros para acotar la lista.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='documents-list']",
    title: "Lista de archivos",
    description:
      "Aqui aparecen los archivos. Usa el boton Descargar de cada tarjeta para obtenerlos.",
    side: "top",
    align: "start",
  },
];

const TRASH_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='trash-filters']",
    title: "Filtros",
    description: "Cambia entre Todo, Mensajes o Documentos segun lo que necesites revisar.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='trash-list']",
    title: "Elementos marcados",
    description:
      "Aqui ves los mensajes y documentos que los lideres marcaron para revision.",
    side: "top",
    align: "start",
  },
];

const TOURS: Record<HelpTourId, TourStep[]> = {
  dashboard: DASHBOARD_TOUR,
  conversations: CONVERSATIONS_TOUR,
  publications: PUBLICATIONS_TOUR,
  documents: DOCUMENTS_TOUR,
  trash: TRASH_TOUR,
};

const TOUR_LABELS: Record<HelpTourId, string> = {
  dashboard: "Resumen",
  conversations: "Conversaciones",
  publications: "Publicaciones",
  documents: "Documentos",
  trash: "Papelera",
};

let activeDriver: ReturnType<typeof driver> | null = null;

function buildSteps(tourId: HelpTourId) {
  const total = TOURS[tourId].length;
  return TOURS[tourId].map((step, index) => ({
    element: step.selector,
    popover: {
      title: `${step.title} (${index + 1}/${total})`,
      description: step.description,
      side: step.side,
      align: step.align,
    },
  }));
}

export function startHelpTour(tourId: HelpTourId): void {
  if (typeof window === "undefined") {
    return;
  }

  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }

  if (document.body) {
    document.body.classList.add("intra-tour-running");
  }

  activeDriver = driver({
    showProgress: true,
    stagePadding: 4,
    popoverClass: "intra-driver-popover",
    allowClose: true,
    disableActiveInteraction: false,
    animate: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    steps: buildSteps(tourId),
    onDestroyStarted: () => {
      if (activeDriver) {
        activeDriver.destroy();
      }
      if (document.body) {
        document.body.classList.remove("intra-tour-running");
      }
      activeDriver = null;
    },
    onDestroyed: () => {
      if (document.body) {
        document.body.classList.remove("intra-tour-running");
      }
      activeDriver = null;
    },
  });

  activeDriver.drive();
}

export function getHelpTourLabel(tourId: HelpTourId): string {
  return TOUR_LABELS[tourId];
}

export function getHelpTourSteps(tourId: HelpTourId): readonly TourStep[] {
  return TOURS[tourId] ?? [];
}