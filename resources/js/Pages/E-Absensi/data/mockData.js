export const employeeProfile = {
    name: "Sarah J. Doe",
    role: "Koordinator Frontline",
    badge: "LEAD",
    shiftLabel: "SHIFT PAGI",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
};

export const shiftInfo = {
    title: "Shift Pagi",
    date: "Senin, 12 Okt 2026",
    code: "LOG-429",
    entry: "08:00",
    exit: "17:00",
};

export const weeklySummary = [
    { label: "Hadir", value: 5, tone: "default" },
    { label: "Izin", value: 0, tone: "default" },
    { label: "Sakit", value: 1, tone: "warn" },
    { label: "Cuti", value: 0, tone: "default" },
    { label: "Terlambat", value: 0, tone: "default" },
    { label: "Alpha", value: 0, tone: "default" },
];

export const logRecords = [
    {
        id: 1,
        dateShort: "11 OCT 2023",
        dateLong: "12 Oct 2026",
        time: "07:55:12",
        shift: "Pagi",
        type: "Masuk",
        status: "Hadir",
        method: "Wajah",
        source: "Web-Mobile",
        reference: "ABS-20261012-001",
        location: "Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta, 10220",
        latitude: "-6.2088",
        longitude: "106.8456",
        radius: "Di Dalam 10m",
        score: "98.5%",
        verifier: "Lolos Sistem",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&h=500&fit=crop",
    },
    {
        id: 2,
        dateShort: "10 OCT 2023",
        dateLong: "10 Oct 2026",
        time: "17:02:09",
        shift: "Pagi",
        type: "Keluar",
        status: "Hadir",
        method: "Wajah",
        source: "Web-Mobile",
        reference: "ABS-20261010-002",
        location: "Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta, 10220",
        latitude: "-6.2088",
        longitude: "106.8456",
        radius: "Di Dalam 10m",
        score: "97.2%",
        verifier: "Lolos Sistem",
        image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=500&h=500&fit=crop",
    },
];
