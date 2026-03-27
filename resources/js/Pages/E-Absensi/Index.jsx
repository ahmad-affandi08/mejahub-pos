import { Head, router } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import MobileLayout from "@/layouts/MobileLayout";
import BottomNav from "./components/BottomNav";
import MobileAlertDialog from "./components/MobileAlertDialog";
import MobileTopBar from "./components/MobileTopBar";
import CalendarScreen from "./screens/CalendarScreen";
import FailedRadiusScreen from "./screens/FailedRadiusScreen";
import HistoryDetailScreen from "./screens/HistoryDetailScreen";
import HistoryScreen from "./screens/HistoryScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RequestScreen from "./screens/RequestScreen";
import VerifyFaceScreen from "./screens/VerifyFaceScreen";

const mainViews = ["home", "calendar", "history", "requests", "profile"];

export default function Index({ mobileData, flashMessage }) {
    const profile = mobileData?.profile ?? {
        name: "Karyawan",
        role: "Staff",
        badge: "STAFF",
        shiftLabel: "BELUM DIATUR",
        avatar: null,
    };
    const shiftInfo = mobileData?.shift_info ?? {
        title: "Belum Ada Shift",
        date: "-",
        code: "LOG-000",
        entry: "-",
        exit: "-",
    };
    const summary = mobileData?.weekly_summary ?? [];
    const records = mobileData?.records ?? [];
    const calendarData = mobileData?.calendar_data ?? { month_label: "-", month_key: "-", days: [], summary: {} };
    const requestHistory = mobileData?.request_history ?? [];
    const incomingShiftSwapRequests = mobileData?.incoming_shift_swap_requests ?? [];
    const coworkers = mobileData?.coworkers ?? [];
    const swapContext = mobileData?.swap_context ?? { jabatan: null, self_shift_dates: [] };
    const geoPolicy = mobileData?.geo_policy ?? { radius_meter: 10 };
    const checkinStatus = mobileData?.today_status?.current ?? "BELUM ABSEN";
    const serverTime = mobileData?.today_status?.server_time ?? null;
    const primaryAction = mobileData?.today_status?.primary_action ?? "ABSEN MASUK";
    const primaryJenisAbsen = mobileData?.today_status?.primary_jenis_absen ?? null;
    const canAttend = mobileData?.today_status?.can_attend ?? false;

    const endpoint = "/hr/e-absensi";
    const [activeTab, setActiveTab] = useState("home");
    const [view, setView] = useState("home");
    const [historyFilter, setHistoryFilter] = useState("all");
    const [selectedRecord, setSelectedRecord] = useState(records[0] ?? null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
    const [isCalendarLoading, setIsCalendarLoading] = useState(false);
    const [permissionState, setPermissionState] = useState({
        camera: false,
        location: false,
    });
    const [alertDialog, setAlertDialog] = useState({
        open: false,
        type: "info",
        title: "Informasi",
        message: "",
    });

    const showAlert = (type, title, message) => {
        setAlertDialog({ open: true, type, title, message });
    };

    useEffect(() => {
        let mounted = true;
        let cameraPermission;
        let locationPermission;

        const syncPermissionState = async () => {
            if (!navigator.permissions?.query) {
                return;
            }

            try {
                [cameraPermission, locationPermission] = await Promise.all([
                    navigator.permissions.query({ name: "camera" }),
                    navigator.permissions.query({ name: "geolocation" }),
                ]);

                if (!mounted) return;

                const updatePermission = () => {
                    setPermissionState({
                        camera: cameraPermission.state === "granted",
                        location: locationPermission.state === "granted",
                    });
                };

                updatePermission();
                cameraPermission.onchange = updatePermission;
                locationPermission.onchange = updatePermission;
            } catch {
                // Permissions API tidak selalu tersedia di semua browser.
            }
        };

        syncPermissionState();

        return () => {
            mounted = false;
            if (cameraPermission) cameraPermission.onchange = null;
            if (locationPermission) locationPermission.onchange = null;
        };
    }, []);

    const handlePermissionChange = useCallback((next) => {
        setPermissionState((prev) => ({ ...prev, ...next }));
    }, []);

    useEffect(() => {
        if (flashMessage?.success) {
            showAlert("success", "Berhasil", flashMessage.success);
        }
    }, [flashMessage]);

    const titleSubtitle = useMemo(() => {
        if (view === "verify") return "VERIFIKASI WAJAH";
        if (view === "calendar") return "KALENDER STAFF";
        if (view === "detail") return "DETAIL LOG";
        if (view === "failed") return "ABSENSI GAGAL";
        return "APLIKASI KARYAWAN";
    }, [view]);

    const handleNavChange = (next) => {
        setActiveTab(next);
        setView(next);
    };

    const handleCalendarMonthChange = useCallback((monthKey) => {
        if (!monthKey) {
            return;
        }

        setIsCalendarLoading(true);

        router.get(
            endpoint,
            { calendar_month: monthKey },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onError: () => {
                    showAlert("error", "Gagal Memuat Kalender", "Data kalender tidak dapat dimuat. Silakan coba lagi.");
                },
                onFinish: () => setIsCalendarLoading(false),
            }
        );
    }, []);

    const handleBack = () => {
        if (view === "verify" || view === "failed") {
            setActiveTab("home");
            setView("home");
            return;
        }

        if (view === "detail") {
            setActiveTab("history");
            setView("history");
            return;
        }

        if (view !== "home") {
            setActiveTab("home");
            setView("home");
        }
    };

    const renderView = () => {
        if (view === "home") {
            return (
                <HomeScreen
                    profile={profile}
                    shiftInfo={shiftInfo}
                    summary={summary}
                    checkinStatus={checkinStatus}
                    primaryAction={primaryAction}
                    canAttend={canAttend}
                    serverTime={serverTime}
                    onStartCheckout={() => {
                        if (!canAttend) {
                            showAlert("error", "Absensi Ditolak", "Anda belum memiliki shift aktif hari ini. Hubungi atasan untuk pengaturan jadwal.");
                            return;
                        }

                        setView("verify");
                    }}
                />
            );
        }

        if (view === "history") {
            return (
                <HistoryScreen
                    records={records}
                    activeFilter={historyFilter}
                    onFilterChange={setHistoryFilter}
                    onOpenDetail={(record) => {
                        setSelectedRecord(record);
                        setView("detail");
                    }}
                />
            );
        }

        if (view === "calendar") {
            return (
                <CalendarScreen
                    calendarData={calendarData}
                    loading={isCalendarLoading}
                    onChangeMonth={handleCalendarMonthChange}
                />
            );
        }

        if (view === "requests") {
            return (
                <RequestScreen
                    coworkers={coworkers}
                    swapContext={swapContext}
                    requestHistory={requestHistory}
                    incomingRequests={incomingShiftSwapRequests}
                    processing={isRequestSubmitting}
                    onNotify={(payload) => showAlert(payload?.type || "info", payload?.title || "Informasi", payload?.message || "")}
                    onSubmitRequest={(payload) => {
                        setIsRequestSubmitting(true);
                        router.post(
                            endpoint,
                            {
                                mode: "request",
                                ...payload,
                            },
                            {
                                preserveScroll: true,
                                forceFormData: true,
                                onError: (errors) => {
                                    const firstError = Object.values(errors ?? {}).find((value) => value);
                                    showAlert(
                                        "error",
                                        "Pengajuan Gagal",
                                        firstError ? (Array.isArray(firstError) ? firstError[0] : firstError) : "Pengajuan gagal diproses."
                                    );
                                },
                                onFinish: () => setIsRequestSubmitting(false),
                            }
                        );
                    }}
                    onRespondSwap={(requestId, action) => {
                        setIsRequestSubmitting(true);
                        router.post(
                            endpoint,
                            {
                                mode: "request_action",
                                request_id: requestId,
                                action,
                            },
                            {
                                preserveScroll: true,
                                onError: (errors) => {
                                    const firstError = Object.values(errors ?? {}).find((value) => value);
                                    showAlert(
                                        "error",
                                        "Proses Gagal",
                                        firstError ? (Array.isArray(firstError) ? firstError[0] : firstError) : "Permintaan gagal diproses."
                                    );
                                },
                                onFinish: () => setIsRequestSubmitting(false),
                            }
                        );
                    }}
                />
            );
        }

        if (view === "profile") {
            return (
                <ProfileScreen
                    profile={profile}
                    permissionState={permissionState}
                    onPermissionChange={handlePermissionChange}
                    onNotify={(payload) => showAlert(payload?.type || "info", payload?.title || "Informasi", payload?.message || "")}
                />
            );
        }

        if (view === "verify") {
            return (
                <VerifyFaceScreen
                    geoPolicy={geoPolicy}
                    permissionState={permissionState}
                    onPermissionChange={handlePermissionChange}
                    processing={isSubmitting}
                    onSubmitSuccess={(verificationData) => {
                        setIsSubmitting(true);

                        router.post(
                            endpoint,
                            {
                                jenis_absen: primaryJenisAbsen ?? "masuk",
                                metode_absen: "face",
                                sumber_absen: "web-mobile",
                                status: "hadir",
                                skor_wajah: verificationData?.skor_wajah ?? 98.5,
                                status_verifikasi_wajah: verificationData?.status_verifikasi_wajah ?? "verified",
                                foto_absen: verificationData?.foto_absen,
                                watermark_text: verificationData?.watermark_text,
                                latitude: verificationData?.latitude,
                                longitude: verificationData?.longitude,
                                lokasi_absen: verificationData?.lokasi_absen,
                                radius_meter: verificationData?.radius_meter ?? geoPolicy.radius_meter ?? 10,
                                dalam_radius: verificationData?.dalam_radius,
                                keterangan: primaryAction === "ABSEN MASUK"
                                    ? "Absensi masuk dari aplikasi mobile karyawan."
                                    : primaryAction === "ABSEN PULANG"
                                        ? "Absensi pulang dari aplikasi mobile karyawan."
                                        : "Absensi dari aplikasi mobile karyawan.",
                            },
                            {
                                preserveScroll: true,
                                forceFormData: true,
                                onFinish: () => setIsSubmitting(false),
                                onError: (errors) => {
                                    const firstError = Object.values(errors ?? {}).find((value) => value);
                                    showAlert(
                                        "error",
                                        "Absensi Gagal",
                                        firstError ? (Array.isArray(firstError) ? firstError[0] : firstError) : "Absensi gagal diproses. Silakan coba lagi."
                                    );
                                },
                                onSuccess: () => {
                                    setActiveTab("history");
                                    setView("history");
                                },
                            }
                        );
                    }}
                />
            );
        }

        if (view === "detail") {
            return <HistoryDetailScreen record={selectedRecord} />;
        }

        if (view === "failed") {
            return <FailedRadiusScreen onRetry={() => setView("verify")} onBackHome={() => handleNavChange("home")} />;
        }

        return null;
    };

    const isMainView = mainViews.includes(view);

    return (
        <>
            <Head title="E-Absensi Mobile" />
            <MobileLayout
                header={
                    <MobileTopBar
                        title="E-Absensi"
                        subtitle={titleSubtitle}
                        showBack={view !== "home"}
                        onBack={handleBack}
                    />
                }
                footer={<BottomNav active={isMainView ? activeTab : "home"} onChange={handleNavChange} />}
            >
                {renderView()}
            </MobileLayout>
            <MobileAlertDialog
                open={alertDialog.open}
                onOpenChange={(open) => setAlertDialog((prev) => ({ ...prev, open }))}
                type={alertDialog.type}
                title={alertDialog.title}
                message={alertDialog.message}
            />
        </>
    );
}
