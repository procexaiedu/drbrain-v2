'use client';

import React, { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventInput, EventSourceInput, EventSourceFuncArg, EventApi, EventClickArg, FormatterInput } from '@fullcalendar/core';
import { useApp } from '@/context/AppContext';
import { useQuery, QueryClient, QueryClientProvider, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import { Toaster, toast } from 'sonner';
import { PlusIcon, UserPlusIcon, PencilIcon, TrashIcon, XMarkIcon, CalendarDaysIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'; // Para selects, se necessário

// --- Interfaces --- 
interface CalendarEvent extends EventInput {
  id?: string;
  description?: string;
  location?: string; // Adicionado para videoconferência
  gmeetLink?: string; // Adicionado para link do Google Meet
  extendedProps?: {
    description?: string;
    location?: string;
    gmeetLink?: string;
  };
}

interface EventFormData {
  summary: string;
  start: string;
  end: string;
  description?: string;
  addGoogleMeet?: boolean;
  location?: string; // Para o link da videoconferência
}

interface ContactFormData {
  patientId: string; // Alterado para ID, assumindo que PatientSelect retornará um ID
  reason: string;
  // patientName e patientPhone seriam buscados com base no patientId ou passados separadamente se necessário
}

// --- Configurações Globais --- 
const queryClientInstance = new QueryClient();

// --- Funções de API (sem alterações de lógica, apenas ajustes menores se necessário) --- 
const fetchAgendaEvents = async (fetchInfo?: { startStr: string, endStr: string }): Promise<CalendarEvent[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    toast.error('Sessão inválida. Por favor, faça login novamente.');
    throw new Error('Usuário não autenticado.');
  }
  let url = '/edge/v1/agenda-crud-events';
  if (fetchInfo) {
    url += `?start_date=${encodeURIComponent(fetchInfo.startStr)}&end_date=${encodeURIComponent(fetchInfo.endStr)}`;
  }
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao buscar eventos' }));
    throw new Error(errData.message || 'Falha ao buscar eventos');
  }
  const data = await response.json();
  return (data || []).map((event: any) => ({
    id: event.id,
    title: event.summary || event.title || 'Evento sem título',
    start: event.start?.dateTime || event.start?.date || event.start,
    end: event.end?.dateTime || event.end?.date || event.end,
    allDay: !!event.start?.date && !event.start?.dateTime,
    description: event.description,
    location: event.location, // Mapeando location para a videoconferência
    gmeetLink: event.hangoutLink, // Assumindo que o link do Meet venha como hangoutLink
    extendedProps: {
      description: event.description,
      location: event.location,
      gmeetLink: event.hangoutLink
    }
  }));
};

const createAgendaEventAPI = async (newEventData: EventFormData): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  const payload: any = {
    summary: newEventData.summary,
    description: newEventData.description,
    start: { dateTime: new Date(newEventData.start).toISOString() },
    end: { dateTime: new Date(newEventData.end).toISOString() },
  };
  if (newEventData.addGoogleMeet) {
    // A lógica de adicionar conferência será tratada pela Edge Function
    payload.conferenceData = { createRequest: { requestId: `drbrain-meet-${Date.now()}` } };
  }
  const response = await fetch('/edge/v1/agenda-crud-events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao criar evento' }));
    throw new Error(errData.message || 'Falha ao criar evento');
  }
  return response.json();
};

const updateAgendaEventAPI = async ({ eventId, eventData }: { eventId: string, eventData: Partial<EventFormData> }): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  
  const payload: any = { ...eventData };
  if (eventData.start) payload.start = { dateTime: new Date(eventData.start).toISOString() };
  if (eventData.end) payload.end = { dateTime: new Date(eventData.end).toISOString() };

  const response = await fetch(`/edge/v1/agenda-crud-events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao atualizar evento'}));
    throw new Error(errData.message || 'Falha ao atualizar evento');
  }
  return response.json();
};

const deleteAgendaEventAPI = async (eventId: string): Promise<void> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  
  const response = await fetch(`/edge/v1/agenda-crud-events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    if (response.status === 204) return; 
    const errData = await response.json().catch(() => ({ message: 'Falha ao excluir evento'}));
    throw new Error(errData.message || 'Falha ao excluir evento');
  }
  if(response.status === 204) return;
};

