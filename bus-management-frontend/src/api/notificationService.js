import api from './client';

export const notificationService = {
    getMyNotifications: () => api.get('/Notifications'),
    markAsRead: (id) => api.put(`/Notifications/${id}/read`),
    markAllAsRead: () => api.put('/Notifications/read-all'),
    sendEmergencyAlert: (data) => api.post('/Notifications/emergency-alert', data),
    sendTripUpdate: (data) => api.post('/Notifications/trip-update', data),
    respondToAssignment: (id, status) => api.put(`/DriverAssignments/${id}/respond`, { status })
};
