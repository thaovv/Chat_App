import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const useUserStore = create((set) => ({
    currentUser: null,
    isLoading: true,

    fetchUserInfo: async (uid) => {
        if (!uid) {
            return set({ currentUser: null, isLoading: false });
        }

        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // ✅ Gán thêm id (uid) vào currentUser để sử dụng sau này
                set({
                    currentUser: { ...docSnap.data(), id: docSnap.id },
                    isLoading: false,
                });
            } else {
                set({ currentUser: null, isLoading: false });
            }

        } catch (err) {
            console.error("Lỗi khi fetch user:", err);
            set({ currentUser: null, isLoading: false });
        }
    },
}));
