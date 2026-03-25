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

            <main className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Masuk ke Mejahub POS</CardTitle>
                        <CardDescription>
                            Gunakan email dan password akun pegawai untuk masuk.
                        </CardDescription>
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

                                <Link href="/" className="text-sm underline underline-offset-4">
                                    Kembali
                                </Link>
                            </div>

                            <Button type="submit" className="w-full" disabled={processing}>
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
            </main>
        </>
    );
}
