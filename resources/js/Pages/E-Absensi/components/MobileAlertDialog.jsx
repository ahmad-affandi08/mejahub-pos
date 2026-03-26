import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function getDialogStyle(type) {
    if (type === "success") {
        return {
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-700" />,
            iconClass: "bg-emerald-100",
            actionClass: "bg-emerald-600 hover:bg-emerald-700",
        };
    }

    if (type === "error") {
        return {
            icon: <AlertTriangle className="h-5 w-5 text-rose-700" />,
            iconClass: "bg-rose-100",
            actionClass: "bg-rose-600 hover:bg-rose-700",
        };
    }

    return {
        icon: <Info className="h-5 w-5 text-blue-700" />,
        iconClass: "bg-blue-100",
        actionClass: "bg-[#22005f] hover:bg-[#2d0a74]",
    };
}

export default function MobileAlertDialog({
    open,
    onOpenChange,
    type = "info",
    title = "Informasi",
    message,
    actionLabel = "Tutup",
}) {
    const style = getDialogStyle(type);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent size="sm" className="w-[calc(100%-2rem)] rounded-2xl">
                <AlertDialogHeader>
                    <AlertDialogMedia className={style.iconClass}>{style.icon}</AlertDialogMedia>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{message}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction className={style.actionClass}>{actionLabel}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
