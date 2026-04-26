import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import QRCode from 'qrcode';

export const generateTicketPDF = async (ticket) => {
    const doc = new jsPDF({ unit: 'mm', format: [210, 105], orientation: 'landscape' });
    const W = 210, H = 105;

    const darkGreen  = [10,  74,  36];
    const midGreen   = [21, 128,  61];
    const lightGreen = [220, 252, 231];
    const gold       = [202, 138,   4];
    const white      = [255, 255, 255];
    const offWhite   = [248, 250, 248];
    const textDark   = [15,  30,  15];
    const borderGray = [200, 220, 200];

    // Outer card
    doc.setFillColor(...offWhite);
    doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...darkGreen);
    doc.setLineWidth(1.2);
    doc.rect(1, 1, W - 2, H - 2, 'S');

    // Left stub
    const stubW = 38;
    doc.setFillColor(...darkGreen);
    doc.rect(1, 1, stubW, H - 2, 'F');

    // Hex pattern
    doc.setDrawColor(...midGreen);
    doc.setLineWidth(0.3);
    [[10,12],[22,12],[16,20],[10,28],[22,28],[16,36],[10,44],[22,44],[16,52],
     [10,60],[22,60],[16,68],[10,76],[22,76],[16,84],[10,92],[22,92]
    ].forEach(([hx, hy]) => doc.circle(hx, hy, 4, 'S'));

    // Gold brand pill
    doc.setFillColor(...gold);
    doc.roundedRect(4, 5, 30, 10, 1, 1, 'F');
    doc.setTextColor(...darkGreen);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('MAMBA', 19, 11.5, { align: 'center' });
    doc.setTextColor(...white);
    doc.setFontSize(5.5);
    doc.text('BUS MGMT SYSTEM', 19, 22, { align: 'center' });

    // Perforation
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(stubW + 1, 1, stubW + 1, H - 1);
    doc.setLineDashPattern([], 0);

    // Main area
    const mx = stubW + 4;
    const mw = W - mx - 3;

    // Top header bar
    doc.setFillColor(...darkGreen);
    doc.rect(mx, 1, mw, 12, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('MAMBA BUS MANAGEMENT SYSTEM  \u00B7  OFFICIAL TRAVEL TICKET', mx + 3, 8);

    // Ticket ID box
    doc.setFillColor(...midGreen);
    doc.rect(W - 43, 1, 41, 12, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET ID:', W - 41, 6);
    doc.setFontSize(7);
    doc.text(ticket.ticketNumber || String(ticket.ticketId), W - 41, 11);

    // Route row
    doc.setFillColor(...lightGreen);
    doc.rect(mx, 13, mw, 14, 'F');
    const origin = (ticket.origin || 'ORIGIN').toUpperCase();
    const dest   = (ticket.destination || 'DESTINATION').toUpperCase();
    doc.setTextColor(...darkGreen);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(origin, mx + 4, 23);
    doc.text(dest, mx + 82, 23);
    doc.setDrawColor(...midGreen);
    doc.setLineWidth(0.6);
    doc.setLineDashPattern([1.5, 1.5], 0);
    const ox = mx + 4 + doc.getTextWidth(origin) + 3;
    doc.line(ox, 21, mx + 78, 21);
    doc.setLineDashPattern([], 0);
    doc.setFillColor(...midGreen);
    doc.triangle(mx + 78, 21, mx + 75, 19.5, mx + 75, 22.5, 'F');

    // Detail grid
    const gridY = 28;
    const cellH = 18;
    const cols  = [mx, mx + 55, mx + 110];
    const colW  = 52;

    const drawCell = (label, value, x, y, highlight) => {
        doc.setFillColor(highlight ? 220 : 255, highlight ? 252 : 255, highlight ? 231 : 255);
        doc.rect(x, y, colW, cellH, 'F');
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.3);
        doc.rect(x, y, colW, cellH, 'S');
        doc.setFillColor(...darkGreen);
        doc.rect(x, y, colW, 5, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 2, y + 3.8);
        doc.setTextColor(highlight ? midGreen[0] : textDark[0], highlight ? midGreen[1] : textDark[1], highlight ? midGreen[2] : textDark[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const v = String(value || 'N/A');
        doc.text(v.length > 16 ? v.substring(0, 16) + '\u2026' : v, x + 2, y + 14);
    };

    drawCell('Passenger', ticket.passengerName || ticket.clientName, cols[0], gridY);
    drawCell('Seat', ticket.seatNumber ? `Seat ${ticket.seatNumber}` : 'N/A', cols[1], gridY);
    drawCell('Bus', ticket.busNumber || 'N/A', cols[2], gridY);

    const depTime = ticket.departureTime ? format(new Date(ticket.departureTime), 'hh:mm a') : 'N/A';
    const depDate = ticket.departureTime ? format(new Date(ticket.departureTime), 'dd MMMM yyyy') : 'N/A';
    const isPaid  = ticket.paymentStatus === 'Paid' || ticket.status === 'Active';
    const isUsed  = ticket.status === 'Used';
    const statusVal = isUsed ? 'VALIDATED \u2713' : isPaid ? 'CONFIRMED \u2713' : (ticket.paymentStatus || ticket.status || 'PENDING');

    drawCell('Departure', depTime, cols[0], gridY + cellH + 1);
    drawCell('Date', depDate, cols[1], gridY + cellH + 1);
    drawCell('Status', statusVal, cols[2], gridY + cellH + 1, isPaid || isUsed);

    // Bottom strip
    const bottomY = gridY + cellH * 2 + 4;
    const stripH  = H - bottomY - 9;
    doc.setFillColor(...white);
    doc.rect(mx, bottomY, mw, stripH, 'F');
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.rect(mx, bottomY, mw, stripH, 'S');

    // QR code
    const qrSize = stripH - 2;
    try {
        const qrUrl = await QRCode.toDataURL(
            JSON.stringify({ ticketNumber: ticket.ticketNumber, ticketId: ticket.ticketId, passenger: ticket.passengerName || ticket.clientName, seat: ticket.seatNumber }),
            { width: 200, margin: 1, color: { dark: '#0A4A24', light: '#FFFFFF' } }
        );
        doc.setFillColor(...white);
        doc.rect(mx + 1, bottomY + 1, qrSize, qrSize, 'F');
        doc.addImage(qrUrl, 'PNG', mx + 2, bottomY + 1, qrSize - 2, qrSize - 2);
    } catch {
        doc.setFillColor(...lightGreen);
        doc.rect(mx + 1, bottomY + 1, qrSize, qrSize, 'F');
        doc.setTextColor(...darkGreen);
        doc.setFontSize(6);
        doc.text('QR CODE', mx + 1 + qrSize / 2, bottomY + qrSize / 2, { align: 'center' });
    }

    // "Scan to Validate" label
    doc.setTextColor(...midGreen);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('Scan to Validate', mx + 2 + qrSize / 2, bottomY + qrSize + 3, { align: 'center' });

    // Fare info columns
    const infoX = mx + qrSize + 6;
    const infoItems = [
        { label: 'FARE:', value: `${Number(ticket.pricePaid || 0).toLocaleString()} RWF`, color: textDark },
        { label: 'STATUS:', value: ticket.status === 'Used' ? 'Validated' : (ticket.paymentStatus || ticket.status || 'Pending'), color: ticket.status === 'Used' ? midGreen : (ticket.paymentStatus === 'Paid' ? midGreen : gold) },
        { label: 'PAYMENT:', value: ticket.paymentStatus || 'Pending', color: midGreen },
        { label: 'CHECKER:', value: (ticket.status === 'Used') ? 'Used ✓' : 'Not Used', color: (ticket.status === 'Used') ? midGreen : [202, 138, 4] },
    ];

    infoItems.forEach((item, i) => {
        const ix = infoX + i * 34;
        doc.setTextColor(...[100, 120, 100]);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, ix, bottomY + 5);
        doc.setTextColor(...item.color);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, ix, bottomY + 11);
    });

    // Footer bar
    const footerY = H - 8;
    doc.setFillColor(...darkGreen);
    doc.rect(1, footerY, W - 2, 7, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Mamba Bus Management System  \u00B7  ONE TRIP ONLY  \u00B7  Non-transferable  \u00B7  Invalid if tampered', W / 2, footerY + 3.5, { align: 'center' });
    doc.setTextColor(180, 220, 180);
    doc.setFontSize(5.5);
    doc.text('www.mambabms.rw  \u00B7  +250 788 000 000  \u00B7  Kigali, Rwanda', W / 2, footerY + 6.5, { align: 'center' });

    doc.save(`MambaBus_${ticket.ticketNumber || ticket.ticketId}.pdf`);
};
