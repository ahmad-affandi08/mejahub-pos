import { Head, router } from "@inertiajs/react";
import { useMemo, useState } from "react";

import MobileLayout from "@/layouts/MobileLayout";
import BottomNav from "./components/BottomNav";
import MobileTopBar from "./components/MobileTopBar";
import FailedRadiusScreen from "./screens/FailedRadiusScreen";
import HistoryDetailScreen from "./screens/HistoryDetailScreen";
import HistoryScreen from "./screens/HistoryScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RequestScreen from "./screens/RequestScreen";
import VerifyFaceScreen from "./screens/VerifyFaceScreen";

const mainViews = ["home", "history", "requests", "profile"];

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
    const requestHistory = mobileData?.request_history ?? [];
    const incomingShiftSwapRequests = mobileData?.incoming_shift_swap_requests ?? [];
    const coworkers = mobileData?.coworkers ?? [];
    const geoPolicy = mobileData?.geo_policy ?? { radius_meter: 10 };
    const checkinStatus = mobileData?.today_status?.current ?? "BELUM ABSEN";
    const serverTime = mobileData?.today_status?.server_time ?? null;
    const primaryAction = mobileData?.today_status?.primary_action ?? "ABSEN PULANG";
    const primaryJenisAbsen = mobileData?.today_status?.primary_jenis_absen ?? "keluar";

    const endpoint = "/hr/e-absensi";
    const [activeTab, setActiveTab] = useState("home");
    const [view, setView] = useState("home");
    const [historyFilter, setHistoryFilter] = useState("all");
    const [selectedRecord, setSelectedRecord] = useState(records[0] ?? null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);

    const titleSubtitle = useMemo(() => {
        if (view === "verify") return "VERIFIKASI WAJAH";
        if (view === "detail") return "DETAIL LOG";
        if (view === "failed") return "ABSENSI GAGAL";
        return "APLIKASI KARYAWAN";
    }, [view]);

    const handleNavChange = (next) => {
        setActiveTab(next);
        setView(next);
    };

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
                    serverTime={serverTime}
                    onStartCheckout={() => setView("verify")}
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

        if (view === "requests") {
            return (
                <RequestScreen
                    coworkers={coworkers}
                    requestHistory={requestHistory}
                    incomingRequests={incomingShiftSwapRequests}
                    processing={isRequestSubmitting}
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
                                onFinish: () => setIsRequestSubmitting(false),
                            }
                        );
                    }}
                />
            );
        }

        if (view === "profile") {
            return <ProfileScreen profile={profile} />;
        }

        if (view === "verify") {
            return (
                <VerifyFaceScreen
                    processing={isSubmitting}
                    onSubmitSuccess={() => {
                        setIsSubmitting(true);
                        router.post(
                            endpoint,
                            {
                                jenis_absen: primaryJenisAbsen,
                                metode_absen: "face",
                                sumber_absen: "web-mobile",
                                status: "hadir",
                                skor_wajah: 98.5,
                                status_verifikasi_wajah: "verified",
                                latitude: -6.2088,
                                longitude: 106.8456,
                                lokasi_absen: "Jl. Sudirman No. 45, Jakarta Pusat, DKI Jakarta, 10220",
                                radius_meter: geoPolicy.radius_meter ?? 10,
                                dalam_radius: true,
                                keterangan: primaryAction === "ABSEN MASUK"
                                    ? "Absensi masuk dari aplikasi mobile karyawan."
                                    : primaryAction === "ABSEN PULANG"
                                        ? "Absensi pulang dari aplikasi mobile karyawan."
                                        : "Absensi dari aplikasi mobile karyawan.",
                            },
                            {
                                preserveScroll: true,
                                onFinish: () => setIsSubmitting(false),
                                onSuccess: () => {
                                    setActiveTab("history");
                                    setView("history");
                                },
                            }
                        );
                    }}
                    onSubmitFailed={() => setView("failed")}
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
                {flashMessage?.success ? (
                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        {flashMessage.success}
                    </div>
                ) : null}
                {renderView()}
            </MobileLayout>
        </>
    );
}
