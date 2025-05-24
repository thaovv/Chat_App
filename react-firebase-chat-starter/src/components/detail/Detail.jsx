import "./detail.css";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { auth } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase";

const Detail = () => {
    const {
        chatId,
        user,
        isCurrentUserBlocked,
        isReceiverBlocked,
        changeBlock,
    } = useChatStore();

    const { currentUser } = useUserStore();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        console.log("=== Detail Component Debug ===");
        console.log("chatId:", chatId);
        console.log("user:", user);
        console.log("currentUser:", currentUser);
        console.log("isCurrentUserBlocked:", isCurrentUserBlocked);
        console.log("isReceiverBlocked:", isReceiverBlocked);
        console.log("===============================");
    }, [chatId, user, currentUser, isCurrentUserBlocked, isReceiverBlocked]);

    const handleBlock = async () => {
        if (isLoading) return;

        // Kiểm tra currentUser
        if (!currentUser || !currentUser.uid) {
            console.error("Current user or uid is undefined");
            alert("Lỗi: Thông tin người dùng hiện tại không hợp lệ.");
            return;
        }

        // Kiểm tra user
        if (!user || !user.uid) {
            console.error("User or user.uid is undefined");
            alert("Lỗi: Thông tin người dùng cần chặn không hợp lệ. Vui lòng chọn cuộc trò chuyện.");
            return;
        }

        // Không thể tự chặn chính mình
        if (currentUser.uid === user.uid) {
            alert("Bạn không thể tự chặn chính mình!");
            return;
        }

        setIsLoading(true);

        const userDocRef = doc(db, "users", currentUser.uid);

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked
                    ? arrayRemove(user.uid)
                    : arrayUnion(user.uid),
            });

            changeBlock();

            alert(
                isReceiverBlocked
                    ? `Đã bỏ chặn ${user.username || "người dùng"}`
                    : `Đã chặn ${user.username || "người dùng"}`
            );
        } catch (err) {
            console.error("Block error:", err);
            alert("Lỗi khi thực hiện thao tác chặn: " + (err.message || "Unknown error"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const canShowBlockButton =
        currentUser?.uid && user?.uid && currentUser.uid !== user.uid;

    return (
        <div className="detail">
            <div className="user">
                <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
                <h2>{user?.username || "No user selected"}</h2>
                <p>{user?.email || ""}</p>
            </div>

            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Chat Settings</span>
                        <img src="./arrowUp.png" alt="arrow" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Privacy & help</span>
                        <img src="./arrowUp.png" alt="arrow" />
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared photos</span>
                        <img src="./arrowDown.png" alt="arrow" />
                    </div>
                    <div className="photos">
                        {/* ... danh sách ảnh dùng map render ở đây nếu cần */}
                    </div>
                </div>
                <div className="option">
                    <div className="title">
                        <span>Shared files</span>
                        <img src="./arrowUp.png" alt="arrow" />
                    </div>
                </div>

                {canShowBlockButton && (
                    <button onClick={handleBlock} disabled={isLoading}>
                        {isLoading
                            ? "Đang xử lý..."
                            : isCurrentUserBlocked
                            ? "You are blocked"
                            : isReceiverBlocked
                            ? "Unblock User"
                            : "Block User"}
                    </button>
                )}

                <button className="logout" onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
};

export default Detail;
