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
      "Aquí verás un saludo personalizado y los accesos rápidos a mensajes y publicaciones.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='dashboard-stats']",
    title: "Indicadores clave",
    description:
      "Vista rápida de publicaciones, conversaciones y estado de tu sesión.",
    side: "bottom",
    align: "center",
  },
  {
    selector: "[data-tour-id='dashboard-feed']",
    title: "Publicaciones de tu equipo",
    description:
      "Aquí aparecerán las novedades de tus departamentos. Puedes reaccionar o comentar.",
    side: "right",
    align: "start",
  },
  {
    selector: "[data-tour-id='dashboard-chats']",
    title: "Conversaciones recientes",
    description:
      "Accede rápido a tus chats activos sin salir del resumen.",
    side: "left",
    align: "center",
  },
];

const CONVERSATIONS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='conversations-list']",
    title: "Lista de conversaciones",
    description:
      "Aquí ves todas tus conversaciones. Selecciona una para abrirla en el panel de la derecha.",
    side: "right",
    align: "start",
  },
  {
    selector: "[data-tour-id='conversations-messages']",
    title: "Mensajes",
    description:
      "Aquí se cargan y envían los mensajes de la conversación seleccionada.",
    side: "left",
    align: "start",
  },
  {
    selector: "[data-tour-id='conversations-composer']",
    title: "Escribir mensaje",
    description:
      "Escribe y envía mensajes. También puedes adjuntar archivos.",
    side: "top",
    align: "end",
  },
];

const PUBLICATIONS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='publications-form-trigger']",
    title: "Crear publicación",
    description:
      "Este botón abre el formulario para redactar una nueva publicación, adjuntar archivos y elegir si queda visible o cómo borrador.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='publications-list']",
    title: "Listado de publicaciones",
    description:
      "Aquí verás todas las publicaciones. Puedes editarlas o eliminarlas si tienes permisos.",
    side: "top",
    align: "start",
  },
];

const DOCUMENTS_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='documents-search']",
    title: "Buscar documentos",
    description:
      "Filtra por nombre, tipo u origen para encontrar un documento específico.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='documents-filters']",
    title: "Filtros rápidos",
    description:
      "Cambia entre Todos, Chat, Departamento u Otros para acotar la lista.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='documents-list']",
    title: "Lista de archivos",
    description:
      "Aquí aparecen los archivos. Usa el botón Descargar de cada tarjeta para obtenerlos.",
    side: "top",
    align: "start",
  },
];

const TRASH_TOUR: TourStep[] = [
  {
    selector: "[data-tour-id='trash-filters']",
    title: "Filtros",
    description: "Cambia entre Todo, Mensajes o Documentos según lo que necesites revisar.",
    side: "bottom",
    align: "start",
  },
  {
    selector: "[data-tour-id='trash-list']",
    title: "Elementos marcados",
    description:
      "Aquí ves los mensajes y documentos que los líderes marcaron para revisión.",
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