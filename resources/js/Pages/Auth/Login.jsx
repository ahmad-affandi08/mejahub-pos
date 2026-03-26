import { Head, Link, useForm } from "@inertiajs/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post("/auth/login", {
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Login" />

            <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,#f8f4ee_0%,#ede8ff_45%,#f6efe8_100%)] px-4 py-8 sm:px-6 lg:px-10">
                <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-[#ff8c57]/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-14 h-72 w-72 rounded-full bg-[#3b0a8a]/20 blur-3xl" />

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
                    <section className="hidden w-full max-w-xl flex-col gap-6 pr-12 lg:flex">
                        <Logo className="mb-4" textClassName="text-6xl" iconClassName="size-8" />
                        <p className="max-w-lg text-2xl leading-snug text-slate-700">
                            Platform operasional FnB modern untuk POS, shift management, dan kontrol harian tim.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
                                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">REALTIME SALES</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">Monitoring transaksi langsung</p>
                            </div>
                            <div className="rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
                                <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">HR & SHIFT</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">Absensi dan jadwal terintegrasi</p>
                            </div>
                        </div>
                    </section>

                    <Card className="ml-auto w-full max-w-md border-white/70 bg-white/85 shadow-2xl backdrop-blur">
                        <CardHeader className="space-y-3">
                            <div className="lg:hidden">
                                <Logo textClassName="text-4xl" iconClassName="size-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Masuk ke Mejahub POS</CardTitle>
                                <CardDescription className="mt-1 text-sm">
                                    Gunakan email dan password akun pegawai untuk masuk.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                {status ? (
                                    <Alert>
                                        <AlertTitle>Info</AlertTitle>
                                        <AlertDescription>{status}</AlertDescription>
                                    </Alert>
                                ) : null}

                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData("email", event.target.value)}
                                        autoComplete="username"
                                        required
                                    />
                                    {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(event) => setData("password", event.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={data.remember}
                                            onCheckedChange={(checked) => setData("remember", checked === true)}
                                        />
                                        <span>Ingat saya</span>
                                    </label>
                                </div>

                                <Button type="submit" className="h-10 w-full" disabled={processing}>
                                    {processing ? "Memproses..." : "Login"}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter>
                            <p className="text-xs text-muted-foreground">
                                Akun login dikelola dari modul Data Pegawai.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </>
    );
}