// API para solicitar contato com paciente
const requestPatientContactAPI = async (contactData: ContactFormData): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  const response = await fetch('/edge/v1/secretaria-ia-agendamento/contact-patient', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData) // Incluindo patientId
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao solicitar contato' }));
    throw new Error(errData.message || 'Falha ao solicitar contato');
  }
  return response.json();
};

// --- Componente Principal da Agenda --- 
const AgendaPageContent = () => {
  const { setPageTitle } = useApp();
  const tanstackQueryClient = useTanstackQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  // Estados dos Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Estado para Formulários e Evento Selecionado
  const [newEventForm, setNewEventForm] = useState<EventFormData>({ summary: '', start: '', end: '', description: '', addGoogleMeet: false });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventForm, setEditEventForm] = useState<EventFormData | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({ patientId: '', reason: '' });

  const [isSubmittingModal, setIsSubmittingModal] = useState(false); // Estado de loading para botões de submissão dos modais

  useEffect(() => { setPageTitle('Minha Agenda'); }, [setPageTitle]);

  // --- TanStack Queries e Mutations --- 
  const { data: events, isLoading: isLoadingEvents, error: eventsError, refetch: refetchCalendarEvents } = useQuery<CalendarEvent[], Error>({
    queryKey: ['agendaEvents'],
    queryFn: () => fetchAgendaEvents(), // Para carga inicial e refetch manual
    // staleTime: 5 * 60 * 1000, // Exemplo: Cache por 5 minutos
  });

  const eventSourceFunc: EventSourceInput = useCallback(async (
    fetchInfo: EventSourceFuncArg, 
    successCallback: (events: EventInput[]) => void, 
    failureCallback: (error: Error) => void
  ) => {
    try {
      const fetchedEvents = await fetchAgendaEvents({ startStr: fetchInfo.startStr, endStr: fetchInfo.endStr });
      successCallback(fetchedEvents);
    } catch (error: any) {
      toast.error(`Erro ao carregar eventos: ${error.message}`);
      failureCallback(error as Error);
    }
  }, []);

  const createEventMutation = useMutation<any, Error, EventFormData>({
    mutationFn: createAgendaEventAPI,
    onSuccess: (data) => {
      toast.success('Evento criado com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsCreateModalOpen(false);
      setNewEventForm({ summary: '', start: '', end: '', description: '', addGoogleMeet: false });
    },
    onError: (error) => {
      toast.error(`Falha ao criar evento: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });
  
  const updateEventMutation = useMutation<any, Error, { eventId: string, eventData: Partial<EventFormData> }>({
    mutationFn: updateAgendaEventAPI,
    onSuccess: (data, variables) => {
      toast.success('Evento atualizado com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsViewEditModalOpen(false);
      setIsEditingEvent(false);
    },
    onError: (error) => {
      toast.error(`Falha ao atualizar evento: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: deleteAgendaEventAPI,
    onSuccess: () => {
      toast.success('Evento excluído com sucesso!');
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsViewEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(`Falha ao excluir evento: ${error.message}`);
    }
  });

  const requestContactMutation = useMutation<any, Error, ContactFormData>({
    mutationFn: requestPatientContactAPI,
    onSuccess: (data) => {
      toast.success(data?.message || 'Solicitação de contato enviada com sucesso!');
      setIsContactModalOpen(false);
      setContactFormData({ patientId: '', reason: '' });
    },
    onError: (error) => {
      toast.error(`Falha ao solicitar contato: ${error.message}`);
    },
    onSettled: () => {
      setIsSubmittingModal(false);
    }
  });

  // --- Handlers de Interação do Calendário e Modais --- 
  const handleDateClick = (arg: DateClickArg) => {
    const defaultStartTime = format(arg.date, 'yyyy-MM-dd\'T\'HH:mm');
    const defaultEndTime = format(new Date(arg.date.getTime() + 60 * 60 * 1000), 'yyyy-MM-dd\'T\'HH:mm'); // Adiciona 1 hora
    setNewEventForm({ 
        summary: '', 
        start: defaultStartTime, 
        end: defaultEndTime, 
        description: '', 
        addGoogleMeet: false 
    });
    setIsCreateModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      description: event.extendedProps.description,
      location: event.extendedProps.location, 
      gmeetLink: event.extendedProps.gmeetLink,
      extendedProps: event.extendedProps
    });
    setEditEventForm({
      summary: event.title,
      start: format(parseISO(event.startStr), "yyyy-MM-dd'T'HH:mm"), // Formatar para datetime-local
      end: event.endStr ? format(parseISO(event.endStr), "yyyy-MM-dd'T'HH:mm") : '',
      description: event.extendedProps.description || '',
      addGoogleMeet: !!event.extendedProps.gmeetLink, // ou event.extendedProps.location
      location: event.extendedProps.location
    });
    setIsEditingEvent(false); // Inicia em modo de visualização
    setIsViewEditModalOpen(true);
  };
  
  // Handlers para eventDrop e eventResize (arrastar e redimensionar)
  const handleEventDropOrResize = async (changeInfo: { event: EventApi, oldEvent: EventApi, revert: () => void }) => {
    const { event } = changeInfo;
    if (!event.id) {
        toast.error("ID do evento não encontrado para atualização.");
        changeInfo.revert();
        return;
    }
    const updatedEventData: Partial<EventFormData> = {
        summary: event.title,
        start: event.startStr,
        end: event.endStr,
        // addGoogleMeet e description não são alterados por drag/resize diretamente
    };
    try {
        setIsSubmittingModal(true); // Indicar loading global ou específico do calendário
        await updateEventMutation.mutateAsync({ eventId: event.id, eventData: updatedEventData });
        // toast já é tratado no onSuccess da mutação
    } catch (error: any) {
        toast.error(`Falha ao mover/redimensionar evento: ${error.message}`);
        changeInfo.revert(); // Reverte a alteração no calendário em caso de erro
    } finally {
        setIsSubmittingModal(false);
    }
  };

  // --- Handlers de Formulário --- 
  const handleNewEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewEventForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };
  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setEditEventForm(prev => prev ? ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }) : null);
  };
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.summary || !newEventForm.start || !newEventForm.end) {
      toast('Título, Início e Fim são obrigatórios.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    if (new Date(newEventForm.start) >= new Date(newEventForm.end)) {
      toast('A data de término deve ser posterior à data de início.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    setIsSubmittingModal(true);
    createEventMutation.mutate(newEventForm);
  };

  const handleUpdateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent?.id || !editEventForm) {
      toast.error('Erro interno: Evento não selecionado ou formulário inválido.');
      return;
    }
    if (!editEventForm.summary || !editEventForm.start || !editEventForm.end) {
      toast('Título, Início e Fim são obrigatórios.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    if (new Date(editEventForm.start) >= new Date(editEventForm.end)) {
      toast('A data de término deve ser posterior à data de início.', {
        action: { label: 'Ok', onClick: () => {} },
      });
      return;
    }
    setIsSubmittingModal(true);
    updateEventMutation.mutate({ eventId: selectedEvent.id, eventData: editEventForm });
  };

  const handleDeleteCurrentEvent = () => {
    if (!selectedEvent?.id) {
      toast.error('Nenhum evento selecionado para excluir.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir o evento "${selectedEvent.title}"?`)) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const handleRequestContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormData.patientId || !contactFormData.reason) {
      toast('Paciente e Motivo do contato são obrigatórios.', {
        action: { label: 'Ok', onClick: () => {} }, 
      });
      return;
    }
    setIsSubmittingModal(true);
    requestContactMutation.mutate(contactFormData);
  };
  
  const closeViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setSelectedEvent(null);
    setEditEventForm(null);
    setIsEditingEvent(false);
  };

  // --- Renderização do Conteúdo do Evento no Calendário (Exemplo) --- 
  const renderEventContent = (eventInfo: any) => {
    const isPastEvent = eventInfo.event.end && new Date(eventInfo.event.end) < new Date();
    const opacityClass = isPastEvent ? 'opacity-60' : '';

    return (
      <div className={`p-1.5 rounded-md h-full flex flex-col justify-center ${opacityClass} transition-colors duration-150 ease-in-out group hover:bg-indigo-50 dark:hover:bg-gray-700`}>
        <div className="flex items-center justify-between">
          <b className={`text-xs font-semibold truncate ${isPastEvent ? 'text-gray-500 dark:text-gray-400' : 'text-indigo-700 dark:text-indigo-300'} group-hover:text-indigo-800 dark:group-hover:text-indigo-200`}>
            {eventInfo.timeText}
          </b>
          {eventInfo.event.extendedProps.gmeetLink && (
            <VideoCameraIcon className={`w-3.5 h-3.5 ${isPastEvent ? 'text-gray-400 dark:text-gray-500' : 'text-blue-500 dark:text-blue-400'} group-hover:text-blue-600 dark:group-hover:text-blue-300`} />
          )}
        </div>
        <p className={`mt-0.5 text-xs leading-tight truncate ${isPastEvent ? 'text-gray-600 dark:text-gray-300' : 'text-gray-700 dark:text-gray-200'} group-hover:text-gray-800 dark:group-hover:text-gray-100`}>
          {eventInfo.event.title}
        </p>
        {eventInfo.event.extendedProps.description && (
          <p className={`mt-0.5 text-[11px] leading-tight text-gray-500 dark:text-gray-400 truncate group-hover:text-gray-600 dark:group-hover:text-gray-300`}>
            {eventInfo.event.extendedProps.description}
          </p>
        )}
      </div>
    );
  };

  // --- JSX Principal --- 
  return (
    <>
      <Toaster richColors position="top-right" />
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <header className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            {/* Título omitido pois é gerenciado pelo AppContext */}
            <div className="flex items-center space-x-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                disabled={isSubmittingModal} 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition ease-in-out duration-150"
              >
                <UserPlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                Contatar Paciente
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  setNewEventForm({ 
                    summary: '', 
                    start: `${todayStr}T09:00`, 
                    end: `${todayStr}T10:00`, 
                    description: '', 
                    addGoogleMeet: false 
                  });
                  setIsCreateModalOpen(true);
                }}
                disabled={isSubmittingModal}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition ease-in-out duration-150"
              >
                <PlusIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
                Novo Evento
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow min-h-0 bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden p-1 sm:p-2 md:p-4">
          {isLoadingEvents && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400 text-lg">Carregando agenda...</p>
              {/* TODO: Adicionar um Skeleton Loader elegante aqui */}
            </div>
          )}
          {eventsError && (
            <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-center">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Ops! Algo deu errado.</h3>
              <p className="text-red-600 dark:text-red-400 mt-1">Não foi possível carregar os eventos da agenda: {eventsError.message}</p>
              <button 
                onClick={() => refetchCalendarEvents()} 
                className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Tentar Novamente
              </button>
            </div>
          )}
          {!isLoadingEvents && !eventsError && (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
              locale='pt-br'
              initialView="timeGridWeek"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              events={eventSourceFunc}
              height="100%"
              contentHeight="auto"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDropOrResize}
              eventResize={handleEventDropOrResize}
              eventContent={renderEventContent}
              viewClassNames="bg-white dark:bg-gray-800 rounded-lg shadow"
              eventClassNames="border-none rounded-lg shadow-sm"
              buttonHints={{
                prev: 'Mês anterior',
                next: 'Próximo mês',
                today: 'Hoje',
                month: 'Visualizar mês',
                week: 'Visualizar semana',
                day: 'Visualizar dia'
              }}
            />
          )}
        </main>

        {/* Modais (placeholders como antes) */}
        {isCreateModalOpen && ( <div/>)}
        {isViewEditModalOpen && ( <div/>)}
        {isContactModalOpen && ( <div/>)}
      </div>
    </>
  );
};

// --- Componente Wrapper da Página e Provedor React Query --- 
const AgendaPage = () => {
  // queryClientInstance é definido fora para não ser recriado em cada render
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AgendaPageContent />
    </QueryClientProvider>
  );
};

export default AgendaPage; 