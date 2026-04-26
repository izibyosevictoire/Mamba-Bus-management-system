import api from './client';

export const busService = {
    getAll: () => api.get('/Buses'),
    getById: (id) => api.get(`/Buses/${id}`),
    create: (data) => api.post('/Buses', data),
    update: (id, data) => api.put(`/Buses/${id}`, data),
    delete: (id) => api.delete(`/Buses/${id}`),
};

export const routeService = {
    getAll: () => api.get('/Routes'),
    getById: (id) => api.get(`/Routes/${id}`),
    create: (data) => api.post('/Routes', data),
    update: (id, data) => api.put(`/Routes/${id}`, data),
    delete: (id) => api.delete(`/Routes/${id}`),
};

export const scheduleService = {
    getAll: () => api.get('/Schedules'),
    getById: (id) => api.get(`/Schedules/${id}`),
    create: (data) => api.post('/Schedules', data),
    update: (id, data) => api.put(`/Schedules/${id}`, data),
    delete: (id) => api.delete(`/Schedules/${id}`),
};

export const userService = {
    getAll: () => api.get('/Users'),
    getById: (id) => api.get(`/Users/${id}`),
    update: (id, data) => api.put(`/Users/${id}`, data),
    delete: (id) => api.delete(`/Users/${id}`),
};

export const assignmentService = {
    getAll: () => api.get('/DriverAssignments'),
    getMyAssignment: () => api.get('/DriverAssignments/my-assignment'),
    create: (data) => api.post('/DriverAssignments', data),
    delete: (id) => api.delete(`/DriverAssignments/${id}`)
};

export const agencyService = {
    getAll: () => api.get('/Agencies'),
    getById: (id) => api.get(`/Agencies/${id}`),
    create: (data) => api.post('/Agencies', data),
    update: (id, data) => api.put(`/Agencies/${id}`, data),
    delete: (id) => api.delete(`/Agencies/${id}`),
};

export const ticketService = {
    getAll: () => api.get('/Tickets'),
    getMyTickets: () => api.get('/Tickets/my-tickets'),
    getById: (id) => api.get(`/Tickets/${id}`),
    getByNumber: (number) => api.get(`/Tickets/by-number/${number}`),
    purchase: (data) => api.post('/Tickets/purchase', data),
    purchaseMulti: (data) => api.post('/Tickets/purchase-multi', data),
    getSeats: (scheduleId) => api.get(`/Tickets/seats/${scheduleId}`),
    validate: (ticketId) => api.get(`/Tickets/validate/${ticketId}`),
    validateByNumber: (number) => api.get(`/Tickets/validate/by-number/${number}`),
    markUsed: (ticketId) => api.put(`/Tickets/${ticketId}/mark-used`),
    confirmCashPayment: (ticketId) => api.put(`/Tickets/${ticketId}/confirm-payment`),
    checkDuplicate: (scheduleId, passengerName) =>
        api.get(`/Tickets/check-duplicate`, { params: { scheduleId, passengerName } }),
};
