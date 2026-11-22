import { Modal as RNModal, ModalProps as RNModalProps, Pressable, View } from "react-native";
import { ToastHost } from "./Toast";

type Variant = "center" | "sheet";

type ModalProps = Omit<RNModalProps, "visible" | "onRequestClose"> & {
    visible: boolean;
    onClose: () => void;
    variant?: Variant;
    dismissOnBackdrop?: boolean;
    className?: string;
};

const containerStyles: Record<Variant, string> = {
    center: "flex-1 items-center justify-center px-6",
    sheet: "flex-1 justify-end",
};

const contentStyles: Record<Variant, string> = {
    center: "w-full max-w-md rounded-md",
    sheet: "w-full rounded-t-md pb-8",
};

const animationTypes: Record<Variant, RNModalProps["animationType"]> = {
    center: "fade",
    sheet: "slide",
};

export function Modal({
    visible,
    onClose,
    variant = "center",
    dismissOnBackdrop = true,
    className = "",
    children,
    ...rest
}: ModalProps) {
    return (
        <RNModal
            visible={visible}
            onRequestClose={onClose}
            transparent
            statusBarTranslucent
            animationType={animationTypes[variant]}
            {...rest}
        >
            <View className={containerStyles[variant]}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close modal"
                    onPress={dismissOnBackdrop ? onClose : undefined}
                    className="absolute inset-0 bg-black/60"
                />
                <View
                    className={`bg-surface border border-border p-4 ${contentStyles[variant]} ${className}`}
                >
                    {children}
                </View>
            </View>
            {/* The native modal window covers the root ToastHost, so toasts render here while it's open. */}
            <ToastHost active={visible} />
        </RNModal>
    );
}