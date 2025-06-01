'use client';

import React, { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { // Usando import type para clareza e correção
  EventInput,
  EventSourceInput,
  EventSourceFuncArg,
  CalendarApi,
  EventApi,
  EventClickArg
} from '@fullcalendar/core';
import { useApp } from '@/context/AppContext';
import { useQuery, QueryClient, QueryClientProvider, useMutation, useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { format } from 'date-fns';

interface CalendarEvent extends EventInput {
  id?: string;
  description?: string;
  extendedProps?: { 
    description?: string;
    location?: string; 
  };
}

interface EventFormData {
  summary: string;
  start: string;
  end: string;
  description?: string;
}

interface ContactFormData {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  reason: string;
}

const fetchAgendaEvents = async (fetchInfo?: { startStr: string, endStr: string }): Promise<CalendarEvent[]> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  let url = '/edge/v1/agenda/eventos';
  if (fetchInfo) {
    url += `?start_date=${encodeURIComponent(fetchInfo.startStr)}&end_date=${encodeURIComponent(fetchInfo.endStr)}`;
  }
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao buscar eventos'}));
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
    extendedProps: { description: event.description, location: event.location }
  }));
};

const createAgendaEventAPI = async (newEventData: EventFormData): Promise<any> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Usuário não autenticado.');
  const payload = {
    summary: newEventData.summary,
    description: newEventData.description,
    start: { dateTime: new Date(newEventData.start).toISOString() },
    end: { dateTime: new Date(newEventData.end).toISOString() },
  };
  const response = await fetch('/edge/v1/agenda/eventos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao criar evento'}));
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

  const response = await fetch(`/edge/v1/agenda/eventos/${eventId}`, {
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
  
  const response = await fetch(`/edge/v1/agenda/eventos/${eventId}`, {
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

  // O corpo do payload será o contactData diretamente, 
  // a Edge Function decidirá como encaminhar para o N8N.
  const response = await fetch('/edge/v1/secretaria-ia-agendamento/contact-patient', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(contactData)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Falha ao solicitar contato com paciente' }));
    throw new Error(errData.message || 'Falha ao solicitar contato com paciente');
  }
  return response.json(); // A Edge Function pode retornar uma confirmação ou ID de job
};

const queryClientInstance = new QueryClient();

const AgendaPageContent = () => {
  const { setPageTitle } = useApp();
  const tanstackQueryClient = useTanstackQueryClient();
  const calendarRef = useRef<FullCalendar>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState<EventFormData>({
    summary: '', start: '', end: '', description: ''
  });

  const [isViewEditModalOpen, setIsViewEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEventForm, setEditEventForm] = useState<EventFormData | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  // Estados para o modal de Contatar Paciente
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    reason: ''
  });

  useEffect(() => { setPageTitle('Minha Agenda'); }, [setPageTitle]);

  const { isLoading: isLoadingInitialEvents, error: initialEventsError } = useQuery<CalendarEvent[], Error>({
    queryKey: ['agendaEventsInitialLoad'],
    queryFn: () => fetchAgendaEvents(),
    enabled: false,
  });

  const createEventMutation = useMutation<any, Error, EventFormData>({
    mutationFn: createAgendaEventAPI,
    onSuccess: () => {
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsCreateModalOpen(false);
      setNewEventForm({ summary: '', start: '', end: '', description: '' });
      alert('Evento criado!');
    },
    onError: (error) => { alert('Erro ao criar: ' + error.message); }
  });

  const updateEventMutation = useMutation<any, Error, { eventId: string, eventData: Partial<EventFormData> }>({
    mutationFn: updateAgendaEventAPI,
    onSuccess: (data, variables) => {
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      if (variables.eventId === selectedEvent?.id) {
        setIsViewEditModalOpen(false);
        setIsEditingEvent(false);
      }
      alert('Evento atualizado!');
    },
    onError: (error) => { alert('Erro ao atualizar: ' + error.message); }
  });

  const deleteEventMutation = useMutation<void, Error, string>({
    mutationFn: deleteAgendaEventAPI,
    onSuccess: () => {
      tanstackQueryClient.invalidateQueries({ queryKey: ['agendaEvents'] });
      calendarRef.current?.getApi().refetchEvents();
      setIsViewEditModalOpen(false);
      alert('Evento excluído!');
    },
    onError: (error) => { alert('Erro ao excluir: ' + error.message); }
  });

  // Mutation para Contatar Paciente
  const requestContactMutation = useMutation<any, Error, ContactFormData>({
    mutationFn: requestPatientContactAPI,
    onSuccess: (data) => {
      setIsContactModalOpen(false);
      setContactFormData({ patientName: '', patientPhone: '', patientEmail: '', reason: '' });
      alert(data?.message || 'Solicitação de contato enviada com sucesso!'); // TODO: Melhorar msg com base na resposta da API
    },
    onError: (error) => {
      alert('Erro ao solicitar contato: ' + error.message);
    }
  });

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const defaultStartTime = format(arg.date, "yyyy-MM-dd'T'HH:mm");
    const defaultEndTime = format(new Date(arg.date.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
    setNewEventForm({ summary: '', start: defaultStartTime, end: defaultEndTime, description: '' });
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const event = clickInfo.event as EventApi;
    const startStr = event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm") : '';
    const endStr = event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm") : '';
    
    const currentSelectedEventData: CalendarEvent = {
        id: event.id,
        title: event.title,
        start: startStr,
        end: endStr,
        allDay: event.allDay,
        extendedProps: event.extendedProps as CalendarEvent['extendedProps'], 
        description: (event.extendedProps as any)?.description || '' 
    };
    setSelectedEvent(currentSelectedEventData);
    setEditEventForm({ 
        summary: currentSelectedEventData.title || '',
        start: currentSelectedEventData.start?.toString() || '',
        end: currentSelectedEventData.end?.toString() || '',
        description: currentSelectedEventData.description || ''
    });
    setIsEditingEvent(false);
    setIsViewEditModalOpen(true);
  }, []);

  const eventSourceFunc: EventSourceInput = useCallback(async (
    fetchInfo: EventSourceFuncArg, 
    successCallback: (events: EventInput[]) => void, 
    failureCallback: (error: Error) => void
  ) => {
    console.log('FullCalendar solicitando eventos para:', fetchInfo.startStr, fetchInfo.endStr);
    try {
      const events = await fetchAgendaEvents({ startStr: fetchInfo.start.toISOString(), endStr: fetchInfo.end.toISOString() });
      successCallback(events);
    } catch (error) {
      failureCallback(error as Error);
    }
  }, []);

  const handleNewEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewEventForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditEventForm(prev => prev ? ({ ...prev, [e.target.name]: e.target.value }) : null);
  };
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.summary || !newEventForm.start || !newEventForm.end) { alert('Título, Início e Fim são obrigatórios.'); return; }
    if (new Date(newEventForm.start) >= new Date(newEventForm.end)) { alert('A data de término deve ser posterior à data de início.'); return; }
    createEventMutation.mutate(newEventForm);
  };

  const handleUpdateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent?.id || !editEventForm) { alert('Evento não selecionado ou formulário inválido.'); return; }
    if (!editEventForm.summary || !editEventForm.start || !editEventForm.end) { alert('Título, Início e Fim são obrigatórios.'); return; }
    if (new Date(editEventForm.start) >= new Date(editEventForm.end)) { alert('A data de término deve ser posterior à data de início.'); return; }
    updateEventMutation.mutate({ eventId: selectedEvent.id, eventData: editEventForm });
  };

  const handleDeleteEvent = () => {
    if (!selectedEvent?.id) { alert('Nenhum evento selecionado para excluir.'); return; }
    if (window.confirm(`Tem certeza que deseja excluir o evento "${selectedEvent.title}"?`)) {
        deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const handleRequestContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormData.patientName || !contactFormData.patientPhone || !contactFormData.reason) {
      alert('Nome do Paciente, Telefone e Motivo são obrigatórios.');
      return;
    }
    // TODO: Validação de telefone/email (opcional, pode ser feita no backend)
    requestContactMutation.mutate(contactFormData);
  };

  const closeViewEditModal = () => {
    setIsViewEditModalOpen(false);
    setIsEditingEvent(false);
    setSelectedEvent(null);
    setEditEventForm(null);
  };

  const handleEventDrop = useCallback(async (dropInfo: any) => {
    const { event, oldEvent, revert } = dropInfo;
    if (!event.id) {
      revert();
      return;
    }

    const newStart = event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : null;
    const newEnd = event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm:ss") : (newStart ? format(new Date(new Date(newStart).getTime() + (oldEvent.end.getTime() - oldEvent.start.getTime())), "yyyy-MM-dd'T'HH:mm:ss") : null) ;

    if (!newStart) {
      revert();
      return;
    }

    const updatedData: Partial<EventFormData> = {
      start: newStart,
      end: newEnd || newStart,
    };

    try {
      await updateEventMutation.mutateAsync({ eventId: event.id, eventData: updatedData });
    } catch (error) {
      alert('Falha ao mover o evento. Revertendo.');
      revert();
    }
  }, [updateEventMutation]);

  const handleEventResize = useCallback(async (resizeInfo: any) => {
    const { event, revert } = resizeInfo;
    if (!event.id) {
      revert();
      return;
    }

    const newStart = event.start ? format(event.start, "yyyy-MM-dd'T'HH:mm:ss") : null;
    const newEnd = event.end ? format(event.end, "yyyy-MM-dd'T'HH:mm:ss") : null;

    if (!newStart || !newEnd) {
      revert();
      return;
    }

    const updatedData: Partial<EventFormData> = {
      start: newStart,
      end: newEnd,
    };

    try {
      await updateEventMutation.mutateAsync({ eventId: event.id, eventData: updatedData });
    } catch (error) {
      alert('Falha ao redimensionar o evento. Revertendo.');
      revert();
    }
  }, [updateEventMutation]);

  if (initialEventsError && !isLoadingInitialEvents) {
      return <div className="container mx-auto p-4">Erro ao carregar dados iniciais da agenda: {initialEventsError.message}</div>;
  }
  
  return (
    <>
      <div className="container mx-auto p-4 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Minha Agenda</h1>
          <div>
            <button 
              onClick={() => {
                const now = new Date();
                const defaultStartTime = format(now, "yyyy-MM-dd'T'HH:mm");
                const defaultEndTime = format(new Date(now.getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm");
                setNewEventForm({ summary: '', start: defaultStartTime, end: defaultEndTime, description: '' });
                setIsCreateModalOpen(true);
              }}
              className="btn-primary mr-2"
            >
              + Novo Evento
            </button>
            <button 
              onClick={() => setIsContactModalOpen(true)} 
              className="btn-secondary"
            >
              Contatar Paciente
            </button>
          </div>
        </div>

        {(isLoadingInitialEvents) && <div className="text-center py-4">Carregando eventos iniciais...</div>}
        <div className="flex-grow" style={{ minHeight: '70vh' }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            locale='pt-br'
            buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
            events={eventSourceFunc} 
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
          />
        </div>
      </div>

      {/* Modal de Criação de Evento */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-25" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">Criar Novo Evento</Dialog.Title>
              <form onSubmit={handleCreateEventSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="summary-create" className="block text-sm font-medium text-gray-700">Título</label>
                  <input type="text" name="summary" id="summary-create" value={newEventForm.summary} onChange={handleNewEventFormChange} required className="input-field"/>
                </div>
                <div>
                  <label htmlFor="start-create" className="block text-sm font-medium text-gray-700">Início</label>
                  <input type="datetime-local" name="start" id="start-create" value={newEventForm.start} onChange={handleNewEventFormChange} required className="input-field"/>
                </div>
                <div>
                  <label htmlFor="end-create" className="block text-sm font-medium text-gray-700">Fim</label>
                  <input type="datetime-local" name="end" id="end-create" value={newEventForm.end} onChange={handleNewEventFormChange} required className="input-field"/>
                </div>
                <div>
                  <label htmlFor="description-create" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label>
                  <textarea name="description" id="description-create" rows={3} value={newEventForm.description || ''} onChange={handleNewEventFormChange} className="input-field h-auto"/>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                  <button type="submit" disabled={createEventMutation.isPending} className="btn-primary">
                    {createEventMutation.isPending ? 'Criando...' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
          </div></div>
        </Dialog>
      </Transition>

      {/* Modal de Visualização/Edição de Evento */}
      <Transition appear show={isViewEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={closeViewEditModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-35" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {isEditingEvent ? 'Editar Evento' : selectedEvent?.title || 'Detalhes do Evento'}
              </Dialog.Title>
              
              {selectedEvent && editEventForm && (
                <form onSubmit={isEditingEvent ? handleUpdateEventSubmit: (e) => e.preventDefault()} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="summary-edit" className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="summary" id="summary-edit" value={editEventForm.summary} onChange={handleEditEventFormChange} required={isEditingEvent} readOnly={!isEditingEvent} className={`input-field ${!isEditingEvent ? 'bg-gray-100' : ''}`}/>
                  </div>
                  <div>
                    <label htmlFor="start-edit" className="block text-sm font-medium text-gray-700">Início</label>
                    <input type="datetime-local" name="start" id="start-edit" value={editEventForm.start} onChange={handleEditEventFormChange} required={isEditingEvent} readOnly={!isEditingEvent} className={`input-field ${!isEditingEvent ? 'bg-gray-100' : ''}`}/>
                  </div>
                  <div>
                    <label htmlFor="end-edit" className="block text-sm font-medium text-gray-700">Fim</label>
                    <input type="datetime-local" name="end" id="end-edit" value={editEventForm.end} onChange={handleEditEventFormChange} required={isEditingEvent} readOnly={!isEditingEvent} className={`input-field ${!isEditingEvent ? 'bg-gray-100' : ''}`}/>
                  </div>
                  <div>
                    <label htmlFor="description-edit" className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea name="description" id="description-edit" rows={3} value={editEventForm.description || ''} onChange={handleEditEventFormChange} readOnly={!isEditingEvent} className={`input-field h-auto ${!isEditingEvent ? 'bg-gray-100' : ''}`}/>
                  </div>
                  
                  {selectedEvent.extendedProps?.location && !isEditingEvent && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-sm font-medium text-gray-700">Local:</p>
                          <p className="text-sm text-gray-600">{selectedEvent.extendedProps.location}</p>
                      </div>
                  )}

                  <div className="mt-6 flex justify-between items-center">
                    <div> 
                      {!isEditingEvent && (
                        <button type="button" className="btn-primary mr-2" onClick={() => setIsEditingEvent(true)}>
                          Editar
                        </button>
                      )}
                      {isEditingEvent && (
                        <button type="button" className="btn-secondary mr-2" onClick={() => {
                           setIsEditingEvent(false);
                           if (selectedEvent) {
                            const startStr = selectedEvent.start ? format(new Date(selectedEvent.start.toString()), "yyyy-MM-dd'T'HH:mm") : '';
                            const endStr = selectedEvent.end ? format(new Date(selectedEvent.end.toString()), "yyyy-MM-dd'T'HH:mm") : '';
                            setEditEventForm({
                                summary: selectedEvent.title || '',
                                start: startStr,
                                end: endStr,
                                description: selectedEvent.description || selectedEvent.extendedProps?.description || ''
                            });
                           }
                        }}>
                          Cancelar Edição
                        </button>
                      )}
                       <button
                        type="button"
                        onClick={handleDeleteEvent}
                        disabled={deleteEventMutation.isPending || isEditingEvent}
                        className={`btn-danger ${isEditingEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {deleteEventMutation.isPending ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                    <div> 
                      {isEditingEvent && (
                        <button type="submit" disabled={updateEventMutation.isPending} className="btn-primary">
                          {updateEventMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                      )}
                      {!isEditingEvent && (
                         <button type="button" className="btn-secondary" onClick={closeViewEditModal}>Fechar</button>
                      )}
                    </div>
                  </div>
                </form>
              )}
              {!selectedEvent && <div className="p-4 text-center">Carregando detalhes do evento...</div>}

            </Dialog.Panel>
          </Transition.Child>
          </div></div>
        </Dialog>
      </Transition>

      {/* Modal para Contatar Paciente */}
      <Transition appear show={isContactModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={() => setIsContactModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black bg-opacity-40" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">Contatar Paciente/Lead</Dialog.Title>
              <form onSubmit={handleRequestContactSubmit} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Nome do Paciente/Lead <span className="text-red-500">*</span></label>
                  <input type="text" name="patientName" id="patientName" value={contactFormData.patientName} onChange={handleContactFormChange} required className="input-field"/>
                </div>
                <div>
                  <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700">Telefone <span className="text-red-500">*</span></label>
                  <input type="tel" name="patientPhone" id="patientPhone" value={contactFormData.patientPhone} onChange={handleContactFormChange} required className="input-field" placeholder="(XX) XXXXX-XXXX"/>
                </div>
                <div>
                  <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700">Email (Opcional)</label>
                  <input type="email" name="patientEmail" id="patientEmail" value={contactFormData.patientEmail || ''} onChange={handleContactFormChange} className="input-field"/>
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motivo do Contato / Tipo de Consulta <span className="text-red-500">*</span></label>
                  <textarea name="reason" id="reason" rows={4} value={contactFormData.reason} onChange={handleContactFormChange} required className="input-field h-auto" placeholder="Ex: Paciente João referiu interesse em agendar uma consulta de rotina."/>
                </div>
                <div className="mt-8 flex justify-end space-x-3">
                  <button type="button" className="btn-secondary" onClick={() => setIsContactModalOpen(false)}>Cancelar</button>
                  <button type="submit" disabled={requestContactMutation.isPending} className="btn-primary">
                    {requestContactMutation.isPending ? 'Enviando Solicitação...' : 'Solicitar Contato'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
          </div></div>
        </Dialog>
      </Transition>

    </>
  );
};

const AgendaPage = () => {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AgendaPageContent />
    </QueryClientProvider>
  );
};

export default AgendaPage; 